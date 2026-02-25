import os
import subprocess
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
import uvicorn

app = FastAPI()

FRONTEND_DIR = "frontend"
DIST_DIR = os.path.join(FRONTEND_DIR, "dist")
STATIC_DIR = "static"

# --- Build frontend if not exists ---
if not os.path.exists(DIST_DIR):
    print("Frontend not found, building...")
    subprocess.run(["npm", "install"], cwd=FRONTEND_DIR, check=True)
    subprocess.run(["npm", "run", "build"], cwd=FRONTEND_DIR, check=True)
else:
    print("Frontend already built.")

# --- Copy dist to static ---
if not os.path.exists(STATIC_DIR):
    os.makedirs(STATIC_DIR)
subprocess.run(["cp", "-r", os.path.join(DIST_DIR, "*"), STATIC_DIR], shell=True, check=True)

# --- Mount static files ---
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# --- API Endpoints ---
@app.get("/api/health")
def health():
    return JSONResponse({"status": "ok"})

@app.get("/api/stream")
def stream():
    # Тут позже подключишь ESP32 поток
    return JSONResponse({"stream": "not implemented yet"})

@app.get("/api/analyze")
def analyze():
    # Тут позже AI анализ
    return JSONResponse({"analyze": "not implemented yet"})

# --- Serve frontend index ---
@app.get("/")
def index():
    index_path = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return JSONResponse({"error": "index.html not found"}, status_code=404)

# --- Run server ---
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main_auto:app", host="0.0.0.0", port=port, reload=False)
