from flask import Blueprint, request, jsonify
import mysql.connector
from datetime import datetime
from dateutil.relativedelta import relativedelta
from math import floor

# DB 연결 설정
db_config = {
    'host': 'localhost',
    'user': 'card',
    'password': '1234',
    'database': 'card',
    'charset': 'utf8'
}

# 📌 연체 회수율 전체 조회 
def run_recovery_chart_query_all():
    base_month = request.args.get('baseMonth')
    if not base_month:
        return {'error': 'baseMonth is required'}, 400

    try:
        base_dt = datetime.strptime(base_month, '%Y%m')
    except ValueError:
        return {'error': 'Invalid baseMonth format. Use YYYYMM.'}, 400

    prev_month = (base_dt - relativedelta(months=1)).strftime('%Y%m')

    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True)

    # ✅ 고객 단위 회수율 먼저 계산 → bucket별 평균 집계
    query = f"""
    WITH prev AS (
        SELECT member_id, overdue_days_b1m, overdue_principal_b1m
        FROM collection_list
        WHERE base_month = {prev_month}
          AND overdue_principal_b1m > 0
    ),
    curr AS (
        SELECT member_id, overdue_principal_b1m AS overdue_principal_curr
        FROM collection_list
        WHERE base_month = {base_month}
    ),
    joined AS (
        SELECT
            p.member_id,
            p.overdue_days_b1m,
            p.overdue_principal_b1m,
            COALESCE(c.overdue_principal_curr, 0) AS overdue_principal_curr,
            GREATEST(p.overdue_principal_b1m - COALESCE(c.overdue_principal_curr, 0), 0) AS recovered,
            ROUND(
                GREATEST(p.overdue_principal_b1m - COALESCE(c.overdue_principal_curr, 0), 0)
                / p.overdue_principal_b1m * 100, 1
            ) AS 회수율
        FROM prev p
        LEFT JOIN curr c ON p.member_id = c.member_id
    )
    SELECT
        FLOOR(overdue_days_b1m / 10) * 10 AS bucket,
        ROUND(AVG(회수율), 1) AS avg_recovery_rate
    FROM joined
    GROUP BY bucket
    ORDER BY bucket;
    """

    cursor.execute(query)
    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    # ✅ 0~90일 구간 누락 방지
    full_buckets = list(range(0, 91, 10))
    bucket_map = {row['bucket']: row for row in rows}

    line_data = []
    for b in full_buckets:
        rate = bucket_map.get(b, {}).get('avg_recovery_rate', 0)
        label = f"{b}~{b+9}일"
        line_data.append({'연체일구간': label, '회수율': rate})

    return {
        'lineData': line_data,
        'barData': [],
        'pieData': [],
        'radarData': []
    }

def get_recovery_bar_data(base_month: str):
    from datetime import datetime
    from dateutil.relativedelta import relativedelta
    import mysql.connector

    db_config = {
        'host': 'localhost',
        'user': 'card',
        'password': '1234',
        'database': 'card',
        'charset': 'utf8'
    }

    try:
        base_dt = datetime.strptime(base_month, '%Y%m')
        prev_month = (base_dt - relativedelta(months=1)).strftime('%Y%m')
    except ValueError:
        return {'error': 'Invalid baseMonth format. Use YYYYMM.'}, 400

    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True)

    query = f"""
    SELECT
        '{base_month}' AS 기준월,
        category,
        SUM(overdue_principal_b1m) AS 연체금액,
        SUM(GREATEST(overdue_principal_b1m - COALESCE(next_overdue, 0), 0)) AS 회수금액,
        ROUND(
            SUM(GREATEST(overdue_principal_b1m - COALESCE(next_overdue, 0), 0)) /
            NULLIF(SUM(overdue_principal_b1m), 0) * 100, 1
        ) AS 회수율
    FROM (
        SELECT
            b.member_id,
            b.category,
            b.overdue_principal_b1m,
            n.overdue_principal_b1m AS next_overdue
        FROM collection_list b
        LEFT JOIN collection_list n
            ON b.member_id = n.member_id AND n.base_month = {base_month}
        WHERE b.base_month = {prev_month} AND b.overdue_principal_b1m > 0
    ) t
    GROUP BY category
    """

    cursor.execute(query)
    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    return rows



def get_term_range(term_group):
    if term_group == '30일 미만':
        return 0, 29
    elif term_group == '30~60일':
        return 30, 59
    elif term_group == '60~90일':
        return 60, 90
    return 0, 90  # fallback

def get_recovery_detail_table():
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

    # ✅ 연체 시작월 이후 데이터만 필터링하며 base_month 기준 연체일수 사용
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

    return jsonify(rows)

