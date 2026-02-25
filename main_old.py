import cv2
import requests
import numpy as np
from fastapi import FastAPI, Response, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from threading import Thread
from PIL import Image
import io
import time
import logging
from datetime import datetime
import os
from typing import Optional, Dict, Any, List
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Rast-Red Simple Backend", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===== CONFIG =====
ESP_STREAM_URL = os.getenv("ESP_STREAM_URL", "http://192.168.1.100:81/stream")
HF_API_URL = os.getenv("HF_API_URL", "https://api-inference.huggingface.co/models/yolos/yolos-tiny")
HF_TOKEN = os.getenv("HF_TOKEN", "Bearer YOUR_HF_TOKEN")
SUPABASE_URL = os.getenv("SUPABASE_URL", "YOUR_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "YOUR_SUPABASE_KEY")

NASA_IMAGE_URL = "https://eoimages.gsfc.nasa.gov/images/imagerecords/57000/57730/earth_lights_lrg.jpg"

# YOLO classes for disaster detection
YOLO_DISASTER_CLASSES = {
    "fire": ["fire", "flame", "smoke", "burning"],
    "flood": ["flood", "water", "river", "flooded"],
    "smoke": ["smoke", "cloud", "haze"],
    "person": ["person"],
    "car": ["car", "truck", "bus"],
    "dog": ["dog"]
}

HEADERS = {
    "Authorization": HF_TOKEN,
    "Content-Type": "application/octet-stream"
}

# Global state
current_source = "esp"  # "esp" or "nasa"
latest_frame = None
latest_result = None
latest_short_log = "NO DETECTION"
latest_full_log = None
analysis_lock = False

# In-memory logs storage (for prototype)
logs_history = []
MAX_LOGS = 100

# =============================
# 📡 Supabase Functions
# =============================
def save_log_to_supabase(short_log: str, full_log: Dict[str, Any]):
    """Save log to Supabase (simplified version)"""
    try:
        # For prototype, just store in memory
        log_entry = {
            "short_log": short_log,
            "full_log": full_log,
            "timestamp": datetime.utcnow().isoformat(),
            "source": current_source
        }
        
        logs_history.append(log_entry)
        
        # Keep only last MAX_LOGS entries
        if len(logs_history) > MAX_LOGS:
            logs_history.pop(0)
            
        logger.info(f"Log saved: {short_log}")
        
        # TODO: Real Supabase integration
        # headers = {
        #     "apikey": SUPABASE_KEY,
        #     "Authorization": f"Bearer {SUPABASE_KEY}",
        #     "Content-Type": "application/json"
        # }
        # response = requests.post(f"{SUPABASE_URL}/rest/v1/logs", 
        #                        json=log_entry, headers=headers)
        
    except Exception as e:
        logger.error(f"Error saving log: {e}")

# =============================
# � Log Formatting Functions
# =============================
def format_detection_log(model_output: Dict[str, Any]) -> tuple[str, Dict[str, Any]]:
    """Format model output into short and full logs"""
    global latest_short_log, latest_full_log
    
    if not model_output or "predictions" not in model_output:
        short_log = "NO DETECTION"
        full_log = {
            "event": "none",
            "source": current_source,
            "confidence": 0.0,
            "timestamp": datetime.utcnow().isoformat(),
            "detections": []
        }
        return short_log, full_log
    
    predictions = model_output["predictions"]
    if not predictions:
        short_log = "NO DETECTION"
        full_log = {
            "event": "none",
            "source": current_source,
            "confidence": 0.0,
            "timestamp": datetime.utcnow().isoformat(),
            "detections": []
        }
        return short_log, full_log
    
    # Get top detection by confidence
    top_detection = max(predictions, key=lambda x: x.get("score", 0))
    
    # Format short log for OLED display
    label = top_detection.get("label", "UNKNOWN").upper()
    confidence = int(top_detection.get("score", 0) * 100)
    short_log = f"{label} {confidence}%"
    
    # Format full log for website
    full_log = {
        "event": top_detection.get("label", "unknown"),
        "source": current_source,
        "confidence": top_detection.get("score", 0),
        "timestamp": datetime.utcnow().isoformat(),
        "detections": predictions[:5],  # Top 5 detections
        "region": get_region_from_bbox(top_detection.get("box", {})),
        "raw_model_output": model_output
    }
    
    return short_log, full_log

def get_region_from_bbox(box: Dict[str, Any]) -> str:
    """Determine region from bounding box"""
    if not box:
        return "unknown"
    
    # Simple region detection based on box position
    xmin = box.get("xmin", 0)
    ymin = box.get("ymin", 0)
    
    # This is a simplified region detection
    # In real implementation, you'd use actual coordinates
    if xmin < 200 and ymin < 200:
        return "north-west"
    elif xmin >= 200 and ymin < 200:
        return "north-east"
    elif xmin < 200 and ymin >= 200:
        return "south-west"
    else:
        return "south-east"

# =============================
# 📡 Image Capture Functions
# =============================
def capture_esp_frame() -> Optional[np.ndarray]:
    """Capture frame from ESP32 camera stream"""
    try:
        cap = cv2.VideoCapture(ESP_STREAM_URL)
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        
        ret, frame = cap.read()
        cap.release()
        
        if ret and frame is not None:
            return frame
        else:
            logger.warning("Failed to capture frame from ESP32")
            return None
            
    except Exception as e:
        logger.error(f"Error capturing ESP32 frame: {e}")
        return None

def get_nasa_image() -> Optional[np.ndarray]:
    """Fetch NASA satellite image"""
    try:
        response = requests.get(NASA_IMAGE_URL, timeout=10)
        response.raise_for_status()
        return np.array(Image.open(io.BytesIO(response.content)))
    except Exception as e:
        logger.error(f"Error fetching NASA image: {e}")
        return None

def get_current_frame() -> Optional[np.ndarray]:
    """Get current frame based on selected source"""
    if current_source == "esp":
        return capture_esp_frame()
    else:
        return get_nasa_image()

# =============================
# 🤖 AI Analysis Functions
# =============================
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

# =============================
# 🔄 Background Analysis Thread
# =============================
def analysis_worker():
    """Background thread for analysis every 5 seconds"""
    global latest_frame, latest_result, latest_short_log, latest_full_log, analysis_lock
    
    while True:
        try:
            if not analysis_lock:
                analysis_lock = True
                
                # Capture frame
                frame = get_current_frame()
                if frame is not None:
                    latest_frame = frame
                    
                    # Analyze frame
                    result = analyze_with_hf(frame)
                    
                    # Format logs
                    short_log, full_log = format_detection_log(result)
                    
                    # Update global state
                    latest_short_log = short_log
                    latest_full_log = full_log
                    latest_result = {
                        "source": current_source,
                        "analysis": result,
                        "timestamp": datetime.utcnow().isoformat(),
                        "short_log": short_log,
                        "full_log": full_log
                    }
                    
                    # Save to database
                    save_log_to_supabase(short_log, full_log)
                    
                    logger.info(f"Analysis completed: {short_log}")
                
                analysis_lock = False
                
        except Exception as e:
            logger.error(f"Error in analysis worker: {e}")
            analysis_lock = False
        
        time.sleep(5)  # Analyze every 5 seconds

# Start background analysis thread
analysis_thread = Thread(target=analysis_worker, daemon=True)
analysis_thread.start()

# =============================
# 📡 Video Stream Proxy
# =============================
async def video_stream_proxy():
    """Proxy video stream from ESP32"""
    try:
        response = requests.get(ESP_STREAM_URL, stream=True)
        response.raise_for_status()
        
        def generate():
            for chunk in response.iter_content(chunk_size=1024):
                if chunk:
                    yield chunk
        
        return StreamingResponse(generate(), media_type="multipart/x-mixed-replace; boundary=frame")
        
    except Exception as e:
        logger.error(f"Error in video proxy: {e}")
        return Response(status_code=503, content="Video stream unavailable")

# =============================
# Mount static files for frontend
try:
    app.mount("/static", StaticFiles(directory="static"), name="static")
except RuntimeError:
    # In production, static files will be in different location
    pass

# Serve frontend
@app.get("/")
async def serve_frontend():
    """Serve the frontend application"""
    try:
        # Try to serve from static directory first (production)
        if os.path.exists("static/index.html"):
            return FileResponse("static/index.html")
        # Fallback for development
        elif os.path.exists("../frontend/dist/index.html"):
            return FileResponse("../frontend/dist/index.html")
        else:
            return JSONResponse(content={"message": "Frontend not built"})
    except Exception as e:
        logger.error(f"Error serving frontend: {e}")
        return JSONResponse(content={"error": "Frontend not available"}, status_code=404)

# API Routes
@app.get("/api")
async def api_root():
    """Root endpoint"""
    return {
        "message": "Rast-Red Simple Backend",
        "version": "1.0.0",
        "source": current_source,
        "status": "running",
        "endpoints": {
            "stream": "/stream",
            "latest": "/latest",
            "logs": "/logs",
            "switch": "/switch/{source}",
            "health": "/health"
        }
    }

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "source": current_source,
        "latest_analysis": latest_result is not None,
        "esp_connected": True,  # TODO: Implement actual ESP connection check
        "hf_api_available": HF_TOKEN != "Bearer YOUR_HF_TOKEN",
        "latest_short_log": latest_short_log
    }

