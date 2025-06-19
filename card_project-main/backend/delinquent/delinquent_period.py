from flask import Blueprint, request, jsonify

# chart
from chart_data.chart_data_monthly import get_monthly_chart_data
from chart_data.chart_data_quarterly import get_quarterly_chart_data
from chart_data.chart_data_halfyearly import get_half_year_chart_data
from chart_data.chart_data_yearly import get_yearly_chart_data

# table
from table_data.table_data_monthly import get_grouped_table_data as get_monthly_table_data
from table_data.table_data_quarterly import get_grouped_table_data as get_quarterly_table_data
from table_data.table_data_halfyearly import get_grouped_table_data as get_halfyearly_table_data
from table_data.table_data_yearly import get_grouped_table_data as get_yearly_table_data

period_api = Blueprint('period_api', __name__)

# ✅ Chart API
@period_api.route('/api/delinquent/period/chart-data', methods=['GET'])
def get_period_chart():
    range_type = request.args.get('rangeType', '월간')

    if range_type == '월간':
        result = get_monthly_chart_data()
    elif range_type == '분기':
        result = get_quarterly_chart_data()
    elif range_type == '반기':
        result = get_half_year_chart_data()
    elif range_type == '연간':
        result = get_yearly_chart_data()
    else:
        return jsonify({'error': f'Invalid rangeType: {range_type}'}), 400

    return jsonify(result)

# ✅ Table API
@period_api.route('/api/delinquent/period/table-data', methods=['GET'])
def get_period_table():
    range_type = request.args.get('rangeType', '월간')

    if range_type == '월간':
        result = get_monthly_table_data()
    elif range_type == '분기':
        result = get_quarterly_table_data()
    elif range_type == '반기':
        result = get_halfyearly_table_data()
    elif range_type == '연간':
        result = get_yearly_table_data()
    else:
        return jsonify({'error': f'Invalid rangeType: {range_type}'}), 400

    return jsonify(result)
