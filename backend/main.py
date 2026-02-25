import subprocess
import shutil
from pathlib import Path
import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse
import uvicorn
import logging
import requests
import json
from typing import Dict, Any, List
import base64
from io import BytesIO
from PIL import Image
import numpy as np
import cv2

# Настройка логов
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="SENTINEL.SAT", version="1.0.0")

# --- Пути ---
frontend_dir = Path(__file__).parent.parent / "frontend"
static_dir = Path(__file__).parent / "static"

# --- HuggingFace Configuration ---
HF_API_URL = os.getenv("HF_API_URL", "https://api-inference.huggingface.co/models/your-username/disaster-detection")
HF_TOKEN = os.getenv("HF_TOKEN", "")
HEADERS = {"Authorization": f"Bearer {HF_TOKEN}"} if HF_TOKEN else {}

# --- Disaster Detection Classes ---
YOLO_DISASTER_CLASSES = {
    "fire": ["fire", "flame", "smoke", "burning", "blaze"],
    "flood": ["flood", "water", "inundated", "submerged", "overflow"],
    "earthquake": ["earthquake", "collapse", "rubble", "destruction", "damaged"],
    "storm": ["storm", "tornado", "hurricane", "cyclone", "wind"]
}

# --- Global Variables ---
current_frame = None
detection_results = []
stream_url = os.getenv("ESP_STREAM_URL", "http://192.168.1.100:81/stream")

# --- HuggingFace Analysis Function ---
def analyze_with_hf(frame: np.ndarray) -> Dict[str, Any]:
    """Analyze image frame using HuggingFace YOLO API"""
    try:
        # Convert frame to bytes
        _, img_encoded = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
        img_bytes = img_encoded.tobytes()
        
        # Send to HuggingFace YOLO
        response = requests.post(
            HF_API_URL,
            headers=HEADERS,
            data=img_bytes,
            timeout=30
        )
        
        if response.status_code == 200:
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
                            'box': pred.get('box', {})
                        })
                        break
            
            return {
                'predictions': predictions,
                'disaster_detections': disaster_detections,
                'total_objects': len(predictions),
                'disasters_found': len(disaster_detections)
            }
        else:
            logger.error(f"HF API error: {response.status_code} - {response.text}")
            return {"error": f"API error: {response.status_code}"}
            
    except Exception as e:
        logger.error(f"Error in HF analysis: {e}")
        return {"error": str(e)}

# --- Test HF Connection ---
def test_hf_connection():
    """Test connection to HuggingFace API"""
    try:
        response = requests.get(HF_API_URL.replace("/models/", "/models/"), headers=HEADERS, timeout=10)
        if response.status_code == 200:
            logger.info("✅ HuggingFace API connection successful")
            return True
        else:
            logger.error(f"❌ HF API connection failed: {response.status_code}")
            return False
    except Exception as e:
        logger.error(f"❌ HF API connection error: {e}")
        return False
def build_frontend():
    """Билдит фронтенд и копирует в static"""
    try:
        logger.info("📦 Билдим фронтенд...")
        
        # Проверяем наличие frontend
        if not frontend_dir.exists():
            raise FileNotFoundError(f"Папка frontend не найдена: {frontend_dir}")
        
        # Устанавливаем зависимости
        logger.info("📦 npm install...")
        result = subprocess.run(["npm", "install"], cwd=frontend_dir, capture_output=True, text=True)
        if result.returncode != 0:
            logger.error(f"npm install failed: {result.stderr}")
            raise Exception("npm install failed")
        
        # Собираем фронтенд
        logger.info("🔨 npm run build...")
        result = subprocess.run(["npm", "run", "build"], cwd=frontend_dir, capture_output=True, text=True)
        if result.returncode != 0:
            logger.error(f"npm run build failed: {result.stderr}")
            raise Exception("npm run build failed")
        
        # Копируем в static
        if static_dir.exists():
            shutil.rmtree(static_dir)
        static_dir.mkdir()
        
        dist_dir = frontend_dir / "dist"
        if not dist_dir.exists():
            raise FileNotFoundError(f"Папка dist не найдена после сборки: {dist_dir}")
        
        shutil.copytree(dist_dir, static_dir, dirs_exist_ok=True)
        logger.info("✅ Фронтенд собран и скопирован в static/")
        
        # Проверяем что скопировалось
        index_path = static_dir / "index.html"
        if not index_path.exists():
            raise FileNotFoundError(f"index.html не найден в static: {index_path}")
        
        logger.info(f"✅ index.html найден: {index_path}")
        
    except Exception as e:
        logger.error(f"❌ Ошибка сборки фронтенда: {e}")
        raise

# --- Монтируем статику ---
app.mount("/static", StaticFiles(directory="static", html=True), name="static")

# --- API Endpoints ---
@app.get("/api/health")
def health():
    hf_status = test_hf_connection()
    return {
        "status": "ok", 
        "message": "SENTINEL.SAT работает!",
        "hf_connected": hf_status,
        "hf_api_url": HF_API_URL,
        "stream_url": stream_url
    }

@app.get("/api/analyze")
def analyze():
    """Analyze current frame with HuggingFace"""
    if current_frame is None:
        return {"error": "No frame available"}
    
    result = analyze_with_hf(current_frame)
    detection_results.append(result)
    return result

@app.get("/api/stream")
def stream():
    """Get video stream URL"""
    return {"stream_url": stream_url, "status": "active"}

@app.get("/api/detections")
def get_detections():
    """Get recent detection results"""
    return {"detections": detection_results[-10:]}  # Last 10 detections

@app.post("/api/set-stream")
def set_stream_url(data: Dict[str, str]):
    """Set new stream URL"""
    global stream_url
    stream_url = data.get("url", stream_url)
    return {"success": True, "stream_url": stream_url}

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