@app.get("/stream")
async def get_video_stream():
    """Proxy video stream from ESP32"""
    if current_source == "esp":
        return await video_stream_proxy()
    else:
        # Return NASA image as static stream for demo
        return Response(
            content=f'<img src="{NASA_IMAGE_URL}" style="width:100%; height:100%; object-fit:cover;">',
            media_type="text/html"
        )

@app.get("/api/latest")
async def get_latest():
    """Get latest analysis result"""
    if latest_result is None:
        return JSONResponse(content={
            "short_log": "NO DETECTION",
            "full_log": {
                "event": "none",
                "source": current_source,
                "confidence": 0.0,
                "timestamp": datetime.utcnow().isoformat(),
                "detections": [],
                "region": "unknown"
            },
            "source": current_source,
            "timestamp": datetime.utcnow().isoformat()
        })
    
    return JSONResponse(content=latest_result)

@app.get("/api/logs")
async def get_logs(limit: int = 50):
    """Get logs history"""
    return JSONResponse(content={
        "logs": logs_history[-limit:],
        "total": len(logs_history),
        "source": current_source
    })

@app.post("/api/switch/{source}")
async def switch_source(source: str):
    """Switch between ESP32 and NASA sources"""
    global current_source
    
    if source not in ["esp", "nasa"]:
        raise HTTPException(status_code=400, detail="Invalid source. Must be 'esp' or 'nasa'")
    
    old_source = current_source
    current_source = source
    
    logger.info(f"Switched source from {old_source} to {source}")
    
    return {
        "status": "switched",
        "source": source,
        "previous_source": old_source,
        "timestamp": datetime.utcnow().isoformat(),
        "message": f"Switched to {source} source"
    }

@app.get("/short-log")
async def get_short_log():
    """Get short log for OLED display"""
    return JSONResponse(content={
        "log": latest_short_log,
        "timestamp": datetime.utcnow().isoformat()
    })

if __name__ == "__main__":
    import uvicorn
    
    logger.info("Starting Rast-Red Simple Backend...")
    logger.info(f"ESP Stream URL: {ESP_STREAM_URL}")
    logger.info(f"HF API URL: {HF_API_URL}")
    logger.info(f"HF Token configured: {HF_TOKEN != 'Bearer YOUR_HF_TOKEN'}")
    logger.info(f"Current source: {current_source}")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
