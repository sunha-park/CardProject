# ✅ Flask 및 의존 모듈 import
from flask import request
import mysql.connector
from datetime import datetime
from dateutil.relativedelta import relativedelta

# ✅ DB 설정
db_config = {
    'host': 'localhost',
    'user': 'card',
    'password': '1234',
    'database': 'card',
    'charset': 'utf8'
}

# ✅ 기간 필터 함수
def get_term_range(term_group):
    if term_group == '30일 미만':
        return 0, 29
    elif term_group == '30~60일':
        return 30, 59
    elif term_group == '60~90일':
        return 60, 90
    return 0, 90

# ✅ 파이 차트용 데이터 함수 (Response 반환 ❌)
def get_recovery_pie_data(base_month, term_group):
    try:
        base_dt = datetime.strptime(base_month, '%Y%m')
        prev_month = (base_dt - relativedelta(months=1)).strftime('%Y%m')
    except ValueError:
        return [{'name': '잘못된 날짜 형식', 'value': 1}]

    term_min, term_max = get_term_range(term_group)

    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)

        query = """
        WITH base_data AS (
            SELECT 
                member_id,
                overdue_principal_b1m,
                overdue_days_b1m
            FROM collection_list
            WHERE base_month = %s
              AND overdue_principal_b1m > 0
              AND overdue_days_b1m BETWEEN %s AND %s
        ),
        next_data AS (
            SELECT 
                member_id,
                overdue_principal_b1m AS overdue_next
            FROM collection_list
            WHERE base_month = %s
        ),
        joined AS (
            SELECT 
                b.member_id,
                b.overdue_principal_b1m AS overdue_amt,
                COALESCE(n.overdue_next, 0) AS overdue_next_amt,
                GREATEST(b.overdue_principal_b1m - COALESCE(n.overdue_next, 0), 0) AS recovered_amt
            FROM base_data b
            LEFT JOIN next_data n ON b.member_id = n.member_id
        )
        SELECT
            CASE
                WHEN recovered_amt = 0 THEN '미회수'
                WHEN recovered_amt < overdue_amt THEN '일부 회수'
                ELSE '전액 회수'
            END AS 상태,
            COUNT(*) AS 인원수
        FROM joined
        GROUP BY 상태
        """

        cursor.execute(query, (prev_month, term_min, term_max, base_month))
        rows = cursor.fetchall()

    except Exception as e:
        print("❌ pieData DB 오류:", e)
        return [{'name': 'DB 오류', 'value': 1}]
    finally:
        cursor.close()
        conn.close()

    if not rows:
        return [{'name': '데이터 없음', 'value': 1}]

    return [{'name': row['상태'], 'value': row['인원수']} for row in rows]