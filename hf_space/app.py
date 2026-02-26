import gradio as gr
import requests
import numpy as np
from PIL import Image
import io
import json
import time
import os
import torch
from ultralytics import YOLO
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import uvicorn

# --- Конфигурация ---
SENTINEL_SERVER_URL = os.getenv("SENTINEL_SERVER_URL", "https://sentinel-sat.onrender.com")
MODEL_PATH = os.getenv("MODEL_PATH", "best.pt")

# Disaster Detection Classes
YOLO_DISASTER_CLASSES = {
    "fire": ["fire", "flame", "smoke", "burning", "blaze"],
    "flood": ["flood", "water", "inundated", "submerged", "overflow"],
    "earthquake": ["earthquake", "collapse", "rubble", "destruction", "damaged"],
    "storm": ["storm", "tornado", "hurricane", "cyclone", "wind"]
}

# --- Загрузка YOLOv8 модели ---
print("Loading YOLOv8 model...")
model = None
try:
    model = YOLO(MODEL_PATH)
    print(f"✅ Model loaded: {MODEL_PATH}")
except Exception as e:
    print(f"Error loading model: {e}")
    # Fallback на nano модель если нет локальной
    try:
        model = YOLO("yolov8n.pt")
        print("Using default YOLOv8n model")
    except:
        print("Failed to load any model")


def run_detection(image):
    """Запускает YOLO детекцию"""
    if model is None:
        return []
    try:
        # YOLOv8 prediction
        results = model.predict(source=image, conf=0.3, verbose=False)

        predictions = []
        for result in results:
            for box in result.boxes:
                predictions.append({
                    'label': result.names[int(box.cls)],
                    'score': round(float(box.conf), 4),
                    'box': {
                        'xmin': round(float(box.xyxy[0][0])),
                        'ymin': round(float(box.xyxy[0][1])),
                        'xmax': round(float(box.xyxy[0][2])),
                        'ymax': round(float(box.xyxy[0][3]))
                    }
                })
        return predictions
    except Exception as e:
        print(f"Detection error: {e}")
        return []


def classify_disasters(predictions):
    """Маппит предсказания на катастрофы"""
    disaster_detections = []
    for pred in predictions:
        label = pred.get('label', '').lower()
        score = pred.get('score', 0)
        for disaster_type, keywords in YOLO_DISASTER_CLASSES.items():
            if any(keyword in label for keyword in keywords):
                disaster_detections.append({
                    'label': disaster_type,
                    'score': score,
                    'original_label': label,
                    'box': pred.get('box', {}),
                    'timestamp': time.time()
                })
                break
    return disaster_detections


def send_to_server(result):
    """Отправляет на SENTINEL.SAT сервер"""
    try:
        response = requests.post(
            f"{SENTINEL_SERVER_URL}/api/hf-results",
            json=result,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        if response.status_code == 200:
            print(f"Results sent to server")
        else:
            print(f"Server error: {response.status_code}")
    except Exception as e:
        print(f"Error sending to server: {e}")


def analyze_image(image):
    """Gradio callback"""
    if image is None:
        return "Please upload an image", None

    try:
        predictions = run_detection(image)
        disaster_detections = classify_disasters(predictions)

        analysis_result = {
            'predictions': predictions,
            'disaster_detections': disaster_detections,
            'total_objects': len(predictions),
            'disasters_found': len(disaster_detections),
            'timestamp': time.time(),
            'hf_space': True
        }

        # Отправляем на сервер
        send_to_server(analysis_result)

        # Текстовый результат
        text = f"Analysis complete\n\n"
        text += f"Total objects: {len(predictions)}\n"
        text += f"Disasters found: {len(disaster_detections)}\n\n"

        if disaster_detections:
            text += "Detected disasters:\n"
            for i, d in enumerate(disaster_detections, 1):
                text += f"{i}. {d['label'].upper()} ({d['score']:.2f})\n"
        else:
            text += "No disasters detected\n\n"

        if predictions:
            text += "\nAll detections:\n"
            for pred in predictions:
                text += f"  - {pred['label']} ({pred['score']:.2f})\n"

        return text, image

    except Exception as e:
        return f"Error: {str(e)}", None


def check_server_status():
    """Проверяет статус сервера"""
    try:
        response = requests.get(f"{SENTINEL_SERVER_URL}/api/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            return f"Server: online\nClients: {data.get('clients_connected', 0)}\nDetections: {data.get('detections_count', 0)}"
        else:
            return f"Server error: {response.status_code}"
    except Exception as e:
        return f"Connection error: {str(e)}"


# --- Gradio UI ---
with gr.Blocks(title="SENTINEL.SAT - AI Disaster Detection", theme=gr.themes.Soft()) as demo:
    gr.Markdown("# 🛰️ SENTINEL.SAT - AI Disaster Detection")
    gr.Markdown("### Real-time disaster detection with YOLOv8")

    with gr.Row():
        with gr.Column(scale=2):
            image_input = gr.Image(label="Upload image", type="pil", height=400)

            with gr.Row():
                analyze_btn = gr.Button("🔍 Analyze", variant="primary", scale=1)
                clear_btn = gr.Button("🗑️ Clear", scale=1)

            result_output = gr.Textbox(label="Results", lines=12)

        with gr.Column(scale=1):
            gr.Markdown("#### System Status")
            status_text = gr.Textbox(label="Server", value="Checking...", lines=3, interactive=False)
            refresh_btn = gr.Button("🔄 Refresh", size="sm")

            model_status = "✅ Loaded" if model else "❌ Error"
            gr.Markdown(f"""
#### Info
**Model:** YOLOv8
**Status:** {model_status}
**Device:** {'CUDA' if torch.cuda.is_available() else 'CPU'}

**Disasters detected:**
- 🔥 Fire
- 🌊 Flood
- 🌍 Earthquake
- ⛈️ Storm
            """)

    analyze_btn.click(analyze_image, inputs=[image_input], outputs=[result_output])
    clear_btn.click(lambda: (None, ""), outputs=[image_input, result_output])
    refresh_btn.click(check_server_status, outputs=[status_text])
    demo.load(check_server_status, outputs=[status_text])


# --- FastAPI ---
app = FastAPI(title="SENTINEL.SAT AI API", version="1.0.0")


@app.get("/")
async def root():
    return {"message": "SENTINEL.SAT AI Disaster Detection API", "status": "running"}


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "model_type": "YOLOv8",
        "device": "cuda" if torch.cuda.is_available() else "cpu"
    }


@app.post("/predict")
async def predict(request: Request):
    """Принимает JPEG, возвращает детекции"""
    try:
        img_data = await request.body()
        image = Image.open(io.BytesIO(img_data)).convert("RGB")

        predictions = run_detection(image)
        disaster_detections = classify_disasters(predictions)

        result = {
            "predictions": predictions,
            "disaster_detections": disaster_detections,
            "total_objects": len(predictions),
            "disasters_found": len(disaster_detections),
            "timestamp": time.time()
        }

        # Отправляем на сервер
        send_to_server(result)

        return result

    except Exception as e:
        return {"error": str(e), "predictions": [], "disasters_found": 0}


# Монтируем Gradio
app = gr.mount_gradio_app(app, demo, path="/gradio")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=7860)
