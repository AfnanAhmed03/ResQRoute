from flask import Flask, jsonify
from flask_cors import CORS

# Initialize the Flask app
app = Flask(__name__)
# Enable CORS for all routes, allowing your frontend to make requests
CORS(app)

# This is the same mock data you had in your JSON file
mock_data = {
  "hospitals": [
    {
      "id": "SRM_VDP_01",
      "name": "SRM Hospital, Vadapalani",
      "status": {
        "icu_beds_available": 5,
        "icu_beds_total": 20,
        "er_capacity": "High"
      }
    }
  ],
  "ambulances": [
    {
      "id": "TN-01-G-1008",
      "eta_minutes": 12,
      "patient_details": "Cardiac Arrest, Male, 54"
    },
    {
      "id": "TN-07-R-4047",
      "eta_minutes": 19,
      "patient_details": "Trauma Injury, Female, 32"
    },
    {
      "id": "TN-05-B-1121",
      "eta_minutes": 8,
      "patient_details": "Respiratory Distress, Male, 68"
    },
    {
      "id": "TN-22-C-9870",
      "eta_minutes": 25,
      "patient_details": "Stroke, Female, 71"
    },
    {
      "id": "TN-09-A-3030",
      "eta_minutes": 15,
      "patient_details": "Severe Burn, Male, 24"
    }
  ]
}

# Define an API endpoint that returns your mock data
@app.route("/api/dashboard-data", methods=['GET'])
def get_dashboard_data():
    return jsonify(mock_data)

# This allows you to run the app by typing "python app.py"
if __name__ == "__main__":
    app.run(debug=True)