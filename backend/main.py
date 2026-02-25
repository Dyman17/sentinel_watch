import os
import io
import uvicorn
import asyncio
import numpy as np
import requests
import subprocess
import shutil
from pathlib import Path
from typing import List
from fastapi import FastAPI, File, UploadFile, WebSocket, WebSocketDisconnect, Request
from fastapi.responses import StreamingResponse, JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import logging
import json
import time

# --- Настройка логов ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def convert_rgb565_to_rgb(rgb565_data, width, height):
    """
    Конвертирует RGB565 в RGB888
    """
    # Переформатируем в 2D массив uint16
    rgb565_pixels = rgb565_data.view(dtype=np.uint16).reshape((height, width))
    
    # Извлекаем RGB компоненты
    r5 = (rgb565_pixels >> 11) & 0x1F
    g6 = (rgb565_pixels >> 5) & 0x3F
    b5 = rgb565_pixels & 0x1F
    
    # Конвертируем в 8-bit
    r8 = (r5 * 255 + 15) // 31
    g8 = (g6 * 255 + 31) // 63
    b8 = (b5 * 255 + 15) // 31
    
    # Создаем RGB массив
    rgb_array = np.zeros((height, width, 3), dtype=np.uint8)
    rgb_array[:, :, 0] = r8
    rgb_array[:, :, 1] = g8
    rgb_array[:, :, 2] = b8
    
    return rgb_array

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

# --- WebSocket клиенты для логов ---
log_clients: List[WebSocket] = []

# --- Очередь логов ---
log_queue = asyncio.Queue()

# Disaster Detection Classes
YOLO_DISASTER_CLASSES = {
    "fire": ["fire", "flame", "smoke", "burning", "blaze"],
    "flood": ["flood", "water", "inundated", "submerged", "overflow"],
    "earthquake": ["earthquake", "collapse", "rubble", "destruction", "damaged"],
    "storm": ["storm", "tornado", "hurricane", "cyclone", "wind"]
}

# --- Глобальные переменные для оптимизации ---
latest_log = {}
last_analysis_time = 0
ANALYSIS_INTERVAL = 3.0  # Анализ каждые 3 секунды
last_ping_time = {}
PING_INTERVAL = 20.0  # Ping каждые 20 секунд

# Global storage
detection_history = []

async def broadcast_log(log_data: dict):
    """Рассылает логи всем WebSocket клиентам"""
    if log_clients:
        message = json.dumps(log_data)
        disconnected_clients = []
        
        for client in log_clients:
            try:
                await client.send_text(message)
            except:
                disconnected_clients.append(client)
        
        # Удаляем отключенных клиентов
        for client in disconnected_clients:
            log_clients.remove(client)

async def add_log(disasters_found: int, disaster_type: str = "", confidence: float = 0.0, total_objects: int = 0):
    """Добавляет лог в очередь и рассылает клиентам"""
    log_data = {
        "disasters_found": disasters_found,
        "disaster_type": disaster_type,
        "confidence": confidence,
        "total_objects": total_objects,
        "timestamp": time.time(),
        "clients_connected": len(clients)
    }
    
    # Добавляем в очередь
    await log_queue.put(log_data)
    
    # Рассылаем WebSocket клиентам
    await broadcast_log(log_data)
    
    logger.info(f"📝 Log added: {disasters_found} disasters, type: {disaster_type}")

async def broadcast_frame(frame_bytes: bytes):
    """Рассылает кадр всем подключенным фронтенд-клиентам"""
    for queue in clients:
        try:
            await queue.put(frame_bytes)
        except:
            pass

