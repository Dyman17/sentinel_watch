import os
import io
import uvicorn
import asyncio
import numpy as np
import httpx
import random
from pathlib import Path
from typing import List
from fastapi import FastAPI, File, UploadFile, WebSocket, WebSocketDisconnect, Request
from fastapi.responses import StreamingResponse, JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import logging
import json
import time

# --- Настройка логов ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def convert_rgb565_to_rgb(rgb565_data, width, height):
    rgb565_pixels = rgb565_data.view(dtype=np.uint16).reshape((height, width))
    r5 = (rgb565_pixels >> 11) & 0x1F
    g6 = (rgb565_pixels >> 5) & 0x3F
    b5 = rgb565_pixels & 0x1F
    r8 = (r5 * 255 + 15) // 31
    g8 = (g6 * 255 + 31) // 63
    b8 = (b5 * 255 + 15) // 31
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
    "https://Dyman17-sentinel-watch.hf.space/predict"
)
HF_TOKEN = os.getenv("HF_TOKEN", "")

# --- Demo Data ---
DEMO_STATIONS = [
    {"id": 1, "name": "Северное Бутово", "lat": 55.3485, "lon": 37.7449},
    {"id": 2, "name": "Центр (Кремль)", "lat": 55.7525, "lon": 37.6231},
    {"id": 3, "name": "ЮАО (Царицыно)", "lat": 55.6204, "lon": 37.7383}
]

latest_detection = {
    "station_id": 1,
    "disaster_type": "No detection",
    "confidence": 0,
    "timestamp": time.time()
}

# Фейк YOLO детекции для демо
FAKE_YOLO_RESPONSES = [
    {
        "predictions": [
            {"label": "fire", "score": 0.92, "box": {"xmin": 100, "ymin": 50, "xmax": 300, "ymax": 250}},
            {"label": "smoke", "score": 0.85, "box": {"xmin": 80, "ymin": 40, "xmax": 320, "ymax": 200}}
        ]
    },
    {
        "predictions": [
            {"label": "flood", "score": 0.88, "box": {"xmin": 50, "ymin": 100, "xmax": 400, "ymax": 350}},
            {"label": "water", "score": 0.91, "box": {"xmin": 60, "ymin": 110, "xmax": 390, "ymax": 340}}
        ]
    },
    {
        "predictions": [
            {"label": "smoke", "score": 0.78, "box": {"xmin": 150, "ymin": 50, "xmax": 350, "ymax": 200}}
        ]
    },
    {
        "predictions": []  # No detection
    },
    {
        "predictions": []  # No detection
    }
]

# --- Пути ---
STATIC_DIR = Path(__file__).parent / "static"

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

# --- Глобальные переменные ---
latest_log = {}
last_analysis_time = 0
ANALYSIS_INTERVAL = 10.0  # Анализируем каждые 10 секунд
last_ping_time = {}
PING_INTERVAL = 20.0
detection_history = []
MAX_HISTORY = 100

# --- ESP32 логи ---
esp32_logs = []
MAX_ESP32_LOGS = 200

# --- Последний кадр для анализа ---
latest_frame = None
latest_frame_lock = asyncio.Lock()

# --- Async HTTP клиент (не блокирует event loop) ---
http_client: httpx.AsyncClient = None

@app.on_event("startup")
async def startup():
    global http_client
    http_client = httpx.AsyncClient(timeout=10.0)
    # Создаём static директорию если не существует
    STATIC_DIR.mkdir(exist_ok=True)
    logger.info(f"🚀 SENTINEL.SAT server started")
    logger.info(f"📊 HF API URL: {HF_API_URL}")
    logger.info(f"📁 Static dir: {STATIC_DIR}")
    logger.info(f"⏱️ Analysis interval: {ANALYSIS_INTERVAL} seconds")

    # === ЗАПУСКАЕМ ПЕРИОДИЧЕСКИЙ АНАЛИЗ ===
    asyncio.create_task(periodic_frame_analysis())
    logger.info(f"✅ Periodic frame analysis started (every {ANALYSIS_INTERVAL}s)")

