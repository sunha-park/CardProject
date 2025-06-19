# chart_data/common_chart_query.py
import mysql.connector
from datetime import datetime

# 데이터베이스 설정
db_config = {
    'host': 'localhost',
    'user': 'card',
    'password': '1234',
    'database': 'card',
    'charset': 'utf8'
}

def run_chart_query(label_expr: str, label_format_func):
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True)

    # ✅ 평균 연체 금액 포함한 쿼리
    query = f"""
    SELECT 
        {label_expr} AS label,
        COUNT(*) AS total,
        SUM(CASE WHEN overdue_days_recent > 0 THEN 1 ELSE 0 END) AS overdue,

        -- 연체자 기준 평균 연체금액
        SUM(CASE WHEN overdue_days_recent > 0 THEN avg_loan_month ELSE 0 END) /
        NULLIF(SUM(CASE WHEN overdue_days_recent > 0 THEN 1 ELSE 0 END), 0) AS loan_avg,

        SUM(CASE WHEN overdue_days_recent > 0 THEN avg_lumpsum_month ELSE 0 END) /
        NULLIF(SUM(CASE WHEN overdue_days_recent > 0 THEN 1 ELSE 0 END), 0) AS lumpsum_avg,

        SUM(CASE WHEN overdue_days_recent > 0 THEN avg_installment_month ELSE 0 END) /
        NULLIF(SUM(CASE WHEN overdue_days_recent > 0 THEN 1 ELSE 0 END), 0) AS installment_avg,

        SUM(CASE WHEN overdue_days_recent > 0 THEN avg_ca_month ELSE 0 END) /
        NULLIF(SUM(CASE WHEN overdue_days_recent > 0 THEN 1 ELSE 0 END), 0) AS revolving_avg,

        SUM(CASE WHEN overdue_days_recent > 0 THEN balance_cash_b0m ELSE 0 END) /
        NULLIF(SUM(CASE WHEN overdue_days_recent > 0 THEN 1 ELSE 0 END), 0) AS cash_avg

    FROM delinquent_card
    WHERE base_month IS NOT NULL
    GROUP BY label
    ORDER BY label
"""

    cursor.execute(query)
    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    line_data = []
    pie_data = []
    bar_data = []
    radar_data = []

    for row in rows:
        label = label_format_func(row['label'])
        total = row['total']
        overdue = row['overdue']
        rate = round(overdue / total * 100, 2) if total else 0

        line_data.append({
            '기간': label,
            '연체율': rate,
            '전체인원': total,
            '연체인원': overdue
        })

        if overdue > 0:
            pie_data.append({'name': label, 'value': overdue})

        # ✅ barData: 실제 평균값으로 변경
        bar_data.append({'기간': label, 'category': '카드론', 'avgAmount': round(row['loan_avg'] or 0, 2)})
        bar_data.append({'기간': label, 'category': '일시불', 'avgAmount': round(row['lumpsum_avg'] or 0, 2)})
        bar_data.append({'기간': label, 'category': '할부', 'avgAmount': round(row['installment_avg'] or 0, 2)})
        bar_data.append({'기간': label, 'category': '리볼빙', 'avgAmount': round(row['revolving_avg'] or 0, 2)})
        bar_data.append({'기간': label, 'category': '현금서비스', 'avgAmount': round(row['cash_avg'] or 0, 2)})
        

    return {
        'lineData': line_data,
        'barData': bar_data,
        'pieData': pie_data,

    }


# chart_data/chart_data_monthly.py
from chart_data.common_chart_query import run_chart_query
from datetime import datetime

def get_monthly_chart_data():
    label_expr = "base_month"
    def format_label(base_month):
        dt = datetime.strptime(str(base_month), "%Y%m")
        return f"{dt.year}-{dt.month:02d}"
    return run_chart_query(label_expr, format_label)

# chart_data/chart_data_quarterly.py
from chart_data.common_chart_query import run_chart_query

def get_quarterly_chart_data():
    label_expr = "CONCAT(YEAR(STR_TO_DATE(base_month, '%Y%m')), ' Q', QUARTER(STR_TO_DATE(base_month, '%Y%m')))"
    return run_chart_query(label_expr, lambda s: s)

# chart_data/chart_data_halfyearly.py
from chart_data.common_chart_query import run_chart_query

def get_half_year_chart_data():
    label_expr = "CONCAT(YEAR(STR_TO_DATE(base_month, '%Y%m')), '-H', IF(MONTH(STR_TO_DATE(base_month, '%Y%m')) <= 6, 1, 2))"
    return run_chart_query(label_expr, lambda s: s)

# chart_data/chart_data_yearly.py
from chart_data.common_chart_query import run_chart_query

def get_yearly_chart_data():
    label_expr = "YEAR(STR_TO_DATE(base_month, '%Y%m'))"
    return run_chart_query(label_expr, lambda s: str(s))