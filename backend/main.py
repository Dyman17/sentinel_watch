import subprocess
import shutil
from pathlib import Path
import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse
import uvicorn
import logging

# Настройка логов
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="SENTINEL.SAT", version="1.0.0")

# --- Пути ---
frontend_dir = Path(__file__).parent.parent / "frontend"
static_dir = Path(__file__).parent / "static"

# --- Билдим фронтенд при старте ---
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

# --- API эндпоинты ---
@app.get("/api/health")
def health():
    return {"status": "ok", "message": "SENTINEL.SAT работает!"}

@app.get("/api/data")
def data():
    return {"msg": "Бэкенд + фронт работает!", "status": "active"}

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
