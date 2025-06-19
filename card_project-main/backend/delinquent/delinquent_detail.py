from flask import Blueprint, request, jsonify
import mysql.connector
from datetime import datetime

# Blueprint 초기화
delinquent_detail_api = Blueprint("delinquent_detail_api", __name__)

# DB 설정
db_config = {
    'host': 'localhost',
    'user': 'card',
    'password': '1234',
    'database': 'card',
    'charset': 'utf8'
}

# ✅ 차트 + 회수율 데이터
@delinquent_detail_api.route("/api/delinquent/chart-data", methods=["GET"])
def get_chart_data():
    customer_id = request.args.get("customer_id")
    base_month = request.args.get("base_month")

    if not customer_id:
        return jsonify({"error": "customer_id is required"}), 400

    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True)

    # ✅ 데이터 조회
    query = """
        SELECT 
            base_month,
            avg_loan_month AS 카드론,
            avg_lumpsum_month AS 일시불,
            avg_installment_month AS 할부,
            avg_ca_month AS 리볼빙,
            balance_cash_b0m AS 현금서비스,
            overdue_principal_b1m,
            overdue_principal_recent,
            avg_balance_month
        FROM collection_list
        WHERE member_id = %s
        ORDER BY base_month ASC
    """
    cursor.execute(query, (customer_id,))
    rows = cursor.fetchall()

    chart_data = []
    prev_avg_balance = None

    # ✅ 비교 가능한 데이터는 최소 2개월 이상 필요
    if len(rows) < 2:
        cursor.close()
        conn.close()
        return jsonify({
            "chart_data": [],
            "summary": {
                "base_month": base_month or "-",
                "recovery_rate": "0%"
            }
        })

    # ✅ 첫 row는 비교 대상만 사용, 차트에는 포함하지 않음
    for i in range(1, len(rows)):
        prev = rows[i - 1]
        curr = rows[i]

        b1m = prev.get("overdue_principal_b1m") or 0
        recent = curr.get("overdue_principal_recent") or 0
        avg_balance = curr.get("avg_balance_month") or 0

        total_avg_usage = (
            (curr.get("카드론") or 0) +
            (curr.get("일시불") or 0) +
            (curr.get("할부") or 0) +
            (curr.get("리볼빙") or 0) +
            (curr.get("현금서비스") or 0)
        )

        recovered_amount = max(b1m - recent, 0)
        recovery_rate = round((recovered_amount / b1m) * 100, 1) if b1m else 0
        # ✅ 연체율: 이번달 연체금액 / 이번달 사용금액
        overdue_rate = round((recent / total_avg_usage) * 100, 1) if total_avg_usage else 0


        회복판단 = "한도 회복" if prev_avg_balance is not None and avg_balance > prev_avg_balance and recent == 0 else "진행 중"

        chart_data.append({
            "월": f"{str(curr['base_month'])[4:]}월",
            "카드론": curr["카드론"] or 0,
            "일시불": curr["일시불"] or 0,
            "할부": curr["할부"] or 0,
            "리볼빙": curr["리볼빙"] or 0,
            "현금서비스": curr["현금서비스"] or 0,
            "연체금액": b1m,
            "회수금액": recovered_amount,
            "회수율": recovery_rate,
            "연체율": overdue_rate,
            "실질회복": 회복판단
        })

        prev_avg_balance = avg_balance

    cursor.close()
    conn.close()

    # ✅ 회수율 요약 정보
    summary = calculate_recovery_rate(customer_id, base_month or rows[-1]["base_month"])

    return jsonify({
        "chart_data": chart_data,
        "summary": summary
    })



@delinquent_detail_api.route("/api/delinquent/history", methods=["GET"])
def get_history():
    customer_id = request.args.get("customer_id")

    if not customer_id:
        return jsonify({"error": "customer_id is required"}), 400

    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True)

    query = """
        SELECT 
            base_month,
            overdue_days_recent AS overdue_days,
            overdue_principal_b1m,
            overdue_principal_recent,
            avg_balance_month
        FROM collection_list
        WHERE member_id = %s
        ORDER BY base_month ASC
    """
    cursor.execute(query, (customer_id,))
    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    if len(rows) < 2:
        return jsonify({"error": "Not enough data to evaluate history"}), 404

    history_data = []
    total_overdue = 0
    total_recovered = 0
    prev_avg_balance = None

    for i in range(1, len(rows)):
        prev = rows[i - 1]
        curr = rows[i]

        b1m = prev.get("overdue_principal_b1m") or 0
        recent = curr.get("overdue_principal_recent") or 0
        recovered = max(b1m - recent, 0)
        rate = round((recovered / b1m) * 100, 1) if b1m else 0

        # 회수 상태
        if b1m == 0:
            status = "연체 없음"
        elif recent == 0:
            status = "회수 완료"
        elif recent < b1m:
            status = "부모 회수"
        else:
            status = "미회수"

        # 한도 회복 유무
        avg_balance = curr.get("avg_balance_month") or 0
        if recent == 0 and prev_avg_balance is not None and avg_balance > prev_avg_balance:
            limit_status = "한도 회복"
        else:
            limit_status = "변동 없음"

        # 연체일수 그대로 사용
        days = curr.get("overdue_days") or 0
        days = max(0, days)
        if days < 30:
            term_group = "30일 미만"
        elif days < 60:
            term_group = "30~60일"
        elif days < 90:
            term_group = "60~90일"
        else:
            term_group = "90일 이상"

        # 누적합
        total_overdue += b1m
        total_recovered += recovered

        history_data.append({
            "month": datetime.strptime(str(curr["base_month"]), "%Y%m").strftime("%Y년 %m월"),
            "연체일수": days,
            "연체 기간 그룹": term_group,
            "연체 금액": f"{b1m:,}원",
            "회수 금액": f"{recovered:,}원",
            "회수율": f"{rate:.0f}%",
            "회수 상태": status,
            "한도 회복 유무": limit_status
        })

        prev_avg_balance = avg_balance

    # ✅ summary는 base_month에 맞는 row 기준
    last_month = rows[-1].get("base_month")
    last_summary_row = next((r for r in rows if r.get("base_month") == last_month), None)

    if last_summary_row:
        b1m = last_summary_row.get("overdue_principal_b1m") or 0
        recent = last_summary_row.get("overdue_principal_recent") or 0
        recovered = max(b1m - recent, 0)
        rate = round((recovered / b1m) * 100, 1) if b1m else 0

        summary = {
            "base_month": datetime.strptime(str(last_month), "%Y%m").strftime("%Y년 %m월"),
            "연체기간": last_summary_row.get("overdue_days") or 0,
            "연체 금액": f"{b1m:,}원",
            "회수 금액": f"{recovered:,}원",
            "회수율": f"{rate:.1f}%"
        }
    else:
        summary = {
            "base_month": "-",
            "연체기간": "-",
            "연체 금액": "-",
            "회수 금액": "-",
            "회수율": "-"
        }

    return jsonify({
        "history": history_data,
        "summary": summary
    })






