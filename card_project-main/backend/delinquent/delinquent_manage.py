from flask import Flask, request, jsonify
import mysql.connector
from flask_cors import CORS
from datetime import datetime
import joblib
import numpy as np
from werkzeug.utils import secure_filename
import os
import uuid
from flask import send_from_directory

UPLOAD_FOLDER = 'uploads/action_files'
ALLOWED_EXTENSIONS = {'pdf', 'jpg', 'jpeg', 'png', 'mp3', 'wav', 'doc', 'docx'}
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# 서버 시작 시 1번만 모델/인코더/feature 불러오기
model = joblib.load("risk_model_xgb.pkl")
label_encoder = joblib.load("label_encoder.pkl")
features = [
    'overdue_principal', 'overdue_days', 'last_overdue_months_r15m',
    'avg_loan_month', 'avg_ca_month',
    'balance_loan_b0m', 'balance_cash_b0m',
    'avg_balance_month', 'avg_balance_6m',
    'revolving_carryover_count_6m'
]
fill_cols = [
    'overdue_principal_b1m', 'overdue_principal_b2m',
    'overdue_days_b1m', 'overdue_days_b2m',
    'avg_loan_month', 'avg_ca_month', 'revolving_carryover_count_6m',
    'last_overdue_months_r15m',
    'balance_loan_b0m', 'balance_cash_b0m',
    'avg_balance_month', 'avg_balance_6m'
]
# [여기까지 추가]

app = Flask(__name__)
CORS(app)

db_config = {
    'host': 'localhost',
    'user': 'card',
    'password': '1234',
    'database': 'card',
    'charset': 'utf8'
}

@app.route("/api/collection-log/<member_id>", methods=["GET"])
def get_collection_log(member_id):
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True)
    sql = "SELECT * FROM collection_action_log WHERE member_id = %s ORDER BY action_date DESC"
    cursor.execute(sql, (member_id,))
    results = cursor.fetchall()
    conn.close()
    return jsonify(results)

@app.route("/api/collection-summary", methods=["GET"])
def collection_summary():
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True)
    sql = """
    SELECT risk_group, action_type, COUNT(*) as count
    FROM collection_action_log
    GROUP BY risk_group, action_type
    """
    cursor.execute(sql)
    results = cursor.fetchall()
    conn.close()
    return jsonify(results)

# ==========================
# 모델 예측
@app.route("/api/predict-risk-group/<member_id>", methods=["GET"])
def predict_risk_group(member_id):
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM delinquent_card WHERE member_id = %s", (member_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return jsonify({"error": "not found"}), 404

    # 결측값 처리
    for col in fill_cols:
        if row[col] is None:
            row[col] = 0

    # 파생 변수 생성
    overdue_principal = row['overdue_principal_b1m']
    if overdue_principal <= 0 and row['overdue_principal_b2m'] > 0:
        overdue_principal = row['overdue_principal_b2m']
    row['overdue_principal'] = overdue_principal

    overdue_days = row['overdue_days_b1m']
    if overdue_days <= 0 and row['overdue_days_b2m'] > 0:
        overdue_days = row['overdue_days_b2m']
    row['overdue_days'] = overdue_days

    # 모델 입력용 feature vector 만들기
    X = np.array([[row[f] for f in features]])
    pred = model.predict(X)[0]
    risk_group = label_encoder.inverse_transform([pred])[0]

    # 🚩 예측 확률(confidence) 계산
    proba = model.predict_proba(X)[0]  # [0.1, 0.7, 0.2] 이런 식
    pred_confidence = float(np.max(proba))  # 예측된 클래스의 확률

    return jsonify({
        "risk_group": risk_group,
        "confidence": pred_confidence    # 신뢰도(예측확률, 0~1)
    })
# ==========================

@app.route("/api/delinquent-list", methods=["GET"])
def delinquent_list():
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True)
    sql = """
    SELECT
        member_id,
        name,
        base_month,
        age,
        gender,
        phone_number,
        address
    FROM delinquent_card
    ORDER BY base_month DESC, member_id
    LIMIT 200
    """
    cursor.execute(sql)
    results = cursor.fetchall()
    conn.close()
    return jsonify(results)

# 파일 업로드
@app.route("/api/collection-action", methods=["POST"])
def add_collection_action():
    # 파일 업로드를 지원하려면 form-data를 사용해야 함!
    # (form-data: 텍스트/파일 섞어서 전송, request.form/ request.files로 받음)
    if request.content_type and request.content_type.startswith('multipart/form-data'):
        data = request.form
        file = request.files.get('action_file')
    else:
        # 기존 json 방식
        data = request.json
        file = None

    # 필드 파싱
    member_id = data.get("member_id")
    risk_group = data.get("risk_group")
    action_type = data.get("action_type")
    action_detail = data.get("action_detail")
    action_by = data.get("action_by")
    action_channel = data.get("action_channel")
    action_date = datetime.now()

    # 파일 처리
    action_file_url = None
    action_file_name = None
    if file and allowed_file(file.filename):
        ext = file.filename.rsplit('.', 1)[-1]
        unique_name = f"{uuid.uuid4().hex}.{ext}"
        save_path = os.path.join(UPLOAD_FOLDER, unique_name)
        file.save(save_path)
        action_file_url = save_path  # 필요시 상대경로로 변경
        action_file_name = secure_filename(file.filename)

    # DB 저장
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()
    sql = """
        INSERT INTO collection_action_log
        (member_id, risk_group, action_type, action_detail, action_by, action_channel, action_date, action_file_url, action_file_name)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    cursor.execute(sql, (
        member_id,
        risk_group,
        action_type,
        action_detail,
        action_by,
        action_channel,
        action_date,
        action_file_url,
        action_file_name
    ))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"result": "success"})

# 첨부파일 저장 기능
@app.route('/uploads/action_files/<filename>')
def uploaded_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename, as_attachment=True)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=7101, debug=True)
