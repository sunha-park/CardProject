from flask import request, Blueprint, jsonify
import mysql.connector
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from xgboost import XGBRegressor
from flask_cors import CORS
import numpy as np
from datetime import datetime

# ---------------------------- Blueprint 생성 ----------------------------
cardbenefit_api = Blueprint('cardbenefit_api', __name__)
CORS(cardbenefit_api, resources={r"/api/*": {"origins": "http://34.47.73.162:3000"}})

# ---------------------------- DB 연결 ----------------------------
def get_connection():
    return mysql.connector.connect(
        host='localhost', user='card', password='1234', database='card'
    )

# ---------------------------- Rule 기반 점수 계산 ----------------------------
category_keywords = {
    "shopping_amount": ["쇼핑", "마켓", "백화점", "쿠팡", "이마트"],
    "transport_amount": ["대중교통", "버스", "지하철", "택시", "주유"],
    "dining_amount": ["외식", "음식점", "배달", "요식"],
    "medical_amount": ["병원", "약국", "건강", "의료"],
    "education_amount": ["교육", "학원", "도서", "온라인 강의"],
    "leisure_amount": ["여가", "레저", "놀이공원", "헬스"],
    "social_amount": ["사교", "카페", "술집", "모임"],
    "daily_amount": ["일상", "편의점", "마트", "생활비"],
    "overseas_amount": ["해외", "여행", "면세점", "환전"]
}

def calc_rule_score(member, benefits):
    score = 0
    for category, keywords in category_keywords.items():
        for keyword in keywords:
            if keyword in (benefits or ''):
                value = member.get(category)
                score += value if isinstance(value, (int, float)) and value is not None else 0
                break
    return score

