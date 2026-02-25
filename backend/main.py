import os
import io
import time
import requests
import numpy as np
import subprocess
import shutil
from pathlib import Path
from typing import Dict, Any, List
from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse, StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from starlette.background import BackgroundTask
from PIL import Image
import uvicorn
import logging

# ----------------------------
# Настройки
# ----------------------------
HF_API_URL = os.getenv("HF_API_URL", "https://api-inference.huggingface.co/models/Dyman17/sentinel-watch")
HF_TOKEN = os.getenv("HF_TOKEN", "")
ESP_STREAM_URL = os.getenv("ESP_STREAM_URL", "http://192.168.1.100:81/stream")

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# --- Пути для фронтенда ---
frontend_dir = Path(__file__).parent.parent / "frontend"
static_dir = Path(__file__).parent / "static"

# Disaster Detection Classes
YOLO_DISASTER_CLASSES = {
    "fire": ["fire", "flame", "smoke", "burning", "blaze"],
    "flood": ["flood", "water", "inundated", "submerged", "overflow"],
    "earthquake": ["earthquake", "collapse", "rubble", "destruction", "damaged"],
    "storm": ["storm", "tornado", "hurricane", "cyclone", "wind"]
}

# Global storage
detection_history = []

# Настройка логов
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ----------------------------
# FastAPI и CORS
# ----------------------------
app = FastAPI(title="SENTINEL.SAT - AI Disaster Monitoring System", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------------
# Билд фронтенда
# ----------------------------
def build_frontend():
    """Билдит фронтенд и копирует в static"""
    try:
        logger.info("📦 Билдим фронтенд...")
        
        if not frontend_dir.exists():
            raise FileNotFoundError(f"Папка frontend не найдена: {frontend_dir}")
        
        logger.info("📦 npm install...")
        result = subprocess.run(["npm", "install"], cwd=frontend_dir, capture_output=True, text=True)
        if result.returncode != 0:
            logger.error(f"npm install failed: {result.stderr}")
            raise Exception("npm install failed")
        
        logger.info("🔨 npm run build...")
        result = subprocess.run(["npm", "run", "build"], cwd=frontend_dir, capture_output=True, text=True)
        if result.returncode != 0:
            logger.error(f"npm run build failed: {result.stderr}")
            raise Exception("npm run build failed")
        
        if static_dir.exists():
            shutil.rmtree(static_dir)
        static_dir.mkdir()
        
        dist_dir = frontend_dir / "dist"
        if not dist_dir.exists():
            raise FileNotFoundError(f"Папка dist не найдена после сборки: {dist_dir}")
        
        shutil.copytree(dist_dir, static_dir, dirs_exist_ok=True)
        logger.info("✅ Фронтенд собран и скопирован в static/")
        
        index_path = static_dir / "index.html"
        if not index_path.exists():
            raise FileNotFoundError(f"index.html не найден в static: {index_path}")
        
        logger.info(f"✅ index.html найден: {index_path}")
        
    except Exception as e:
        logger.error(f"❌ Ошибка сборки фронтенда: {e}")
        raise

# ----------------------------
# Вспомогательные функции
# ----------------------------
def analyze_with_hf(frame: np.ndarray) -> Dict[str, Any]:
    """
    Отправляет кадр на HuggingFace модель и возвращает результаты
    """
    try:
        headers = {"Authorization": f"Bearer {HF_TOKEN}"} if HF_TOKEN else {}
        img_bytes = io.BytesIO()
        Image.fromarray(frame).save(img_bytes, format="JPEG")
        img_bytes.seek(0)
        
        response = requests.post(HF_API_URL, headers=headers, files={"file": img_bytes}, timeout=30)
        if response.status_code != 200:
            logger.error(f"HF API error: {response.status_code} - {response.text}")
            return {"error": f"HF API error: {response.status_code}"}
        
        result = response.json()
        logger.info(f"YOLO analysis successful: {len(result.get('predictions', []))} objects detected")
        
        # Process YOLO predictions for disaster detection
        predictions = result.get('predictions', [])
        disaster_detections = []
        
        for pred in predictions:
            label = pred.get('label', '').lower()
            score = pred.get('score', 0)
            
            # Map YOLO labels to disaster categories
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
        
        analysis_result = {
            'predictions': predictions,
            'disaster_detections': disaster_detections,
            'total_objects': len(predictions),
            'disasters_found': len(disaster_detections),
            'timestamp': time.time()
        }
        
        detection_history.append(analysis_result)
        return analysis_result
        
    except Exception as e:
        logger.error(f"Error in HF analysis: {e}")
        return {"error": str(e)}

def fetch_esp_frame() -> np.ndarray:
    """
    Получает кадр с ESP32 потока
    """
    try:
        resp = requests.get(ESP_STREAM_URL, stream=True, timeout=10)
        if resp.status_code != 200:
            raise RuntimeError(f"Failed to fetch ESP32 frame: {resp.status_code}")
        
        img = Image.open(resp.raw).convert("RGB")
        return np.array(img)
    except Exception as e:
        logger.error(f"Error fetching ESP32 frame: {e}")
        raise

def test_hf_connection():
    """Test connection to HuggingFace API"""
    try:
        response = requests.get(HF_API_URL.replace("/models/", "/models/"), headers={"Authorization": f"Bearer {HF_TOKEN}"}, timeout=10)
        if response.status_code == 200:
            logger.info("✅ HuggingFace API connection successful")
            return True
        else:
            logger.error(f"❌ HF API connection failed: {response.status_code}")
            return False
    except Exception as e:
        logger.error(f"❌ HF API connection error: {e}")
        return False

# ----------------------------
# API эндпоинты
# ----------------------------

@app.get("/api/health")
def health_check():
    """
    Проверка подключения к HuggingFace
    """
    hf_status = test_hf_connection()
    return {
        "hf_status": hf_status, 
        "hf_api_url": HF_API_URL,
        "esp_stream_url": ESP_STREAM_URL,
        "message": "HuggingFace connection OK" if hf_status else "Failed"
    }

@app.post("/api/upload")
async def upload_image(file: UploadFile = File(...)):
    """
    Получение фото с ESP32 или ручная загрузка
    """
    try:
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as f:
            f.write(await file.read())
        
        # Анализируем загруженное изображение
        img = Image.open(file_path).convert("RGB")
        frame = np.array(img)
        result = analyze_with_hf(frame)
        
        return JSONResponse({
            "status": "success", 
            "filename": file.filename,
            "analysis": result
        })
    except Exception as e:
        return JSONResponse({"status": "error", "message": str(e)})

@app.get("/api/analyze")
def analyze_latest():
    """
    Анализ последнего кадра с ESP32 через HuggingFace
    """
    try:
        frame = fetch_esp_frame()
        result = analyze_with_hf(frame)
        return JSONResponse({"status": "success", "result": result})
    except Exception as e:
        return JSONResponse({"status": "error", "message": str(e)})

@app.get("/api/detections")
def detections_history():
    """
    Возвращает историю детекций
    """
    return {"history": detection_history[-20:]}  # Last 20 detections

@app.post("/api/set-stream")
def set_stream(url: str):
    """
    Установка нового URL видеопотока ESP32
    """
    global ESP_STREAM_URL
    ESP_STREAM_URL = url
    return {"status": "success", "new_stream_url": ESP_STREAM_URL}

@app.get("/api/stream")
def stream_camera():
    """
    Потоковое видео (jpeg snapshot) с ESP32
    """
    try:
        frame = fetch_esp_frame()
        img_bytes = io.BytesIO()
        Image.fromarray(frame).save(img_bytes, format="JPEG")
        img_bytes.seek(0)
        return StreamingResponse(io.BytesIO(img_bytes.read()), media_type="image/jpeg")
    except Exception as e:
        return JSONResponse({"status": "error", "message": str(e)})

# --- Статика и фронтенд ---
app.mount("/static", StaticFiles(directory="static", html=True), name="static")

@app.get("/")
def serve_frontend():
    index_path = os.path.join("static", "index.html")
    if os.path.exists(index_path):
        logger.info(f"📄 Отдаю index.html: {index_path}")
        return FileResponse(index_path)
    else:
        logger.error(f"❌ index.html не найден: {index_path}")
        return JSONResponse({"error": "Frontend not built yet"}, status_code=503)

# Fallback для всех остальных путей - отдаем index.html для React Router
@app.get("/{full_path:path}")
def serve_spa(full_path: str):
    index_path = os.path.join("static", "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return JSONResponse({"error": "Not found"}, status_code=404)

# --- Старт сервера ---
if __name__ == "__main__":
    try:
        # Билдим фронтенд
        build_frontend()
        
        # Запускаем сервер
        port = int(os.environ.get("PORT", 8000))
        logger.info(f"🚀 Запускаем сервер на порту {port}")
        
        uvicorn.run(app, host="0.0.0.0", port=port)
        
    except Exception as e:
        logger.error(f"❌ Ошибка запуска сервера: {e}")
        raise
