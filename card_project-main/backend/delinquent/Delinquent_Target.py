from flask import Blueprint, request, jsonify
import mysql.connector

bp_delinquent_target = Blueprint("bp_delinquent_target", __name__)

db_config = {
    'host': 'localhost',
    'user': 'card',
    'password': '1234',
    'database': 'card',
    'charset': 'utf8'
}

# ✅ 연체 고객 리스트 API
@bp_delinquent_target.route('/api/delinquent/target-list')
def get_target_list():
    term = request.args.get('term', '60_90')

    # 연체 기간 범위 설정
    if term == '60_90':
        min_day, max_day = 60, 90
    else:
        min_day, max_day = 91, 999

    # SQL 쿼리
    query = """
        SELECT 
            member_id,
            name,
            age,
            gender,
            phone_number,
            address,
            overdue_days_recent
        FROM collection_list
        WHERE overdue_days_recent BETWEEN %s AND %s
    """

    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        cursor.execute(query, (min_day, max_day))
        result = cursor.fetchall()
    except mysql.connector.Error as err:
        return jsonify({'error': str(err)}), 500
    finally:
        cursor.close()
        conn.close()

    return jsonify(result)


# ✅ 체크리스트 API
@bp_delinquent_target.route('/api/delinquent/checklist/<member_id>')
def get_checklist(member_id):
    query = """
    SELECT item, status
    FROM delinquent_checklist
    WHERE member_id = %s
    ORDER BY item
    """

    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True)
    cursor.execute(query, (member_id,))
    result = cursor.fetchall()
    cursor.close()
    conn.close()

    return jsonify(result)


# ✅ 추심 이력 API
@bp_delinquent_target.route('/api/delinquent/action-log/<member_id>')
def get_action_log(member_id):
    query = """
    SELECT action_type, action_detail, action_by, action_date
    FROM collection_action_log
    WHERE member_id = %s
    ORDER BY action_date DESC
    LIMIT 5
    """

    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True)
    cursor.execute(query, (member_id,))
    result = cursor.fetchall()
    cursor.close()
    conn.close()

    return jsonify(result)