@app.on_event("shutdown")
async def shutdown():
    global http_client
    if http_client:
        await http_client.aclose()

async def broadcast_log(log_data: dict):
    if log_clients:
        message = json.dumps(log_data)
        disconnected = []
        for client in log_clients:
            try:
                await client.send_text(message)
            except:
                disconnected.append(client)
        for client in disconnected:
            log_clients.remove(client)

async def add_log(disasters_found: int, disaster_type: str = "", confidence: float = 0.0, total_objects: int = 0):
    log_data = {
        "disasters_found": disasters_found,
        "disaster_type": disaster_type,
        "confidence": confidence,
        "total_objects": total_objects,
        "timestamp": time.time(),
        "clients_connected": len(clients)
    }
    await log_queue.put(log_data)
    await broadcast_log(log_data)
    logger.info(f"Log: {disasters_found} disasters, type: {disaster_type}")

async def broadcast_frame(frame_bytes: bytes):
    for queue in clients:
        try:
            await queue.put(frame_bytes)
        except:
            pass

async def add_esp32_log(message: str, level: str = "INFO", device_id: str = "ESP32-1"):
    """Add a log from ESP32 device"""
    global esp32_logs
    log_entry = {
        "device_id": device_id,
        "level": level,
        "message": message,
        "timestamp": time.time()
    }
    esp32_logs.append(log_entry)
    if len(esp32_logs) > MAX_ESP32_LOGS:
        esp32_logs.pop(0)
    logger.info(f"[{device_id}] {level}: {message}")

