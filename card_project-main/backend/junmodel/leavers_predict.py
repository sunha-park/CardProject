from flask import Flask, jsonify
from flask_cors import CORS
from run_model import predict_from_input
import pymysql

app = Flask(__name__)
CORS(app)

# DB 연결 설정 (run_model.py에 이미 있을 가능 있음)
conn = pymysql.connect(
    host='localhost',
    user='wms',
    password='1234',
    db='card',
    charset='utf8mb4',
    cursorclass=pymysql.cursors.DictCursor
)

@app.route('/')
def index():
    return "모델 예측 API입니다. '/predict'로 GET 요청을 보내면 DB 기반 예측 수행"

@app.route('/predict', methods=['GET'])  # POST가 아니라 GET으로
def predict():
    try:
        with conn.cursor() as cursor:
            sql = "SELECT * FROM card_leaver"
            cursor.execute(sql)
            row = cursor.fetchall()

        if not row:
            return jsonify({"error": "DB에 예측할 데이터가 없습니다."}), 404

        pred, proba = predict_from_input(row)
        pred_list = pred.tolist()
        proba_list = proba.tolist()

        result = [
            {"발급회원번호": r["발급회원번호"], "prediction": int(p), "probability": round(float(prob), 4)}
            for r, p, prob in zip(row, pred_list, proba_list)
        ]
        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
