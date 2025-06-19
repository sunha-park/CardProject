import mysql.connector

# ✅ DB 설정
db_config = {
    'host': 'localhost',
    'user': 'card',
    'password': '1234',
    'database': 'card',
    'charset': 'utf8'
}

# ✅ 월간 집계 함수
def get_grouped_table_data():
    label_expr = "DATE_FORMAT(STR_TO_DATE(base_month, '%Y%m'), '%Y-%m')"
    return _run_query(label_expr)

# ✅ 공통 쿼리 실행 함수
def _run_query(label_expr: str):
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True)

    query = f"""
        SELECT 
            {label_expr} AS label,
            COUNT(*) AS total,
            SUM(CASE WHEN overdue_days_recent > 0 THEN 1 ELSE 0 END) AS overdue,

            -- 카드론
            ROUND(SUM(CASE WHEN overdue_days_recent > 0 THEN balance_loan_b0m ELSE 0 END) /
                  NULLIF(SUM(CASE WHEN overdue_days_recent > 0 THEN 1 ELSE 0 END), 0)) AS cardloan_avg,
            SUM(CASE WHEN overdue_days_recent > 0 THEN balance_loan_b0m ELSE 0 END) AS cardloan_sum,

            -- 일시불
            ROUND(SUM(CASE WHEN overdue_days_recent > 0 THEN avg_lumpsum_month ELSE 0 END) /
                  NULLIF(SUM(CASE WHEN overdue_days_recent > 0 THEN 1 ELSE 0 END), 0)) AS lumpsum_avg,
            SUM(CASE WHEN overdue_days_recent > 0 THEN avg_lumpsum_month ELSE 0 END) AS lumpsum_sum,

            -- 할부
            ROUND(SUM(CASE WHEN overdue_days_recent > 0 THEN avg_installment_month ELSE 0 END) /
                  NULLIF(SUM(CASE WHEN overdue_days_recent > 0 THEN 1 ELSE 0 END), 0)) AS installment_avg,
            SUM(CASE WHEN overdue_days_recent > 0 THEN avg_installment_month ELSE 0 END) AS installment_sum,

            -- 리볼빙 (합산)
            ROUND(SUM(CASE WHEN overdue_days_recent > 0 THEN (balance_revolving_lumpsum_b0m + balance_revolving_ca_b0m) ELSE 0 END) /
                  NULLIF(SUM(CASE WHEN overdue_days_recent > 0 THEN 1 ELSE 0 END), 0)) AS revolving_avg,
            SUM(CASE WHEN overdue_days_recent > 0 THEN (balance_revolving_lumpsum_b0m + balance_revolving_ca_b0m) ELSE 0 END) AS revolving_sum,

            -- 현금서비스 또는 기타 대출
            ROUND(SUM(CASE WHEN overdue_days_recent > 0 THEN avg_loan_month ELSE 0 END) /
                  NULLIF(SUM(CASE WHEN overdue_days_recent > 0 THEN 1 ELSE 0 END), 0)) AS cash_avg,
            SUM(CASE WHEN overdue_days_recent > 0 THEN avg_loan_month ELSE 0 END) AS cash_sum,

            -- 연체금액
            ROUND(SUM(CASE WHEN overdue_days_recent > 0 THEN overdue_balance_b0m ELSE 0 END) /
                  NULLIF(SUM(CASE WHEN overdue_days_recent > 0 THEN 1 ELSE 0 END), 0)) AS overdue_amt_avg,
            SUM(CASE WHEN overdue_days_recent > 0 THEN overdue_balance_b0m ELSE 0 END) AS overdue_amt_sum

        FROM delinquent_card
        WHERE base_month IS NOT NULL
        GROUP BY label
        ORDER BY label
    """
    cursor.execute(query)
    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    result = []
    for row in rows:
        total = row['total']
        overdue = row['overdue']
        rate = round(overdue / total * 100, 2) if total else 0

        result.append({
            'name': str(row['label']),
            'term': f"{overdue}명 / {total}명", 
            'amount': rate,
            'cardloan_avg': row['cardloan_avg'] or 0,
            'cardloan_sum': row['cardloan_sum'] or 0,
            'lumpsum_avg': row['lumpsum_avg'] or 0,
            'lumpsum_sum': row['lumpsum_sum'] or 0,
            'installment_avg': row['installment_avg'] or 0,
            'installment_sum': row['installment_sum'] or 0,
            'revolving_avg': row['revolving_avg'] or 0,
            'revolving_sum': row['revolving_sum'] or 0,
            'cash_avg': row['cash_avg'] or 0,
            'cash_sum': row['cash_sum'] or 0,
            'overdue_amt_avg': row['overdue_amt_avg'] or 0,
            'overdue_amt_sum': row['overdue_amt_sum'] or 0
        })

    return result
