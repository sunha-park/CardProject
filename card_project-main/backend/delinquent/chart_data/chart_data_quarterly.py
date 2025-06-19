from chart_data.common_chart_query import run_chart_query

def get_quarterly_chart_data():
    label_expr = "CONCAT(YEAR(STR_TO_DATE(base_month, '%Y%m')), ' Q', QUARTER(STR_TO_DATE(base_month, '%Y%m')))"
    return run_chart_query(label_expr, lambda s: s)