@app.websocket("/ws/logs")
async def websocket_logs(websocket: WebSocket):
    """WebSocket для логов ESP32 с ping/pong"""
    await websocket.accept()
    log_clients.append(websocket)
    client_id = id(websocket)
    last_ping_time[client_id] = time.time()
    
    logger.info(f"📡 ESP32 Logger connected: {len(log_clients)} clients")
    
    # Отправляем приветственное сообщение
    await websocket.send_text(json.dumps({
        "type": "connected",
        "message": "ESP32 Logger connected to SENTINEL.SAT",
        "timestamp": time.time()
    }))
    
    try:
        while True:
            current_time = time.time()
            
            # Ping/pong каждые 20 секунд
            if current_time - last_ping_time[client_id] > PING_INTERVAL:
                try:
                    await websocket.send_text(json.dumps({
                        "type": "ping",
                        "timestamp": current_time
                    }))
                    last_ping_time[client_id] = current_time
                except:
                    break
            
            # Ждем сообщения от клиента с таймаутом
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=1.0)
                
                # Обрабатываем pong
                if data == "pong":
                    last_ping_time[client_id] = time.time()
                    continue
                
                # Обрабатываем команды от ESP32
                if data == "status":
                    await websocket.send_text(json.dumps({
                        "type": "status",
                        "server": "ok",
                        "clients_connected": len(clients),
                        "total_detections": len(detection_history),
                        "latest_log": latest_log,
                        "timestamp": time.time()
                    }))
                elif data == "reset":
                    # Сброс счетчиков
                    latest_log = {}
                    await websocket.send_text(json.dumps({
                        "type": "reset",
                        "message": "Counters reset",
                        "timestamp": time.time()
                    }))
                    
            except asyncio.TimeoutError:
                # Таймаут - продолжаем цикл для ping
                continue
                
    except WebSocketDisconnect:
        logger.info("📡 ESP32 Logger disconnected")
    except Exception as e:
        logger.error(f"❌ WebSocket error: {e}")
    finally:
        if websocket in log_clients:
            log_clients.remove(websocket)
        if client_id in last_ping_time:
            del last_ping_time[client_id]

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
async def upload_frame(request: Request):
    """
    Принимает кадр от ESP32 (JPEG или RGB565), стримит на фронт и отправляет на HuggingFace
    """
    try:
        # Получаем заголовки от ESP32
        width = int(request.headers.get("X-Width", "320"))
        height = int(request.headers.get("X-Height", "240"))
        format_type = request.headers.get("X-Format", "JPEG").upper()
        
        # Читаем бинарные данные
        img_bytes = await request.body()
        logger.info(f"📸 Получен кадр от ESP32: {len(img_bytes)} байт, формат: {format_type}, размер: {width}x{height}")
        
        # Обрабатываем в зависимости от формата
        if format_type == "RGB565":
            # Конвертируем RGB565 в RGB
            frame_np = np.frombuffer(img_bytes, dtype=np.uint8)
            frame_rgb = convert_rgb565_to_rgb(frame_np, width, height)
            frame = Image.fromarray(frame_rgb, 'RGB')
        else:
            # JPEG - стандартная обработка
            frame = Image.open(io.BytesIO(img_bytes)).convert("RGB")
            frame_rgb = np.array(frame)
        
        # --- Отправляем на фронт ---
        try:
            # Сохраняем JPEG для стрима через PIL
            output = io.BytesIO()
            frame.save(output, format="JPEG", quality=85)
            jpeg_bytes = output.getvalue()
            await broadcast_frame(jpeg_bytes)
            logger.info("📡 Кадр отправлен на фронтенд")
        except Exception as e:
            logger.error(f"❌ Ошибка отправки на фронтенд: {e}")
        
        # --- Отправляем на HuggingFace с ограничением частоты ---
        current_time = time.time()
        should_analyze = (current_time - last_analysis_time) > ANALYSIS_INTERVAL
        
        if should_analyze:
            last_analysis_time = current_time
            logger.info("🤖 Starting HF analysis...")
            
            try:
                # Конвертируем в JPEG для отправки в HF
                hf_output = io.BytesIO()
                frame.save(hf_output, format="JPEG", quality=85)
                hf_bytes = hf_output.getvalue()
                
                resp = requests.post(
                    HF_API_URL,
                    files={"data": ("frame.jpg", hf_bytes, "image/jpeg")},
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
                                    'timestamp': current_time
                                })
                                break
                    
                    analysis_result = {
                        'predictions': predictions,
                        'disaster_detections': disaster_detections,
                        'total_objects': len(predictions),
                        'disasters_found': len(disaster_detections),
                        'timestamp': current_time
                    }
                    
                    detection_history.append(analysis_result)
                    hf_result = analysis_result
                    
                    # Обновляем latest_log для быстрого доступа
                    if disaster_detections:
                        main_disaster = disaster_detections[0]
                        latest_log = {
                            "disasters": len(disaster_detections),
                            "type": main_disaster['label'],
                            "confidence": main_disaster['score'],
                            "total_objects": len(predictions),
                            "timestamp": current_time,
                            "status": "ok"
                        }
                    else:
                        latest_log = {
                            "disasters": 0,
                            "type": "none",
                            "confidence": 0.0,
                            "total_objects": len(predictions),
                            "timestamp": current_time,
                            "status": "ok"
                        }
                    
                    # Отправляем лог в WebSocket
                    await add_log(
                        disasters_found=len(disaster_detections),
                        disaster_type=latest_log["type"],
                        confidence=latest_log["confidence"],
                        total_objects=len(predictions)
                    )
                    
                else:
                    logger.error(f"❌ HF API ошибка: {resp.status_code}")
                    hf_result = {"error": f"HF API error: {resp.status_code}"}
                    
            except Exception as e:
                logger.error(f"❌ Ошибка HF анализа: {e}")
                hf_result = {"error": str(e)}
        else:
            # Пропускаем анализ, но обновляем latest_log временем
            latest_log["timestamp"] = current_time
            hf_result = {"skipped": True, "reason": "rate_limit"}
        
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

