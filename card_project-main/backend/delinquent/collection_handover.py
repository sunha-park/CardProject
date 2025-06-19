
from flask import Blueprint, request, jsonify
from datetime import datetime
from dateutil.relativedelta import relativedelta
from collections import defaultdict
import mysql.connector

# Blueprint 초기화
collection_handover_api = Blueprint("collection_handover_api", __name__)

# ✅ 연체 기간 범위 설정
def get_term_range(term_group):
    if term_group == '30일 미만':
        return 0, 29
    elif term_group == '30~60일':
        return 30, 59
    elif term_group == '60~90일':
        return 60, 90
    return 1, 90  # fallback은 0일 제외

# ✅ 상세 테이블 + 라인차트 데이터
@collection_handover_api.route("/api/delinquent/handover-data", methods=["GET"])
def get_handover_chart_():
    term_group = request.args.get('termGroup', '30일 미만')
    term_min, term_max = get_term_range(term_group)

    base_month = request.args.get('baseMonth')
    if not base_month:
        return jsonify({'error': 'baseMonth is required'}), 400

    try:
        base_dt = datetime.strptime(base_month, '%Y%m')
    except ValueError:
        return jsonify({'error': 'Invalid baseMonth format. Use YYYYMM.'}), 400

    prev_month = (base_dt - relativedelta(months=1)).strftime('%Y%m')

    conn = mysql.connector.connect(
        host='localhost',
        user='card',
        password='1234',
        database='card'
    )
    cursor = conn.cursor(dictionary=True)

    query = f"""
    WITH start_month AS (
        SELECT member_id, MIN(base_month) AS overdue_start
        FROM collection_list
        WHERE overdue_days_recent > 0
        GROUP BY member_id
    ),
    base_data AS (
        SELECT 
            c.member_id,
            c.name,
            c.gender,
            c.age,
            c.phone_number,
            c.address,
            c.overdue_principal_b1m
        FROM collection_list c
        JOIN start_month s ON c.member_id = s.member_id
        WHERE c.base_month = {prev_month}
          AND c.base_month >= s.overdue_start
          AND c.overdue_days_b1m BETWEEN {term_min} AND {term_max}
          AND c.overdue_principal_b1m > 0
    ),
    next_data AS (
        SELECT 
            member_id,
            overdue_days_recent AS 연체기간,
            overdue_principal_recent AS overdue_principal_next
        FROM collection_list
        WHERE base_month = {base_month}
    ),
    joined AS (
        SELECT 
            b.member_id,
            b.name AS 고객명,
            b.gender AS 성별,
            b.age AS 연령,
            b.phone_number AS 연락처,
            b.address AS 주소,
            COALESCE(NULLIF(n.연체기간, -99999999), 0) AS 연체기간,
            b.overdue_principal_b1m AS 연체금액,
            COALESCE(n.overdue_principal_next, 0) AS 차월연체금액,
            GREATEST(b.overdue_principal_b1m - COALESCE(n.overdue_principal_next, 0), 0) AS 회수금액,
            ROUND(
                GREATEST(b.overdue_principal_b1m - COALESCE(n.overdue_principal_next, 0), 0) 
                / b.overdue_principal_b1m * 100, 1
            ) AS 회수율
        FROM base_data b
        LEFT JOIN next_data n ON b.member_id = n.member_id
    )
    SELECT * FROM joined
    ORDER BY 연체기간 ASC
    """

    cursor.execute(query)
    rows = cursor.fetchall()
    display_month = base_dt.strftime('%Y-%m')
    for row in rows:
        row['기준월'] = display_month

    cursor.close()
    conn.close()

    # ✅ 차트용 요약 데이터 생성
    from collections import defaultdict
    grouped = defaultdict(list)
    for row in rows:
        grouped[row['연체기간']].append(row)

    line_data = []
    for overdue_days in sorted(grouped.keys()):
        group = grouped[overdue_days]
        total_overdue = sum(item['연체금액'] for item in group)
        total_recovered = sum(item['회수금액'] for item in group)
        recovery_rate = round(total_recovered / total_overdue * 100, 1) if total_overdue else 0
        delinquency_rate = round(100 - recovery_rate, 1)  # ✅ 회수율 기반 연체율

        line_data.append({
            '연체기간': overdue_days,
            '연체금액': total_overdue,
            '회수금액': total_recovered,
            '회수율': recovery_rate,
            '연체율': delinquency_rate
        })

    return jsonify({
        'tableData': rows,
        'lineData': line_data
    })