# ✅ 체크리스트 관리
# ✅ 체크리스트 관리 API (GET: 조회 + PATCH: 수정)
@delinquent_detail_api.route("/api/delinquent/checklist", methods=["GET", "PATCH"])
def handle_checklist():
    customer_id = request.args.get("customer_id")
    base_month = request.args.get("base_month", "202504")

    if not customer_id:
        return jsonify({"error": "customer_id is required"}), 400

    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True)

    if request.method == "GET":
        # ✅ base_month 기준 overdue_days_recent 가져오기
        cursor.execute("""
            SELECT overdue_days_recent
            FROM collection_list
            WHERE member_id = %s AND base_month = %s
        """, (customer_id, base_month))
        row = cursor.fetchone()

        overdue_days_recent = row["overdue_days_recent"] if row else 0
        if overdue_days_recent is None or overdue_days_recent <= 0 or overdue_days_recent == -99999999:
            # ✅ 연체일수가 0 이하 → 체크리스트 없음 처리
            cursor.close()
            conn.close()
            return jsonify({
                "overdue_days": 0,
                "overdue_start_month": base_month,
                "checklist": []
            })

        # ✅ 체크리스트 존재 여부 확인
        cursor.execute("SELECT COUNT(*) AS count FROM delinquent_checklist WHERE customer_id = %s", (customer_id,))
        count = cursor.fetchone()["count"]

        if count == 0:
            # ✅ overdue_days_recent 값에 해당하는 체크리스트 템플릿 복사
            cursor.execute("""
                INSERT INTO delinquent_checklist (
                    day_min, day_max, stage, category, action, created_at, customer_id, is_completed
                )
                SELECT
                    day_min, day_max, stage, category, action, NOW(), %s, FALSE
                FROM delinquent_checklist
                WHERE customer_id IS NULL AND %s BETWEEN day_min AND day_max
            """, (customer_id, overdue_days_recent))
            conn.commit()

        # ✅ 고객별 체크리스트 항목 조회
        cursor.execute("""
            SELECT id, stage, action, is_completed
            FROM delinquent_checklist
            WHERE customer_id = %s
            ORDER BY id
        """, (customer_id,))
        checklist = [
            {
                "id": row["id"],
                "항목": f"[{row['stage']}] {row['action']}",
                "완료": bool(row["is_completed"])
            }
            for row in cursor.fetchall()
        ]

        cursor.close()
        conn.close()

        return jsonify({
            "overdue_days": overdue_days_recent,
            "overdue_start_month": base_month,
            "checklist": checklist
        })

    elif request.method == "PATCH":
        req_data = request.get_json()
        checklist = req_data.get("checklist", [])

        for item in checklist:
            cursor.execute("""
                UPDATE delinquent_checklist
                SET is_completed = %s
                WHERE id = %s AND customer_id = %s
            """, (item["완료"], item["id"], customer_id))

        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": "Checklist updated"})











# ✅ 회수율 요약 계산

def calculate_recovery_rate(customer_id: str, base_month: str):
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT SUM(overdue_principal_b1m) AS total_overdue
        FROM collection_list
        WHERE member_id = %s AND base_month < %s
    """, (customer_id, base_month))
    total_overdue = cursor.fetchone()["total_overdue"] or 0

    cursor.execute("""
        SELECT SUM(GREATEST(overdue_principal_b1m - overdue_principal_recent, 0)) AS total_recovered
        FROM collection_list
        WHERE member_id = %s AND base_month >= %s
    """, (customer_id, base_month))
    total_recovered = cursor.fetchone()["total_recovered"] or 0

    cursor.close()
    conn.close()

    recovery_rate = round((total_recovered / total_overdue) * 100, 1) if total_overdue > 0 else 0

    return {
        "total_overdue": total_overdue,
        "total_recovered": total_recovered,
        "recovery_rate": recovery_rate,
        "base_month": base_month
    }