@app.websocket("/ws/logs")
async def websocket_logs(websocket: WebSocket):
    await websocket.accept()
    log_clients.append(websocket)
    client_id = id(websocket)
    last_ping_time[client_id] = time.time()

    logger.info(f"ESP32 Logger connected: {len(log_clients)} clients")

    await websocket.send_text(json.dumps({
        "type": "connected",
        "message": "ESP32 Logger connected to SENTINEL.SAT",
        "timestamp": time.time()
    }))

    try:
        while True:
            current_time = time.time()

            if current_time - last_ping_time[client_id] > PING_INTERVAL:
                try:
                    await websocket.send_text(json.dumps({
                        "type": "ping",
                        "timestamp": current_time
                    }))
                    last_ping_time[client_id] = current_time
                except:
                    break

            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=1.0)

                if data == "pong":
                    last_ping_time[client_id] = time.time()
                    continue

                if data == "status":
                    await websocket.send_text(json.dumps({
                        "type": "status",
                        "server": "ok",
                        "clients_connected": len(clients),
                        "total_detections": len(detection_history),
                        "latest_log": latest_log,
                        "timestamp": time.time()
                    }))

            except asyncio.TimeoutError:
                continue

    except WebSocketDisconnect:
        logger.info("ESP32 Logger disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        if websocket in log_clients:
            log_clients.remove(websocket)
        if client_id in last_ping_time:
            del last_ping_time[client_id]

@app.get("/api/stream")
async def stream():
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

async def periodic_frame_analysis():
    """Анализируем новейший кадр каждые 10 секунд"""
    global latest_frame

    while True:
        try:
            await asyncio.sleep(ANALYSIS_INTERVAL)

            async with latest_frame_lock:
                if latest_frame is None:
                    logger.debug("No frame to analyze yet")
                    continue
                frame = latest_frame

            current_time = time.time()
            logger.info(f"📊 Analyzing latest frame from queue (HF API)...")

            if HF_TOKEN and http_client:
                try:
                    hf_output = io.BytesIO()
                    frame.save(hf_output, format="JPEG", quality=85)
                    hf_bytes = hf_output.getvalue()

                    resp = await http_client.post(
                        HF_API_URL,
                        content=hf_bytes,
                        headers={
                            "Authorization": f"Bearer {HF_TOKEN}",
                            "Content-Type": "image/jpeg"
                        },
                        timeout=30.0
                    )

                    if resp.status_code == 200:
                        hf_result = resp.json()
                        logger.info(f"✅ HF analysis OK: {hf_result}")

                        predictions = hf_result.get('predictions', [])
                        disaster_detections = []

                        for pred in predictions:
                            label = pred.get('label', '').lower()
                            score = pred.get('score', 0)
                            for dtype, keywords in YOLO_DISASTER_CLASSES.items():
                                if any(kw in label for kw in keywords):
                                    disaster_detections.append({
                                        'label': dtype,
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
                        if len(detection_history) > MAX_HISTORY:
                            detection_history.pop(0)

                        if disaster_detections:
                            main_disaster = disaster_detections[0]
                            await add_log(
                                disasters_found=len(disaster_detections),
                                disaster_type=main_disaster['label'],
                                confidence=main_disaster['score'],
                                total_objects=len(predictions)
                            )
                    else:
                        logger.error(f"❌ HF API error: {resp.status_code}")

                except Exception as e:
                    logger.error(f"❌ HF analysis error: {e}")
            else:
                logger.warning("⚠️ HF_TOKEN not configured")

        except Exception as e:
            logger.error(f"❌ Periodic analysis error: {e}")
            await asyncio.sleep(1)  # Не спамим логи при ошибке


@app.post("/api/upload-frame")
async def upload_frame(request: Request):
    """
    📡 2 FPS видеопоток: СРАЗУ на фронт
    📊 10 сек анализ: берём новейший кадр для HF (каждые 10 секунд)
    """
    global latest_frame

    try:
        width = int(request.headers.get("X-Width", "320"))
        height = int(request.headers.get("X-Height", "240"))
        format_type = request.headers.get("X-Format", "JPEG").upper()

        img_bytes = await request.body()

        if format_type == "RGB565":
            frame_np = np.frombuffer(img_bytes, dtype=np.uint8)
            frame_rgb = convert_rgb565_to_rgb(frame_np, width, height)
            frame = Image.fromarray(frame_rgb, 'RGB')
        else:
            frame = Image.open(io.BytesIO(img_bytes)).convert("RGB")

        # === СОХРАНЯЕМ НОВЕЙШИЙ КАДР ДЛЯ АНАЛИЗА ===
        async with latest_frame_lock:
            latest_frame = frame

        # === СРАЗУ ОТПРАВЛЯЕМ НА ФРОНТ (2 FPS видео) ===
        try:
            output = io.BytesIO()
            frame.save(output, format="JPEG", quality=85)
            jpeg_bytes = output.getvalue()
            await broadcast_frame(jpeg_bytes)
        except Exception as e:
            logger.error(f"Broadcast error: {e}")

        # === СРАЗУ ОТВЕТ (без ожидания HF) ===
        return JSONResponse({
            "status": "ok",
            "message": "Frame received",
            "frame_size": len(img_bytes),
            "clients_connected": len(clients)
        })

    except Exception as e:
        logger.error(f"Frame processing error: {e}")
        return JSONResponse({
            "status": "error",
            "message": str(e)
        }, status_code=500)

@app.post("/api/hf-results")
async def receive_hf_results(data: dict):
    try:
        logger.info(f"HF Space results received: {data}")

        disaster_detections = data.get('disaster_detections', [])
        total_objects = data.get('total_objects', 0)
        disasters_found = data.get('disasters_found', 0)

        analysis_result = {
            'predictions': data.get('predictions', []),
            'disaster_detections': disaster_detections,
            'total_objects': total_objects,
            'disasters_found': disasters_found,
            'timestamp': data.get('timestamp', time.time()),
            'source': 'hf_space'
        }

        detection_history.append(analysis_result)
        if len(detection_history) > MAX_HISTORY:
            detection_history.pop(0)

        return {
            "status": "success",
            "message": "Results received",
            "total_detections": len(detection_history)
        }

    except Exception as e:
        logger.error(f"HF results error: {e}")
        return JSONResponse({"status": "error", "message": str(e)}, status_code=500)

@app.get("/api/logs")
def get_logs():
    try:
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

@app.post("/api/upload")
async def upload_image(file: UploadFile = File(...)):
    try:
        img_bytes = await file.read()

        hf_result = None
        if HF_TOKEN and http_client:
            try:
                resp = await http_client.post(
                    HF_API_URL,
                    content=img_bytes,
                    headers={
                        "Authorization": f"Bearer {HF_TOKEN}",
                        "Content-Type": "image/jpeg"
                    }
                )
                if resp.status_code == 200:
                    hf_result = resp.json()
                else:
                    hf_result = {"error": f"HF API error: {resp.status_code}"}
            except Exception as e:
                hf_result = {"error": str(e)}
        else:
            hf_result = {"error": "HF token not configured"}

        return JSONResponse({
            "status": "success",
            "filename": file.filename,
            "hf_result": hf_result
        })
    except Exception as e:
        return JSONResponse({"status": "error", "message": str(e)}, status_code=500)

@app.get("/api/health")
async def health():
    hf_status = "not_configured"
    if HF_TOKEN and http_client:
        try:
            resp = await http_client.get(HF_API_URL.replace("/predict", "/health"))
            hf_status = resp.status_code
        except:
            hf_status = "unreachable"

    return {
        "server": "ok",
        "hf": hf_status,
        "hf_api_url": HF_API_URL,
        "clients_connected": len(clients),
        "detections_count": len(detection_history)
    }

@app.get("/api/detections")
def get_detections():
    return {"history": detection_history[-20:]}

@app.get("/api/status")
def get_status():
    return {
        "esp32_connected": len(clients) > 0,
        "clients_count": len(clients),
        "hf_connected": bool(HF_TOKEN),
        "total_detections": len(detection_history),
        "last_detection": detection_history[-1] if detection_history else None
    }

# --- Статика и фронтенд ---

@app.get("/api/demo/stations")
async def get_demo_stations():
    """
    Вернуть список демо станций с фейк-данными
    """
    import random
    stations = []
    for station in DEMO_STATIONS:
        # Фейк детекции
        disaster_types = ["fire", "flood", "smoke", "none", "none"]
        disaster = random.choice(disaster_types)
        confidence = random.uniform(0.5, 0.95) if disaster != "none" else 0
        color = "#FF0000" if confidence > 0.65 else "#FFC107" if confidence > 0.3 else "#4CAF50"

        stations.append({
            **station,
            "current_detection": {
                "disaster_type": disaster,
                "confidence": round(confidence, 2),
                "color": color
            },
            "last_update": time.time()
        })
    return {"stations": stations, "count": len(stations)}


@app.get("/api/demo/latest")
async def get_demo_latest():
    """
    Вернуть фейк последнее обнаружение
    """
    disasters = ["fire", "flood", "smoke", "none"]
    disaster = random.choice(disasters)
    confidence = random.uniform(0.6, 0.98) if disaster != "none" else 0

    return {
        "type": disaster,
        "confidence": round(confidence, 2),
        "timestamp": time.time(),
        "station_id": random.randint(1, 3),
        "station_name": random.choice([s["name"] for s in DEMO_STATIONS])
    }


@app.post("/api/logs/esp32")
async def receive_esp32_log(data: dict):
    """
    Receive logs from ESP32 device
    Expected: {"message": "...", "level": "INFO", "device_id": "ESP32-1"}
    """
    try:
        message = data.get("message", "")
        level = data.get("level", "INFO")
        device_id = data.get("device_id", "ESP32-1")

        await add_esp32_log(message, level, device_id)

        return {
            "status": "success",
            "message": "Log received",
            "total_logs": len(esp32_logs)
        }
    except Exception as e:
        logger.error(f"ESP32 log error: {e}")
        return {"status": "error", "message": str(e)}, 500


@app.get("/api/logs/esp32")
async def get_esp32_logs(limit: int = 50):
    """
    Get recent ESP32 logs
    """
    try:
        recent_logs = esp32_logs[-limit:] if limit else esp32_logs
        return {
            "status": "ok",
            "logs": recent_logs,
            "total_logs": len(esp32_logs),
            "timestamp": time.time()
        }
    except Exception as e:
        logger.error(f"Get ESP32 logs error: {e}")
        return {"status": "error", "message": str(e)}, 500


# Store client-side detections
client_detections = []


@app.post("/api/client-detections")
async def receive_client_detections(data: dict):
    """
    Receive real-time object detections from frontend TensorFlow.js
    Format: {
        "detections": [
            {"class": "person", "score": 0.95, "bbox": [x, y, w, h]},
            ...
        ],
        "timestamp": 1234567890
    }
    """
    try:
        timestamp = data.get("timestamp", int(time.time() * 1000))
        detections = data.get("detections", [])

        # Store latest client detections
        client_detections.append({
            "detections": detections,
            "timestamp": timestamp,
            "source": "client"
        })

        # Keep only last 100 entries
        if len(client_detections) > 100:
            client_detections.pop(0)

        # Check for high-priority objects (person) - 65% confidence
        high_priority = [d for d in detections if d["class"] in ["person"] and d["score"] > 0.65]

        if high_priority:
            # Send alert to ESP32 via WebSocket
            alert_message = {
                "type": "client_detection",
                "objects": [d["class"] for d in high_priority],
                "count": len(high_priority),
                "timestamp": timestamp
            }
            await broadcast_log(alert_message)

        logger.info(f"Received client detections: {len(detections)} objects, {len(high_priority)} high-priority")
        return {
            "status": "success",
            "received": len(detections),
            "alerts_sent": len(high_priority)
        }
    except Exception as e:
        logger.error(f"Error processing client detections: {str(e)}")
        return {"status": "error", "message": str(e)}


@app.get("/api/client-detections")
async def get_client_detections(limit: int = 50):
    """Get recent client-side detections"""
    return {
        "status": "success",
        "detections": client_detections[-limit:] if client_detections else [],
        "total": len(client_detections)
    }


@app.get("/api/esp32/status")
async def esp32_status():
    """
    ESP32 polling endpoint - returns latest detections and alerts
    ESP32 should call this every 5-10 seconds

    Response format:
    {
        "status": "success",
        "server_time": 1234567890,
        "latest_detection": {
            "type": "person",
            "confidence": 0.87,
            "source": "client|server",
            "timestamp": 1234567890
        },
        "alerts": [
            {"type": "person", "count": 2, "confidence": 0.75}
        ],
        "disaster_count": 3,
        "total_detections": 156
    }
    """
    try:
        # Get latest client detection (65%+ confidence)
        latest_client = None
        if client_detections:
            for detection in reversed(client_detections):
                high_conf = [d for d in detection["detections"] if d["score"] > 0.65]
                if high_conf:
                    latest_client = {
                        "type": high_conf[0]["class"],
                        "confidence": round(high_conf[0]["score"], 2),
                        "source": "client",
                        "timestamp": detection["timestamp"]
                    }
                    break

        # Get latest server detection from detection_history
        latest_server = None
        if detection_history:
            latest = detection_history[-1]
            if latest.get("disasters_found", 0) > 0:
                latest_server = {
                    "type": latest.get("disaster_type", "unknown"),
                    "confidence": latest.get("max_confidence", 0),
                    "source": "server",
                    "timestamp": latest.get("timestamp", int(time.time() * 1000))
                }

        # Determine which detection to report (prefer high-confidence)
        latest_detection = latest_client or latest_server

        # Get high-priority alerts (65%+ confidence)
        alerts = []
        if client_detections:
            latest_cd = client_detections[-1]
            high_priority = [d for d in latest_cd["detections"] if d["score"] > 0.65]
            for d in high_priority:
                alerts.append({
                    "type": d["class"],
                    "confidence": round(d["score"], 2),
                    "count": 1
                })

        return {
            "status": "success",
            "server_time": int(time.time()),
            "latest_detection": latest_detection,
            "alerts": alerts,
            "disaster_count": len([d for d in detection_history if d.get("disasters_found", 0) > 0]),
            "total_detections": len(detection_history),
            "client_detection_count": len(client_detections)
        }
    except Exception as e:
        logger.error(f"ESP32 status error: {str(e)}")
        return {
            "status": "error",
            "message": str(e),
            "server_time": int(time.time())
        }


@app.get("/api/esp32/log")
async def esp32_log():
    """
    Simple log endpoint for ESP32
    Returns latest detection/alert as simple JSON string

    Response: {"log":"AI: person detected (87%)"}

    ESP32 should ping this every 2 seconds
    """
    try:
        log_message = ""

        # Check for latest high-priority client detection (65%+)
        if client_detections:
            for detection in reversed(client_detections):
                high_conf = [d for d in detection["detections"] if d["score"] > 0.65]
                if high_conf:
                    d = high_conf[0]
                    log_message = f"AI: {d['class'].upper()} detected ({int(d['score'] * 100)}%)"
                    break

        # If no client detection, check for latest server disaster
        if not log_message and detection_history:
            latest = detection_history[-1]
            if latest.get("disasters_found", 0) > 0:
                disaster_type = latest.get("disaster_type", "UNKNOWN")
                confidence = latest.get("max_confidence", 0)
                log_message = f"DISASTER: {disaster_type.upper()} ({int(confidence * 100)}%)"

        # If still no detection, return OK status
        if not log_message:
            log_message = "AI: Monitoring... No alerts"

        return {
            "log": log_message,
            "timestamp": int(time.time() * 1000)
        }

    except Exception as e:
        logger.error(f"ESP32 log error: {str(e)}")
        return {
            "log": f"ERROR: {str(e)}",
            "timestamp": int(time.time() * 1000)
        }


@app.get("/{full_path:path}", include_in_schema=False)
def serve_spa(full_path: str):
    # Только блокируем явно неправильные API пути
    # Специфичные API маршруты обработаны выше и не дойдут сюда
    if full_path.startswith("api/") or full_path.startswith("ws/"):
        # Это значит, что конкретный endpoint не найден
        return JSONResponse({"error": "Not found"}, status_code=404)

    # Пытаемся найти файл в static директории
    file_path = STATIC_DIR / full_path
    if file_path.exists() and file_path.is_file():
        # Определяем правильный MIME type для разных файлов
        suffix = file_path.suffix.lower()
        media_type_map = {
            '.js': 'application/javascript',
            '.mjs': 'application/javascript',
            '.css': 'text/css',
            '.html': 'text/html',
            '.json': 'application/json',
            '.svg': 'image/svg+xml',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.ico': 'image/x-icon',
            '.woff': 'font/woff',
            '.woff2': 'font/woff2',
            '.ttf': 'font/ttf',
            '.eot': 'application/vnd.ms-fontobject',
        }
        media_type = media_type_map.get(suffix, 'application/octet-stream')
        return FileResponse(str(file_path), media_type=media_type)

    # Если файл не найден и это не API, служим index.html для SPA routing
    index_path = STATIC_DIR / "index.html"
    if index_path.exists():
        return FileResponse(str(index_path), media_type='text/html')

    return JSONResponse({"error": "Not found"}, status_code=404)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    logger.info(f"Starting server on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port)
