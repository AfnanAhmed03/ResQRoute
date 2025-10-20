import psycopg2
from flask import Flask, jsonify, request
from flask_cors import CORS
import numpy as np
import tensorflow as tf
import joblib
import json # Import the json library

# --- 1. Initialize App and Load AI Model ---
app = Flask(__name__)
CORS(app)

try:
    model = tf.keras.models.load_model('../ml-model/src/traffic_model.keras')
    scaler = joblib.load('../ml-model/src/data_scaler.gz')
    print("--- AI Model and Scaler Loaded Successfully ---")
except Exception as e:
    print(f"Error loading model or scaler: {e}")
    model = None
    scaler = None

# --- 2. Database Connection Details ---
DB_NAME = "resqroute_db"
DB_USER = "postgres"
DB_PASS = "Biryani120$" # Remember to put your password here
DB_HOST = "localhost"
DB_PORT = "5432"

# --- 3. API Endpoints ---
@app.route("/api/dashboard-data", methods=['GET'])
def get_dashboard_data():
    # This function remains the same
    conn = psycopg2.connect(dbname=DB_NAME, user=DB_USER, password=DB_PASS, host=DB_HOST, port=DB_PORT)
    # ... (rest of the function is unchanged)
    cur = conn.cursor()
    
    cur.execute("SELECT id, name, icu_beds_available, icu_beds_total, er_capacity, lat, lng FROM hospitals;")
    hospitals_raw = cur.fetchall()
    hospitals_list = []
    for row in hospitals_raw:
        hospitals_list.append({
            "id": row[0], "name": row[1],
            "status": {"icu_beds_available": row[2], "icu_beds_total": row[3], "er_capacity": row[4]},
            "location": {"lat": float(row[5]), "lng": float(row[6])}
        })

    cur.execute("SELECT id, eta_minutes, patient_details, lat, lng FROM ambulances;")
    ambulances_raw = cur.fetchall()
    ambulances_list = []
    for row in ambulances_raw:
        ambulances_list.append({
            "id": row[0], "eta_minutes": row[1], "patient_details": row[2],
            "location": {"lat": float(row[3]), "lng": float(row[4])}
        })
            
    cur.close()
    conn.close()
    final_data = {"hospitals": hospitals_list, "ambulances": ambulances_list}
    return jsonify(final_data)

# --- 4. NEW Traffic Overlay Endpoint ---
@app.route("/api/traffic-overlay", methods=['GET'])
def get_traffic_overlay():
    """Predicts traffic for predefined road segments and returns their status."""
    conn = psycopg2.connect(dbname=DB_NAME, user=DB_USER, password=DB_PASS, host=DB_HOST, port=DB_PORT)
    cur = conn.cursor()
    cur.execute("SELECT name, path_coords FROM road_segments;")
    road_segments_raw = cur.fetchall()
    cur.close()
    conn.close()

    traffic_predictions = []
    # Create some sample input data for the prediction
    # In a real system, this would come from live sensors
    sample_input = np.random.rand(24, 65) # 24 hours, 65 features

    for name, path_coords in road_segments_raw:
        # --- Make a prediction using the AI model ---
        data_reshaped = np.reshape(sample_input, (1, 24, 65))
        prediction_scaled = model.predict(data_reshaped)
        dummy_array = np.zeros((1, 65))
        dummy_array[:, 0] = prediction_scaled
        prediction_unscaled = scaler.inverse_transform(dummy_array)[0, 0]

        # --- Classify traffic level ---
        traffic_status = 'low'
        if prediction_unscaled > 4500:
            traffic_status = 'high'
        elif prediction_unscaled > 2500:
            traffic_status = 'moderate'

        traffic_predictions.append({
            "name": name,
            "path": json.loads(path_coords), # Convert coordinate string to a list
            "status": traffic_status
        })
    
    return jsonify(traffic_predictions)

# The /api/predict endpoint remains for potential future use but is not used by the dashboard now
@app.route("/api/predict", methods=['POST'])
def predict_traffic():
    # ... (function is unchanged)
    pass 

if __name__ == "__main__":
    app.run(debug=True)