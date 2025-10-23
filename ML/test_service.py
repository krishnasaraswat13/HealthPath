"""Quick test script for ml_service.py endpoints."""
from urllib.request import urlopen, Request
import json

BASE = "http://127.0.0.1:5001"

# 1. Health check
r = urlopen(f"{BASE}/health")
print("=== /health ===")
print(json.loads(r.read()))
print()

# 2. Model info
r = urlopen(f"{BASE}/model/info")
info = json.loads(r.read())
meta = info["metadata"]
print("=== /model/info ===")
print(f"  Version : {meta.get('version')}")
print(f"  Type    : {meta.get('model_type')}")
print(f"  Accuracy: {meta['test_metrics']['accuracy']}")
print(f"  F1      : {meta['test_metrics']['f1_score']}")
print(f"  Classes : {meta['classes']}")
print()

# 3. Single prediction
patient = {
    "Age": 45, "Gender": "Male", "BloodPressure": 160,
    "Cholesterol": 280, "Glucose": 180, "HeartRate": 85,
    "BMI": 30, "Fever": 0, "Cough": 1, "Fatigue": 1,
    "Headache": 0, "Nausea": 0, "ShortnessBreath": 1,
}
req = Request(
    f"{BASE}/predict",
    data=json.dumps(patient).encode(),
    headers={"Content-Type": "application/json"},
)
r = urlopen(req)
result = json.loads(r.read())
print("=== /predict (single) ===")
print(f"  Prediction: {result['prediction']}")
print(f"  Confidence: {result['confidence']}")
print()

# 4. Batch prediction
batch_payload = {
    "reports": [
        {"Age": 25, "Gender": "Female", "BloodPressure": 110,
         "Cholesterol": 180, "Glucose": 90, "HeartRate": 72,
         "BMI": 22, "Fever": 0, "Cough": 0, "Fatigue": 0,
         "Headache": 0, "Nausea": 0, "ShortnessBreath": 0},
        {"Age": 70, "Gender": "Male", "BloodPressure": 95,
         "Cholesterol": 200, "Glucose": 190, "HeartRate": 100,
         "BMI": 20, "Fever": 0, "Cough": 1, "Fatigue": 0,
         "Headache": 0, "Nausea": 0, "ShortnessBreath": 0},
    ]
}
req = Request(
    f"{BASE}/predict/batch",
    data=json.dumps(batch_payload).encode(),
    headers={"Content-Type": "application/json"},
)
r = urlopen(req)
batch_result = json.loads(r.read())
print("=== /predict/batch ===")
for i, res in enumerate(batch_result["results"]):
    print(f"  Patient {i+1}: {res['prediction']} (confidence: {res['confidence']})")

print("\nAll endpoints working!")
