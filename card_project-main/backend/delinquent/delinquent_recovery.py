from flask import Blueprint, request, jsonify
from recovery_data.recovery_line_table_data import run_recovery_chart_query_all,get_recovery_detail_table
from recovery_data.recovery_bar_data import get_recovery_bar_data
from recovery_data.recovery_pie_data import get_recovery_pie_data
#from recovery_data.chart_data_30under import get_30under_data
#from recovery_data.chart_data_30_60 import get_30_60_data
#from recovery_data.chart_data_60_90 import get_60_90_data

recovery_api = Blueprint('recovery_api', __name__)

@recovery_api.route('/api/delinquent/recovery/chart-data', methods=['GET'])
def get_recovery_chart():
    base_month = request.args.get('baseMonth')
    term_group = request.args.get('termGroup')

    if not base_month or not term_group:
        return jsonify({'error': 'baseMonth and termGroup are required'}), 400

    return jsonify({
        'lineData': run_recovery_chart_query_all()['lineData'],
        'barData': get_recovery_bar_data(base_month),
        'pieData': get_recovery_pie_data(base_month, term_group),
        'radarData': []
    })




@recovery_api.route('/api/delinquent/recovery/table-data', methods=['GET'])
def get_recovery_table_all_api():
     return get_recovery_detail_table()