from flask import Blueprint, request, jsonify
import mysql.connector

delinquent_api = Blueprint('delinquent_api', __name__)

db_config = {
    'host': 'localhost',
    'user': 'card',
    'password': '1234',
    'database': 'card',
    'charset': 'utf8'
}

def classify_term(overdue_days):
    if overdue_days is None or overdue_days == -99999999:
        return '연체없음'
    if overdue_days < 30:
        return '30일 미만'
    elif overdue_days < 60:
        return '30~60일'
    else:
        return '60~90일'

def get_ticks_for_term(term_group):
    if term_group == '30일 미만':
        return [0, 10, 20, 30]
    elif term_group == '30~60일':
        return [30, 40, 50, 60]
    elif term_group == '60~90일':
        return [60, 70, 80, 90]
    return []

# ✅ 표 데이터 API
@delinquent_api.route('/api/delinquent/table-data', methods=['GET'])
def get_table_data():
    mode = request.args.get('mode', 'period')
    term_group = request.args.get('termGroup', '30일 미만')
    range_type = request.args.get('rangeType', '월별')

    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM delinquent_card")
    results = cursor.fetchall()
    cursor.close()
    conn.close()

    table_data = []

    if mode == 'period':
        # 기간별 조회 - 예시로 월별/분기별 필드(기간)로 그룹화
        for row in results:
            # 예: row['period'] 필드가 실제 데이터에 필요
            table_data.append({
                'period': row.get('period', range_type),  # 실제로는 DB 컬럼에 맞게
                'name': row['name'],
                'age': row.get('age', ''),
                'gender': row.get('gender', ''),
                'phone': row.get('phone', ''),
                'total': row.get('overdue_balance_b0m', 0),
                'loan': row.get('balance_loan_b0m', 0),
                'cash': row.get('balance_cash_b0m', 0),
                'install': row.get('avg_installment_month', 0),
                'lump': row.get('avg_lumpsum_month', 0)
            })
    else:
        # 추심회수율(회수율) 모드
        for row in results:
            group = classify_term(row['overdue_days_recent'])
            if group == term_group:
                table_data.append({
                    'name': row['name'],
                    'term': f"{row['overdue_days_recent']}일",
                    'total': row.get('overdue_balance_b0m', 0),
                    'loan': row.get('balance_loan_b0m', 0),
                    'cash': row.get('balance_cash_b0m', 0),
                    'install': row.get('avg_installment_month', 0),
                    'lump': row.get('avg_lumpsum_month', 0)
                })

    return jsonify(table_data)

# ✅ 차트 데이터 API
@delinquent_api.route('/api/delinquent/chart-data', methods=['GET'])
def get_chart_data():
    mode = request.args.get('mode', 'period')
    term_group = request.args.get('termGroup', '30일 미만')
    range_type = request.args.get('rangeType', '월별')

    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM delinquent_card")
    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    # 기간별 조회
    if mode == 'period':
        # 예시) 기간별 x축: 월별/분기별/반기별/연별 (여기선 period 필드 가정)
        periods = list(sorted(set(r.get('period', range_type) for r in rows)))
        line_data = []
        for period in periods:
            subset = [r for r in rows if r.get('period', range_type) == period]
            overdue_sum = sum(r.get('overdue_balance_b0m', 0) or 0 for r in subset)
            cnt = len(subset)
            rate = overdue_sum / cnt if cnt else 0
            line_data.append({'x': period, 'y': int(rate)})

        # 자금유형별 평균 연체금액 (BarChart)
        bar_chart = []
        for category, db_field in [('카드론', 'balance_loan_b0m'), ('현금서비스', 'balance_cash_b0m'), ('할부', 'avg_installment_month')]:
            values = [r.get(db_field, 0) or 0 for r in rows]
            avg_val = int(sum(values) / len(values)) if values else 0
            bar_chart.append({'category': category, 'avgAmount': avg_val})

        # 파이차트
        pie_counts = {'카드론': 0, '현금서비스': 0, '할부': 0}
        for row in rows:
            if row.get('balance_loan_b0m', 0) > 0:
                pie_counts['카드론'] += 1
            if row.get('balance_cash_b0m', 0) > 0:
                pie_counts['현금서비스'] += 1
            if row.get('avg_installment_month', 0) > 0:
                pie_counts['할부'] += 1
        pie_chart = [{'name': key, 'value': val, 'label': '연체자 수'} for key, val in pie_counts.items()]

        # 레이다차트
        radar_sum = {'할부': 0, '일시불': 0, 'CA': 0}
        radar_count = 0
        for row in rows:
            radar_sum['할부'] += row.get('avg_installment_month', 0) or 0
            radar_sum['일시불'] += row.get('avg_lumpsum_month', 0) or 0
            radar_sum['CA'] += row.get('avg_ca_month', 0) or 0
            radar_count += 1
        if radar_count == 0:
            radar_count = 1
        radar_chart = [{'subject': key, 'A': int(radar_sum[key] / radar_count)} for key in radar_sum]

        return jsonify({
            'lineData': line_data,
            'barData': bar_chart,
            'pieData': pie_chart,
            'radarData': radar_chart
        })

    # 추심 회수율 모드
    filtered_rows = [row for row in rows if classify_term(row['overdue_days_recent']) == term_group]
    ticks = get_ticks_for_term(term_group)
    tick_summary = []
    for tick in ticks:
        matched = [r for r in filtered_rows if r['overdue_days_recent'] is not None and r['overdue_days_recent'] != -99999999 and tick <= r['overdue_days_recent'] < tick + 10]
        amounts = [r['overdue_balance_b0m'] or 0 for r in matched]
        avg_amt = sum(amounts) / len(amounts) if amounts else 0
        recovery = max(0, min(100, 100 - avg_amt / 10000))
        tick_summary.append({
            'x': f'{tick}~{tick+9}일',
            'y': round(recovery)
        })

    bar_data = []
    for category, db_field in [('카드론', 'balance_loan_b0m'), ('현금서비스', 'balance_cash_b0m'), ('할부', 'avg_installment_month')]:
        values = [r.get(db_field, 0) or 0 for r in filtered_rows]
        avg_val = int(sum(values) / len(values)) if values else 0
        bar_data.append({'category': category, 'avgAmount': avg_val})

    pie_counts = {'카드론': 0, '현금서비스': 0, '할부': 0}
    for row in filtered_rows:
        if row.get('balance_loan_b0m', 0) > 0:
            pie_counts['카드론'] += 1
        if row.get('balance_cash_b0m', 0) > 0:
            pie_counts['현금서비스'] += 1
        if row.get('avg_installment_month', 0) > 0:
            pie_counts['할부'] += 1
    pie_chart = [{'name': key, 'value': val, 'label': '연체자 수'} for key, val in pie_counts.items()]

    radar_sum = {'할부': 0, '일시불': 0, 'CA': 0}
    radar_count = 0
    for row in filtered_rows:
        radar_sum['할부'] += row.get('avg_installment_month', 0) or 0
        radar_sum['일시불'] += row.get('avg_lumpsum_month', 0) or 0
        radar_sum['CA'] += row.get('avg_ca_month', 0) or 0
        radar_count += 1
    if radar_count == 0:
        radar_count = 1
    radar_chart = [{'subject': key, 'A': int(radar_sum[key] / radar_count)} for key in radar_sum]

    return jsonify({
        'lineData': tick_summary,
        'barData': bar_data,
        'pieData': pie_chart,
        'radarData': radar_chart
    })
