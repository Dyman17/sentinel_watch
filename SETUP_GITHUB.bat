@echo off
echo 🚀 Подготовка GitHub репозитория SENTINEL.SAT...

REM Создаем папку для GitHub
mkdir sentinel-sat-github 2>nul
echo 📁 Создана папка sentinel-sat-github

REM Копируем все файлы проекта
echo 📦 Копирование файлов проекта...
xcopy /E /I backend sentinel-sat-github\backend
xcopy /E /I frontend sentinel-sat-github\frontend
xcopy /E /I esp32_example sentinel-sat-github\esp32_example
xcopy /E /I model sentinel-sat-github\model

REM Копируем основные файлы
copy README.md sentinel-sat-github\
copy GITHUB_README.md sentinel-sat-github\README.md
copy LICENSE sentinel-sat-github\ 2>nul
echo MIT License > sentinel-sat-github\LICENSE
copy CONTRIBUTING.md sentinel-sat-github\ 2>nul
echo # Contributing Guide > sentinel-sat-github\CONTRIBUTING.md

REM Копируем файлы для деплоя
copy Dockerfile sentinel-sat-github\
copy render-build.sh sentinel-sat-github\
copy render.yaml sentinel-sat-github\
copy .gitignore sentinel-sat-github\ 2>nul

REM Создаем .gitignore
echo # Dependencies > sentinel-sat-github\.gitignore
echo node_modules/ >> sentinel-sat-github\.gitignore
echo __pycache__/ >> sentinel-sat-github\.gitignore
echo *.pyc >> sentinel-sat-github\.gitignore
echo .env >> sentinel-sat-github\.gitignore
echo dist/ >> sentinel-sat-github\.gitignore
echo .DS_Store >> sentinel-sat-github\.gitignore

REM Создаем .env.example
echo HF_TOKEN=Bearer YOUR_HUGGINGFACE_TOKEN > sentinel-sat-github\.env.example
echo ESP_STREAM_URL=http://192.168.1.100:81/stream >> sentinel-sat-github\.env.example
echo SUPABASE_URL=your_supabase_url >> sentinel-sat-github\.env.example
echo SUPABASE_KEY=your_supabase_key >> sentinel-sat-github\.env.example

echo ✅ GitHub репозиторий подготовлен!
echo.
echo 📋 Следующие шаги:
echo 1. cd sentinel-sat-github
echo 2. git init
echo 3. git add .
echo 4. git commit -m "🚀 Initial commit: SENTINEL.SAT AI Disaster Monitoring"
echo 5. Создай репозиторий на GitHub: sentinel-sat
echo 6. git remote add origin https://github.com/yourusername/sentinel-sat.git
echo 7. git push -u origin main
echo 8. Зайди на render.com и создай Web Service
echo.
echo 🎯 Готово к деплою на Render!
pause
