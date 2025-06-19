from flask import Blueprint, request, jsonify
import mysql.connector
from datetime import datetime

radar_api = Blueprint('radar_api', __name__)

db_config = {
    'host': 'localhost',
    'user': 'card',
    'password': '1234',
    'database': 'card',
    'charset': 'utf8'
}

@radar_api.route('/api/delinquent/period/radar-data', methods=['GET'])
def get_radar_data():
    range_type = request.args.get('rangeType', '월간')

    if range_type == '월간':
        label_expr = "base_month"
        format_func = lambda base_month: f"{str(base_month)[:4]}-{str(base_month)[4:]}"
    elif range_type == '분기':
        label_expr = "CONCAT(YEAR(STR_TO_DATE(base_month, '%Y%m')), ' Q', QUARTER(STR_TO_DATE(base_month, '%Y%m')))"
        format_func = lambda val: val
    elif range_type == '반기':
        label_expr = "CONCAT(YEAR(STR_TO_DATE(base_month, '%Y%m')), '-H', IF(MONTH(STR_TO_DATE(base_month, '%Y%m')) <= 6, 1, 2))"
        format_func = lambda val: val
    elif range_type == '연간':
        label_expr = "YEAR(STR_TO_DATE(base_month, '%Y%m'))"
        format_func = lambda val: str(val)
    else:
        return jsonify({'error': f'Invalid rangeType: {range_type}'}), 400

    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True)

    optimized_query = f"""
        SELECT 
            raw_label,
            CASE 
                WHEN age BETWEEN 20 AND 29 THEN '20대'
                WHEN age BETWEEN 30 AND 39 THEN '30대'
                WHEN age BETWEEN 40 AND 49 THEN '40대'
                WHEN age BETWEEN 50 AND 59 THEN '50대'
                WHEN age BETWEEN 60 AND 69 THEN '60대'
                WHEN age >= 70 THEN '70대'
                ELSE '기타'
            END AS age_group,
            gender,
            category,
            COUNT(*) AS value
        FROM (
            SELECT {label_expr} AS raw_label, age, gender, '카드론' AS category 
            FROM delinquent_card 
            WHERE overdue_days_recent > 0 AND avg_loan_month > 0 AND base_month IS NOT NULL

            UNION ALL
            SELECT {label_expr} AS raw_label, age, gender, '일시불' 
            FROM delinquent_card 
            WHERE overdue_days_recent > 0 AND avg_lumpsum_month > 0 AND base_month IS NOT NULL

            UNION ALL
            SELECT {label_expr} AS raw_label, age, gender, '할부' 
            FROM delinquent_card 
            WHERE overdue_days_recent > 0 AND avg_installment_month > 0 AND base_month IS NOT NULL

            UNION ALL
            SELECT {label_expr} AS raw_label, age, gender, '리볼빙' 
            FROM delinquent_card 
            WHERE overdue_days_recent > 0 AND avg_ca_month > 0 AND base_month IS NOT NULL

            UNION ALL
            SELECT {label_expr} AS raw_label, age, gender, '현금서비스' 
            FROM delinquent_card 
            WHERE overdue_days_recent > 0 AND balance_cash_b0m > 0 AND base_month IS NOT NULL
        ) AS combined
        GROUP BY raw_label, age_group, gender, category
    """

    cursor.execute(optimized_query)
    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    result = []
    for row in rows:
        result.append({
            'period': format_func(row['raw_label']),
            'gender': row['gender'],
            'age_group': row['age_group'],
            'category': row['category'],
            'value': row['value']
        })

    return jsonify({'radarData': result})
