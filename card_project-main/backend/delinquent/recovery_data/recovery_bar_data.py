from datetime import datetime
from dateutil.relativedelta import relativedelta
import mysql.connector

# ✅ DB 연결 설정
# DB 연결 설정
db_config = {
    'host': 'localhost',
    'user': 'card',
    'password': '1234',
    'database': 'card',
    'charset': 'utf8'
}

def get_recovery_bar_data(base_month):
    try:
        base_dt = datetime.strptime(base_month, "%Y%m")
    except ValueError:
        return []

    prev_month = (base_dt - relativedelta(months=1)).strftime("%Y%m")

    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True)

    query = f"""
    WITH prev AS (
        SELECT 
            member_id,
            balance_loan_b1m,
            balance_lumpsum_b1m,
            avg_installment_month,
            balance_revolving_lumpsum_b0m,
            balance_cash_b1m
        FROM collection_list
        WHERE base_month = {prev_month}
    ),
    curr AS (
        SELECT 
            member_id,
            balance_loan_b1m AS loan_curr,
            balance_lumpsum_b1m AS lumpsum_curr,
            avg_installment_month AS installment_curr,
            balance_revolving_lumpsum_b0m AS revolving_curr,
            balance_cash_b1m AS cash_curr
        FROM collection_list
        WHERE base_month = {base_month}
    ),
    joined AS (
        SELECT 
            p.member_id,
            p.balance_loan_b1m, c.loan_curr,
            p.balance_lumpsum_b1m, c.lumpsum_curr,
            p.avg_installment_month, c.installment_curr,
            p.balance_revolving_lumpsum_b0m, c.revolving_curr,
            p.balance_cash_b1m, c.cash_curr
        FROM prev p
        LEFT JOIN curr c ON p.member_id = c.member_id
    )
    SELECT '카드론' AS category,
           SUM(balance_loan_b1m) AS 연체금액,
           SUM(GREATEST(balance_loan_b1m - COALESCE(loan_curr, 0), 0)) AS 회수금액,
           ROUND(SUM(GREATEST(balance_loan_b1m - COALESCE(loan_curr, 0), 0)) / NULLIF(SUM(balance_loan_b1m), 0) * 100, 1) AS 회수율
    FROM joined
    UNION ALL
    SELECT '일시불',
           SUM(balance_lumpsum_b1m),
           SUM(GREATEST(balance_lumpsum_b1m - COALESCE(lumpsum_curr, 0), 0)),
           ROUND(SUM(GREATEST(balance_lumpsum_b1m - COALESCE(lumpsum_curr, 0), 0)) / NULLIF(SUM(balance_lumpsum_b1m), 0) * 100, 1)
    FROM joined
    UNION ALL
    SELECT '할부',
           SUM(avg_installment_month),
           SUM(GREATEST(avg_installment_month - COALESCE(installment_curr, 0), 0)),
           ROUND(SUM(GREATEST(avg_installment_month - COALESCE(installment_curr, 0), 0)) / NULLIF(SUM(avg_installment_month), 0) * 100, 1)
    FROM joined
    UNION ALL
    SELECT '리볼빙',
           SUM(balance_revolving_lumpsum_b0m),
           SUM(GREATEST(balance_revolving_lumpsum_b0m - COALESCE(revolving_curr, 0), 0)),
           ROUND(SUM(GREATEST(balance_revolving_lumpsum_b0m - COALESCE(revolving_curr, 0), 0)) / NULLIF(SUM(balance_revolving_lumpsum_b0m), 0) * 100, 1)
    FROM joined
    UNION ALL
    SELECT '현금서비스',
           SUM(balance_cash_b1m),
           SUM(GREATEST(balance_cash_b1m - COALESCE(cash_curr, 0), 0)),
           ROUND(SUM(GREATEST(balance_cash_b1m - COALESCE(cash_curr, 0), 0)) / NULLIF(SUM(balance_cash_b1m), 0) * 100, 1)
    FROM joined;
    """

    cursor.execute(query)
    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    label_month = base_dt.strftime('%Y-%m')
    return [
    {
        '기준월': label_month,
        'category': row.get('category'),
        '연체금액': int(row.get('연체금액') or 0),
        '회수금액': int(row.get('회수금액') or 0),
        '회수율': float(row.get('회수율') or 0.0),
    }
    for row in rows
]