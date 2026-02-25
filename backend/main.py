import os
import io
import cv2
import uvicorn
import asyncio
import numpy as np
import requests
import subprocess
import shutil
from pathlib import Path
from typing import List
from fastapi import FastAPI, File, UploadFile
from fastapi.responses import StreamingResponse, JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import logging

# --- Настройка логов ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- FastAPI и CORS ---
app = FastAPI(title="SENTINEL.SAT - AI Disaster Monitoring System", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- HuggingFace API ---
HF_API_URL = os.getenv(
    "HF_API_URL",
    "https://hf.space/embed/Dyman17/sentinel-watch/api/predict/"
)
HF_TOKEN = os.getenv("HF_TOKEN", "Bearer hf_xxxxxxxx")

# --- Пути для фронтенда ---
frontend_dir = Path(__file__).parent.parent / "frontend"
static_dir = Path(__file__).parent / "static"

# --- Стрим фронтенду ---
clients: List[asyncio.Queue] = []

# Disaster Detection Classes
YOLO_DISASTER_CLASSES = {
    "fire": ["fire", "flame", "smoke", "burning", "blaze"],
    "flood": ["flood", "water", "inundated", "submerged", "overflow"],
    "earthquake": ["earthquake", "collapse", "rubble", "destruction", "damaged"],
    "storm": ["storm", "tornado", "hurricane", "cyclone", "wind"]
}

# Global storage
detection_history = []

async def broadcast_frame(frame_bytes: bytes):
    """Рассылает кадр всем подключенным фронтенд-клиентам"""
    for queue in clients:
        try:
            await queue.put(frame_bytes)
        except:
            pass

@app.get("/api/stream")
async def stream():
    """SSE/MJPEG поток для фронта"""
    async def generator():
        q = asyncio.Queue()
        clients.append(q)
        try:
            while True:
                frame = await q.get()
                yield (b"--frame\r\n"
                       b"Content-Type: image/jpeg\r\n\r\n" + frame + b"\r\n")
        finally:
            if q in clients:
                clients.remove(q)
    return StreamingResponse(generator(), media_type="multipart/x-mixed-replace; boundary=frame")

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

@app.post("/api/upload-frame")
async def upload_frame(file: UploadFile = File(...)):
    """
    Принимает кадр от ESP32, стримит на фронт и отправляет на HuggingFace
    """
    try:
        # Читаем кадр
        img_bytes = await file.read()
        logger.info(f"📸 Получен кадр от ESP32: {len(img_bytes)} байт")
        
        # Конвертируем в numpy для обработки
        frame_np = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(frame_np, cv2.IMREAD_COLOR)
        
        if frame is None:
            # Если cv2 не смог декодировать, пробуем через PIL
            img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
            frame = np.array(img)
        
        # --- Отправляем на фронт ---
        try:
            _, jpeg_bytes = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
            await broadcast_frame(jpeg_bytes.tobytes())
            logger.info("📡 Кадр отправлен на фронтенд")
        except Exception as e:
            logger.error(f"❌ Ошибка отправки на фронтенд: {e}")
        
        # --- Отправляем на HuggingFace ---
        hf_result = None
        try:
            resp = requests.post(
                HF_API_URL,
                files={"data": ("frame.jpg", img_bytes, "image/jpeg")},
                headers={"Authorization": HF_TOKEN},
                timeout=10
            )
            
            if resp.status_code == 200:
                hf_result = resp.json()
                logger.info(f"🤖 HF анализ успешен: {hf_result}")
                
                # Обрабатываем результаты детекции
                predictions = hf_result.get('predictions', [])
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
                                'timestamp': asyncio.get_event_loop().time()
                            })
                            break
                
                analysis_result = {
                    'predictions': predictions,
                    'disaster_detections': disaster_detections,
                    'total_objects': len(predictions),
                    'disasters_found': len(disaster_detections),
                    'timestamp': asyncio.get_event_loop().time()
                }
                
                detection_history.append(analysis_result)
                hf_result = analysis_result
                
            else:
                logger.error(f"❌ HF API ошибка: {resp.status_code}")
                hf_result = {"error": f"HF API error: {resp.status_code}"}
                
        except Exception as e:
            logger.error(f"❌ Ошибка HF анализа: {e}")
            hf_result = {"error": str(e)}
        
        return JSONResponse({
            "status": "ok", 
            "message": "Frame received and processed",
            "hf_result": hf_result,
            "frame_size": len(img_bytes),
            "clients_connected": len(clients)
        })
        
    except Exception as e:
        logger.error(f"❌ Ошибка обработки кадра: {e}")
        return JSONResponse({
            "status": "error", 
            "message": str(e)
        }, status_code=500)

@app.post("/api/upload")
async def upload_image(file: UploadFile = File(...)):
    """
    Ручная загрузка изображения для анализа
    """
    try:
        img_bytes = await file.read()
        
        # Отправляем на HuggingFace
        hf_result = None
        try:
            resp = requests.post(
                HF_API_URL,
                files={"data": ("frame.jpg", img_bytes, "image/jpeg")},
                headers={"Authorization": HF_TOKEN},
                timeout=10
            )
            
            if resp.status_code == 200:
                hf_result = resp.json()
            else:
                hf_result = {"error": f"HF API error: {resp.status_code}"}
                
        except Exception as e:
            hf_result = {"error": str(e)}
        
        return JSONResponse({
            "status": "success", 
            "filename": file.filename,
            "hf_result": hf_result
        })
    except Exception as e:
        return JSONResponse({"status": "error", "message": str(e)})

@app.get("/api/health")
def health():
    """
    Проверка сервера и подключения к HuggingFace
    """
    try:
        resp = requests.get(HF_API_URL, headers={"Authorization": HF_TOKEN}, timeout=5)
        hf_status = resp.status_code
    except:
        hf_status = "fail"
    
    return {
        "server": "ok", 
        "hf": hf_status,
        "hf_api_url": HF_API_URL,
        "clients_connected": len(clients),
        "detections_count": len(detection_history)
    }

@app.get("/api/detections")
def get_detections():
    """
    Возвращает историю детекций
    """
    return {"history": detection_history[-20:]}  # Last 20 detections

@app.get("/api/status")
def get_status():
    """
    Статус системы
    """
    return {
        "esp32_connected": len(clients) > 0,
        "clients_count": len(clients),
        "hf_connected": True,  # TODO: проверить реальный статус
        "total_detections": len(detection_history),
        "last_detection": detection_history[-1] if detection_history else None
    }

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
        logger.info(f"🤖 HF API URL: {HF_API_URL}")
        logger.info(f"📡 Ожидаем кадры от ESP32 на /api/upload-frame")
        
        uvicorn.run(app, host="0.0.0.0", port=port)
        
    except Exception as e:
        logger.error(f"❌ Ошибка запуска сервера: {e}")
        raise
