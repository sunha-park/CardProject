from chart_data.common_chart_query import run_chart_query

def get_yearly_chart_data():
    label_expr = "YEAR(STR_TO_DATE(base_month, '%Y%m'))"
    return run_chart_query(label_expr, lambda s: str(s))
