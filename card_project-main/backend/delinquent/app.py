from flask import Flask
from flask_cors import CORS
from delinquent_recovery import recovery_api
from delinquent_period import period_api
from delinquent_radar import radar_api
from delinquent_detail import delinquent_detail_api  # ✅ 추가
from collection_handover import collection_handover_api  # ✅ 추가
from Delinquent_Target import bp_delinquent_target  # ✅ 추가

app = Flask(__name__)
CORS(app)

app.register_blueprint(recovery_api)
app.register_blueprint(period_api)
app.register_blueprint(radar_api)
app.register_blueprint(delinquent_detail_api)  # ✅ 추가
app.register_blueprint(collection_handover_api)  # ✅ 추가
app.register_blueprint(bp_delinquent_target)  # ✅ 추가

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=7000, debug=True)