# ---------------------------- TF-IDF 기반 점수 계산 ----------------------------
def calc_tfidf_score(member, all_cards):
    texts = [card['benefits'] or '' for card in all_cards]
    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform(texts)

    # member 소비 벡터 생성
    keyword_text = []
    for cat in category_keywords:
        value = member.get(cat, 0) or 0
        keyword_text.extend([cat] * int(value // 10000))
        
    member_doc = ' '.join(keyword_text)
    member_vec = vectorizer.transform([member_doc])

    scores = cosine_similarity(member_vec, tfidf_matrix).flatten()
    return scores  # 카드 순서와 매칭됨

# ---------------------------- ML 예측 점수 계산 ----------------------------
def predict_score_XGB_with_tfidf(member, all_cards):
    # 카드 혜택 텍스트 벡터화
    benefit_texts = [card['benefits'] or '' for card in all_cards]
    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform(benefit_texts).toarray()  # shape: (n_cards, n_features)
    X = []
    y = []
    for idx, card in enumerate(all_cards):
        # 규칙 기반 점수 → y 값
        rule_score = calc_rule_score(member, card['benefits'])
        y.append(rule_score)

        # 고객 소비 피처 (숫자 5개)
        customer_features = [
            member.get('shopping_amount', 0),
            member.get('transport_amount', 0),
            member.get('dining_amount', 0),
            member.get('medical_amount', 0),
            member.get('education_amount', 0),
        ]

        # 카드 혜택 텍스트의 TF-IDF 벡터
        card_text_vector = tfidf_matrix[idx]

        # 최종 피처 = 소비 + 텍스트 벡터
        combined_features = customer_features + list(card_text_vector)
        X.append(combined_features)

    model = XGBRegressor()
    model.fit(X, y)
    return model.predict(X)  # 카드별 예측 점수

# ---------------------------- 정규화 함수 ----------------------------
def normalize(score_list):
    min_score = min(score_list)
    max_score = max(score_list)
    if max_score - min_score == 0:
        return [0.0] * len(score_list)
    return [(s - min_score) / (max_score - min_score) for s in score_list]

# ---------------------------- 추천 로그 저장 ----------------------------
def log_recommendation(conn, member_id, method, card, score):
    cursor = conn.cursor()
    domestic_fee = card.get('annul_fee_domestic') or 0
    foreign_fee = card.get('annul_fee_foreign') or 0
    fee = max(domestic_fee, foreign_fee) or 1
    cursor.execute("""
        INSERT INTO vip_card_recommend_logs
        (member_id, method, card_name, benefits, score, annul_fee, image_url)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """, (
        member_id,
        method,
        card['card_name'],
        card['benefits'],
        float(score),
        fee,
        card['image_url']
    ))
    conn.commit()

# ---------------------------- 메인 추천 API ----------------------------
@cardbenefit_api.route('/api/secession/recommend/<vip_id>', methods=['GET'])
def recommend_cards(vip_id):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    # 1. 회원 조회
    cursor.execute("SELECT * FROM pre_vip WHERE vip_id = %s", (vip_id,))
    member = cursor.fetchone()
    if not member:
        return jsonify({"error": "회원 정보 없음"}), 404

    # 2. 카드 목록 조회
    cursor.execute("SELECT * FROM vip_cards")
    cards = cursor.fetchall()

    # 3. 점수 계산 (혜택 중심: 연회비 고려 안 함)
    rule_raw, tfidf_raw, ml_raw = [], [], []
    tfidf_scores = calc_tfidf_score(member, cards)
    ml_scores = predict_score_XGB_with_tfidf(member, cards)

    for idx, card in enumerate(cards):
        rule_raw.append(calc_rule_score(member, card['benefits']))
        tfidf_raw.append(tfidf_scores[idx])
        ml_raw.append(ml_scores[idx])

    # 4. 정규화
    rule_norm = normalize(rule_raw)
    tfidf_norm = normalize(tfidf_raw)
    ml_norm = normalize(ml_raw)

    # 5. 평균 점수 계산
    ensemble_results = []
    for i in range(len(cards)):
        avg_score = (rule_norm[i] + tfidf_norm[i] + ml_norm[i]) / 3.0
        ensemble_results.append((dict(cards[i]), avg_score))  # 카드 dict 강제 변환

    # 6. Top3 추천 추출
    ensemble_top3 = sorted(ensemble_results, key=lambda x: x[1], reverse=True)[:3]

    # 7. 추천 로그 저장
    for card, score in ensemble_top3:
        log_recommendation(conn, vip_id, 'ensemble', card, score)

    # 8. 응답 포맷팅
    def format_response(results):
        return [
            {
                "card_name": card.get('card_name'),
                "score": round(score, 2),
                "benefits": card.get('benefits'),
                "annul_fee_domestic": card.get('annul_fee_domestic'),
                "annul_fee_foreign": card.get('annul_fee_foreign'),
                "annual_fee": max(card.get('annul_fee_domestic') or 0, card.get('annul_fee_foreign') or 0),
                "image_url": card.get('image_url')
            }
            for card, score in results
        ]
    
    return jsonify({
        "member_id": vip_id,
        "ensemble": format_response(ensemble_top3),
    })

# ✅ 고객 리스트 API
@cardbenefit_api.route('/api/secession/customers', methods=['GET'])
def get_customers():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM pre_vip")
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(rows)

@cardbenefit_api.route('/api/send-sms', methods=['POST'])
def send_sms():
    data = request.get_json()
    name = data['name']
    phone = data['phone']
    message = data['message']

    # ✅ 문자 발송 (예: 외부 API 호출 대신 로그 출력)
    print(f"📨 문자 발송 → {phone}: {message}")

    # ✅ DB 연결
    conn = get_connection()
    cursor = conn.cursor()

    # ✅ vip_members에서 해당 고객의 sms_count 1 증가
    cursor.execute("""
        UPDATE pre_vip
        SET sms_count = COALESCE(sms_count, 0) + 1, last_sms_sent_at = NOW()
        WHERE phone = %s
    """, (phone,))

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"status": "success", "name": name, "phone": phone, "message": message})