@app.post("/api/hf-results")
async def receive_hf_results(data: dict):
    """
    Принимает результаты от HuggingFace Space
    """
    try:
        logger.info(f"🤖 Получены результаты от HF Space: {data}")
        
        # Обрабатываем результаты
        disaster_detections = data.get('disaster_detections', [])
        total_objects = data.get('total_objects', 0)
        disasters_found = data.get('disasters_found', 0)
        
        # Добавляем в историю
        analysis_result = {
            'predictions': data.get('predictions', []),
            'disaster_detections': disaster_detections,
            'total_objects': total_objects,
            'disasters_found': disasters_found,
            'timestamp': data.get('timestamp', asyncio.get_event_loop().time()),
            'source': 'hf_space'
        }
        
        detection_history.append(analysis_result)
        
        # Рассылаем результаты всем клиентам (опционально)
        if disasters_found > 0:
            logger.info(f"🚨 HF Space обнаружил {disasters_found} катастроф!")
        
        return {
            "status": "success",
            "message": "Results received and processed",
            "total_detections": len(detection_history)
        }
        
    except Exception as e:
        logger.error(f"❌ Ошибка обработки HF результатов: {e}")
        return JSONResponse({
            "status": "error", 
            "message": str(e)
        }, status_code=500)

@app.get("/api/logs")
def get_logs():
    """
    HTTP API для ESP32-Logger - возвращает последние логи
    """
    try:
        # Берем последние 10 записей из истории
        recent_logs = []
        for detection in detection_history[-10:]:
            if detection.get('disaster_detections'):
                main_disaster = detection['disaster_detections'][0]
                recent_logs.append({
                    "disasters": detection['disasters_found'],
                    "type": main_disaster['label'],
                    "confidence": main_disaster['score'],
                    "total_objects": detection['total_objects'],
                    "timestamp": detection['timestamp']
                })
            else:
                recent_logs.append({
                    "disasters": 0,
                    "type": "none",
                    "confidence": 0.0,
                    "total_objects": detection.get('total_objects', 0),
                    "timestamp": detection['timestamp']
                })
        
        return {
            "status": "ok",
            "logs": recent_logs,
            "total_detections": len(detection_history),
            "server_status": "running"
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/api/latest")
def get_latest_log():
    """
    Возвращает кешированный последний лог (мгновенно)
    """
    try:
        if not latest_log:
            return {
                "disasters": 0,
                "type": "none",
                "confidence": 0.0,
                "total_objects": 0,
                "timestamp": time.time(),
                "status": "no_data"
            }
        
        return latest_log
    except Exception as e:
        return {"status": "error", "message": str(e)}

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
