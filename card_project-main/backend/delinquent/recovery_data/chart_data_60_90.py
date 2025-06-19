from backend.delinquent.recovery_data.recovery_line_table_data import run_recovery_chart_query

def get_60_90_data():
    return run_recovery_chart_query(60, 90)