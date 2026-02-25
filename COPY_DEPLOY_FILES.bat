@echo off
echo 🚀 Подготовка файлов для деплоя на Render...

REM Создаем папку для деплоя
mkdir sentinel-sat-backend 2>nul
echo 📁 Создана папка sentinel-sat-backend

REM Копируем бэкенд
echo 📦 Копирование бэкенда...
xcopy /E /I backend sentinel-sat-backend\backend

REM Копируем фронтенд
echo 📦 Копирование фронтенда...
xcopy /E /I frontend sentinel-sat-backend\frontend

REM Копируем файлы для деплоя
echo 📦 Копирование файлов деплоя...
copy Dockerfile sentinel-sat-backend\
copy render-build.sh sentinel-sat-backend\
copy render.yaml sentinel-sat-backend\
copy DEPLOY_RENDER_GUIDE.md sentinel-sat-backend\

REM Создаем .env.example
echo 📝 Создание .env.example...
echo HF_TOKEN=Bearer YOUR_HUGGINGFACE_TOKEN > sentinel-sat-backend\.env.example
echo ESP_STREAM_URL=http://192.168.1.100:81/stream >> sentinel-sat-backend\.env.example
echo SUPABASE_URL=YOUR_SUPABASE_URL >> sentinel-sat-backend\.env.example
echo SUPABASE_KEY=YOUR_SUPABASE_KEY >> sentinel-sat-backend\.env.example

echo ✅ Файлы скопированы в папку sentinel-sat-backend
echo.
echo 📋 Следующие шаги:
echo 1. cd sentinel-sat-backend
echo 2. git init
echo 3. git add .
echo 4. git commit -m "Initial SENTINEL.SAT deployment"
echo 5. Создай репозиторий на GitHub: sentinel-sat-backend
echo 6. git remote add origin https://github.com/yourusername/sentinel-sat-backend.git
echo 7. git push -u origin main
echo 8. Зайди на render.com и создай Web Service
echo.
pause
