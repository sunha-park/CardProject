from chart_data.common_chart_query import run_chart_query

def get_half_year_chart_data():
    label_expr = "CONCAT(YEAR(STR_TO_DATE(base_month, '%Y%m')), '-H', IF(MONTH(STR_TO_DATE(base_month, '%Y%m')) <= 6, 1, 2))"
    return run_chart_query(label_expr, lambda s: s)
