from flask import Flask, jsonify
import mysql.connector
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

db_config = {
    'host': 'localhost',
    'user': 'card',
    'password': '1234',
    'database': 'card',
    'charset': 'utf8'
}

@app.route("/api/risk-summary", methods=["GET"])
def get_risk_summary():
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True)

    query = """
    SELECT 
      CASE
        WHEN base_group = '관찰군' AND (avg_loan_month >= 500000 OR avg_ca_month >= 300000 OR revolving_carryover_count_6m >= 3) THEN '준위험군'
        WHEN base_group = '정상군' AND (avg_loan_month >= 500000 OR avg_ca_month >= 300000 OR revolving_carryover_count_6m >= 3) THEN '관찰군'
        ELSE base_group
      END AS predicted_risk_group,
      COUNT(*) AS count
    FROM (
      SELECT
        CASE
          WHEN overdue_principal_b1m >= 300000 OR overdue_days_b1m >= 60 THEN '위험군'
          WHEN overdue_principal_b1m >= 100000 OR overdue_days_b1m >= 30 THEN '준위험군'
          WHEN overdue_principal_b1m > 0 OR last_overdue_months_r15m >= 3 THEN '관찰군'
          ELSE '정상군'
        END AS base_group,
        avg_loan_month,
        avg_ca_month,
        revolving_carryover_count_6m
      FROM delinquent_card
    ) AS sub
    GROUP BY predicted_risk_group;
    """
    cursor.execute(query)
    results = cursor.fetchall()
    conn.close()

    # 🔄 리스트 → 딕셔너리 변환
    response = {row['predicted_risk_group']: row['count'] for row in results}
    return jsonify(response)

@app.route("/api/risk-monthly", methods=["GET"])
def get_risk_monthly():
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True)

    query = """
    SELECT 
      base_month AS month,
      CASE
        WHEN base_group = '관찰군' AND (avg_loan_month >= 500000 OR avg_ca_month >= 300000 OR revolving_carryover_count_6m >= 3) THEN '준위험군'
        WHEN base_group = '정상군' AND (avg_loan_month >= 500000 OR avg_ca_month >= 300000 OR revolving_carryover_count_6m >= 3) THEN '관찰군'
        ELSE base_group
      END AS predicted_risk_group,
      COUNT(*) AS count
    FROM (
      SELECT
        base_month,
        CASE
          WHEN overdue_principal_b1m >= 300000 OR overdue_days_b1m >= 60 THEN '위험군'
          WHEN overdue_principal_b1m >= 100000 OR overdue_days_b1m >= 30 THEN '준위험군'
          WHEN overdue_principal_b1m > 0 OR last_overdue_months_r15m >= 3 THEN '관찰군'
          ELSE '정상군'
        END AS base_group,
        avg_loan_month,
        avg_ca_month,
        revolving_carryover_count_6m
      FROM delinquent_card
    ) AS sub
    GROUP BY month, predicted_risk_group
    ORDER BY month ASC;
    """
    cursor.execute(query)
    results = cursor.fetchall()
    conn.close()

    return jsonify(results)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=7100, debug=True)
