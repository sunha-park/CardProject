from chart_data.common_chart_query import run_chart_query
from datetime import datetime

def get_monthly_chart_data():
    label_expr = "base_month"
    def format_label(base_month):
        dt = datetime.strptime(str(base_month), "%Y%m")
        return f"{dt.year}-{dt.month:02d}"
    return run_chart_query(label_expr, format_label)
