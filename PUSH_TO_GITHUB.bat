@echo off
echo 🚀 Подготовка файлов для GitHub репозитория...

REM Переходим в папку проекта
cd /d "c:/Users/Админ/Desktop/rast-red"

REM Копируем README для GitHub
copy GITHUB_README.md README.md /Y

REM Создаем .gitignore если нет
if not exist .gitignore (
    echo # Dependencies > .gitignore
    echo node_modules/ >> .gitignore
    echo __pycache__/ >> .gitignore
    echo *.pyc >> .gitignore
    echo .env >> .gitignore
    echo dist/ >> .gitignore
    echo .DS_Store >> .gitignore
    echo sentinel-sat-github/ >> .gitignore
)

REM Создаем .env.example
echo HF_TOKEN=Bearer YOUR_HUGGINGFACE_TOKEN > .env.example
echo ESP_STREAM_URL=http://192.168.1.100:81/stream >> .env.example
echo SUPABASE_URL=your_supabase_url >> .env.example
echo SUPABASE_KEY=your_supabase_key >> .env.example

REM Создаем LICENSE
echo MIT License >> LICENSE
echo. >> LICENSE
echo Copyright (c) 2024 SENTINEL.SAT >> LICENSE
echo. >> LICENSE
echo Permission is hereby granted, free of charge, to any person obtaining a copy >> LICENSE
echo of this software and associated documentation files (the "Software"), to deal >> LICENSE
echo in the Software without restriction, including without limitation the rights >> LICENSE
echo to use, copy, modify, merge, publish, distribute, sublicense, and/or sell >> LICENSE
echo copies of the Software, and to permit persons to whom the Software is >> LICENSE
echo furnished to do so, subject to the following conditions: >> LICENSE
echo. >> LICENSE
echo The above copyright notice and this permission notice shall be included in all >> LICENSE
echo copies or substantial portions of the Software. >> LICENSE
echo. >> LICENSE
echo THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR >> LICENSE
echo IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, >> LICENSE
echo FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE >> LICENSE
echo AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER >> LICENSE
echo LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, >> LICENSE
echo OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE >> LICENSE
echo SOFTWARE. >> LICENSE

REM Создаем CONTRIBUTING.md
echo # Contributing to SENTINEL.SAT >> CONTRIBUTING.md
echo. >> CONTRIBUTING.md
echo We welcome contributions! Please read these guidelines first. >> CONTRIBUTING.md
echo. >> CONTRIBUTING.md
echo ## How to Contribute >> CONTRIBUTING.md
echo 1. Fork the repository >> CONTRIBUTING.md
echo 2. Create a feature branch >> CONTRIBUTING.md
echo 3. Make your changes >> CONTRIBUTING.md
echo 4. Test your changes >> CONTRIBUTING.md
echo 5. Submit a pull request >> CONTRIBUTING.md

echo ✅ Файлы подготовлены!
echo.
echo 📋 Следующие шаги:
echo 1. git add .
echo 2. git commit -m "🚀 Initial commit: SENTINEL.SAT AI Disaster Monitoring"
echo 3. git push origin main
echo 4. Зайди на render.com и создай Web Service
echo.
echo 🎯 Готово к деплою на Render!
pause
