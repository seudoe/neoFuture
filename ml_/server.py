"""
Flask server for quality score prediction.
Run: python server.py
Then expose with ngrok: ngrok http 5000
Copy the ngrok URL into .env.local as NEXT_PUBLIC_ML_API=https://xxxx.ngrok-free.app/predict
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
import numpy as np
import json
from PIL import Image
import io
import os

app = Flask(__name__)
CORS(app)

# ── Load model ────────────────────────────────────────────────────────────────
MODEL_PATH      = os.path.join(os.path.dirname(__file__), 'quality_model_v2.keras')
CLASS_NAMES_PATH = os.path.join(os.path.dirname(__file__), 'class_names.json')

print(f'Loading model from {MODEL_PATH}...')
model = tf.keras.models.load_model(MODEL_PATH)

with open(CLASS_NAMES_PATH) as f:
    class_names = json.load(f)

print(f'Model loaded. Classes: {class_names}')


def quality_score_from_confidence(predicted_class: str, confidence: float) -> int:
    """
    Maps model output → quality_score 1-5.
      fresh + high confidence → 5
      fresh + low  confidence → 3
      stale + low  confidence → 3
      stale + high confidence → 1
    """
    if predicted_class == 'fresh':
        if confidence >= 0.85: return 5
        if confidence >= 0.65: return 4
        return 3
    else:  # stale
        if confidence >= 0.85: return 1
        if confidence >= 0.65: return 2
        return 3


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'classes': class_names})


@app.route('/predict', methods=['POST'])
def predict():
    file = request.files.get('file')
    if not file:
        return jsonify({'error': 'No file provided'}), 400

    try:
        img = Image.open(io.BytesIO(file.read())).resize((224, 224)).convert('RGB')
        arr = np.array(img, dtype='float32')
        arr = tf.keras.applications.mobilenet_v2.preprocess_input(arr)
        preds = model.predict(np.expand_dims(arr, 0), verbose=0)[0]

        idx  = int(np.argmax(preds))
        cls  = class_names[idx]
        conf = float(preds[idx])
        score = quality_score_from_confidence(cls, conf)

        return jsonify({
            'filename':         file.filename,
            'predicted_class':  cls,
            'confidence_score': f'{conf * 100:.1f}%',
            'quality_score':    score,
            'message':          f'Image classified as {cls} with {conf * 100:.1f}% confidence'
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
