"""
HealthPath v2 - Flask Inference Service
==========================================
Loads the *entire* fitted sklearn Pipeline (healthpath_pipeline_v2.joblib)
so all preprocessing (imputation, scaling, one-hot encoding, feature engineering)
happens automatically inside ``pipeline.predict()``.

The Node.js backend (reportAnalysisController.js) sends raw patient JSON here;
this service converts it to a DataFrame and returns the prediction + confidence.
"""

import json
import os
import sys
import traceback

# Ensure local imports work regardless of CWD
_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, _SCRIPT_DIR)

import joblib
import numpy as np
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Must import custom transformer so joblib can unpickle the pipeline
from custom_transformers import MedicalFeatureEngineer  # noqa: F401

load_dotenv()

# ---------------------------------------------------------------------------
# Flask app
# ---------------------------------------------------------------------------
app = Flask(__name__)
CORS(app)

# ---------------------------------------------------------------------------
# Load the pipeline + label encoder ONCE at startup
# ---------------------------------------------------------------------------
MODEL_DIR = os.getenv("MODEL_DIR", os.path.join(os.path.dirname(os.path.abspath(__file__)), "models"))

pipeline = None
label_encoder = None
metadata = {}

def _load_artefacts():
    """Load pipeline, label encoder, and metadata from disk."""
    global pipeline, label_encoder, metadata

    pipeline_path  = os.path.join(MODEL_DIR, "healthpath_pipeline_v2.joblib")
    label_enc_path = os.path.join(MODEL_DIR, "label_encoder_v2.joblib")
    metadata_path  = os.path.join(MODEL_DIR, "model_metadata.json")

    if not os.path.exists(pipeline_path):
        raise FileNotFoundError(
            f"Pipeline file not found: {pipeline_path}  - run train_model_v2.py first."
        )

    pipeline = joblib.load(pipeline_path)
    print(f"[OK] Pipeline loaded from {pipeline_path}")

    if os.path.exists(label_enc_path):
        label_encoder = joblib.load(label_enc_path)
        print(f"[OK] Label encoder loaded ({len(label_encoder.classes_)} classes)")
    else:
        print("[WARNING] label_encoder_v2.joblib not found - predictions will be numeric")

    if os.path.exists(metadata_path):
        with open(metadata_path, "r") as f:
            metadata = json.load(f)
        print(f"[OK] Metadata loaded (v{metadata.get('version', '?')})")


try:
    _load_artefacts()
    print("[OK] ML Service v2 started successfully")
except Exception as e:
    print(f"[ERROR] Could not load model artefacts: {e}")
    traceback.print_exc()
    print("[WARNING] Service will start but /predict will fail until you train the model")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
EXPECTED_FEATURES = [
    "Age", "Gender", "BloodPressure", "Cholesterol", "Glucose",
    "HeartRate", "BMI", "Fever", "Cough", "Fatigue",
    "Headache", "Nausea", "ShortnessBreath",
]


def _raw_json_to_dataframe(data: dict) -> pd.DataFrame:
    """Convert a single patient JSON dict to a one-row DataFrame.

    Missing keys are filled with NaN so the pipeline's SimpleImputer handles them.
    """
    row = {}
    for col in EXPECTED_FEATURES:
        val = data.get(col, np.nan)
        # Keep Gender as string; coerce everything else to float
        if col == "Gender":
            row[col] = str(val) if val is not None and val is not np.nan else np.nan
        else:
            try:
                row[col] = float(val) if val is not None and val is not np.nan else np.nan
            except (ValueError, TypeError):
                row[col] = np.nan
    return pd.DataFrame([row])


def _predict_single(data: dict) -> dict:
    """Run one prediction through the pipeline and return a result dict."""
    df = _raw_json_to_dataframe(data)

    prediction_encoded = pipeline.predict(df)[0]
    probabilities      = pipeline.predict_proba(df)[0]

    # Decode numeric label â†’ disease name
    if label_encoder is not None:
        prediction_label = label_encoder.inverse_transform([prediction_encoded])[0]
        classes = label_encoder.classes_.tolist()
    else:
        prediction_label = str(prediction_encoded)
        classes = [str(i) for i in range(len(probabilities))]

    confidence = float(np.max(probabilities))
    prob_dict  = {str(cls): round(float(p), 4) for cls, p in zip(classes, probabilities)}

    return {
        "prediction":   prediction_label,
        "confidence":    round(confidence, 4),
        "probabilities": prob_dict,
        "status":        "success",
    }


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.route("/", methods=["GET"])
def root():
    """Service info."""
    return jsonify({
        "service": "HealthPath ML Service",
        "version": "2.0.0",
        "status":  "running",
        "endpoints": {
            "health":       "/health",
            "predict":      "/predict (POST)",
            "batch_predict": "/predict/batch (POST)",
            "model_info":   "/model/info (GET)",
        },
        "model_loaded": pipeline is not None,
    })


@app.route("/health", methods=["GET"])
def health():
    """Health check."""
    return jsonify({"status": "healthy", "model_loaded": pipeline is not None})


@app.route("/predict", methods=["POST"])
def predict():
    """Predict disease for a single patient report (raw JSON in, result out)."""
    if pipeline is None:
        return jsonify({
            "status": "error",
            "message": "Model not loaded. Run train_model_v2.py first.",
        }), 500

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"status": "error", "message": "No JSON data provided"}), 400

    try:
        result = _predict_single(data)
        return jsonify(result)
    except Exception as e:
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/predict/batch", methods=["POST"])
def predict_batch():
    """Batch prediction for multiple patient reports."""
    if pipeline is None:
        return jsonify({
            "status": "error",
            "message": "Model not loaded. Run train_model_v2.py first.",
        }), 500

    payload = request.get_json(silent=True)
    if not payload or "reports" not in payload:
        return jsonify({"status": "error", "message": "Provide a 'reports' array"}), 400

    try:
        results = [_predict_single(r) for r in payload["reports"]]
        return jsonify({"status": "success", "results": results})
    except Exception as e:
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/model/info", methods=["GET"])
def model_info():
    """Return model metadata and feature importance."""
    if pipeline is None:
        return jsonify({"status": "error", "message": "Model not loaded"}), 500

    feature_importance = metadata.get("feature_importance", {})
    return jsonify({
        "status":             "success",
        "model_loaded":       True,
        "metadata":           metadata,
        "feature_importance": feature_importance,
        "n_features":         len(metadata.get("feature_columns", [])),
    })


# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    port = int(os.getenv("ML_SERVICE_PORT", 5001))
    print(f"[OK] Starting HealthPath ML Service v2 on port {port}")
    app.run(host="0.0.0.0", port=port, debug=False)




