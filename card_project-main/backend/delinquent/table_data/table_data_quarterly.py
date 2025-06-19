from table_data.table_data_monthly import _run_query

# ✅ 분기 집계
def get_grouped_table_data():
    label_expr = "CONCAT(YEAR(STR_TO_DATE(base_month, '%Y%m')), ' Q', QUARTER(STR_TO_DATE(base_month, '%Y%m')))"
    return _run_query(label_expr)
