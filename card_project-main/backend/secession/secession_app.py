from flask import Flask
from flask_cors import CORS
from secession_cardbenefit import cardbenefit_api

app = Flask(__name__)
CORS(app) 

app.register_blueprint(cardbenefit_api)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=7001, debug=True)