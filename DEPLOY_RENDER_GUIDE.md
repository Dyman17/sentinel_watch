# 🚀 Деплой SENTINEL.SAT на Render

## 📋 План деплоя:

### 1. **Разделение на репозитории**
- `sentinel-sat-backend` - бэкенд + фронтенд
- `sentinel-sat-model` - YOLO модель (опционально)

### 2. **HuggingFace для YOLO**
- Используем готовую модель `yolos/yolos-tiny`
- API токен в environment variables

---

## 🗂️ **Шаг 1: Создание репозиториев**

### Backend Repository (`sentinel-sat-backend`)
```bash
# Создай новый репозиторий на GitHub
# Название: sentinel-sat-backend
# Описание: SENTINEL.SAT Backend + Frontend
```

### Файлы для бэкенд репозитория:
```
sentinel-sat-backend/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── Dockerfile
├── render-build.sh
├── render.yaml
└── README.md
```

---

## 🐳 **Шаг 2: Настройка Render**

### 1. **Создай Web Service**
1. Зайди на [render.com](https://render.com)
2. "New" → "Web Service"
3. Подключи GitHub репозиторий `sentinel-sat-backend`

### 2. **Настройки Web Service**
```yaml
Name: sentinel-sat-backend
Environment: Python
Region: Frankfurt (или ближайший)
Branch: main
```

### 3. **Build Settings**
```bash
Build Command: ./render-build.sh
Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
```

### 4. **Environment Variables**
```bash
HF_TOKEN=Bearer hf_your_huggingface_token_here
ESP_STREAM_URL=http://your-esp32-ip:81/stream
SUPABASE_URL=your_supabase_url  # опционально
SUPABASE_KEY=your_supabase_key  # опционально
```

---

## 🤖 **Шаг 3: HuggingFace YOLO модель**

### Используем готовую модель:
- **Модель**: `yolos/yolos-tiny`
- **API**: HuggingFace Inference API
- **Токен**: получи на [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)

### Преимущества:
- ✅ **Не нужно хостить модель**
- ✅ **Автоматическое масштабирование**
- ✅ **Высокая доступность**
- ✅ **Бесплатно для тестов**

---

## 📦 **Шаг 4: Подготовка файлов**

### 1. **Скопируй файлы в новую папку**
```bash
mkdir sentinel-sat-backend
cp -r backend/ sentinel-sat-backend/
cp -r frontend/ sentinel-sat-backend/
cp Dockerfile render-build.sh render.yaml sentinel-sat-backend/
```

### 2. **Обнови render-build.sh**
```bash
#!/bin/bash
echo "🚀 Building SENTINEL.SAT..."

# Install backend dependencies
pip install -r requirements.txt

# Build frontend
cd frontend
npm install
npm run build

# Move frontend to backend static
mkdir -p ../static
cp -r dist/* ../static/
cd ..

echo "✅ Build complete!"
```

### 3. **Создай .env.example**
```bash
HF_TOKEN=Bearer YOUR_HUGGINGFACE_TOKEN
ESP_STREAM_URL=http://192.168.1.100:81/stream
SUPABASE_URL=YOUR_SUPABASE_URL
SUPABASE_KEY=YOUR_SUPABASE_KEY
```

---

## 🚀 **Шаг 5: Деплой**

### 1. **Запушь в GitHub**
```bash
cd sentinel-sat-backend
git init
git add .
git commit -m "Initial SENTINEL.SAT deployment"
git branch -M main
git remote add origin https://github.com/yourusername/sentinel-sat-backend.git
git push -u origin main
```

### 2. **Разверни на Render**
1. Render автоматически обнаружит изменения
2. Начнет сборку (build)
3. Через 2-3 минуты приложение будет готово

---

## 🔧 **Шаг 6: Проверка деплоя**

### URL приложения:
- **Основной**: `https://sentinel-sat-backend.onrender.com`
- **API**: `https://sentinel-sat-backend.onrender.com/api/health`
- **Видео**: `https://sentinel-sat-backend.onrender.com/stream`

### Тестирование:
```bash
# Проверь API
curl https://sentinel-sat-backend.onrender.com/api/health

# Проверь фронтенд
# Открой в браузере основной URL
```

---

## 💰 **Стоимость**

### Render (Free Tier):
- ✅ **750 часов/месяц** - бесплатно
- ✅ **512MB RAM** - достаточно для нашего приложения
- ✅ **Автоматический sleep** после 15 минут неактивности

### HuggingFace:
- ✅ **Бесплатный tier** - до 30,000 запросов/месяц
- ✅ **YOLO tiny** - быстрая и легкая модель

---

## 🎯 **Итог**

После деплоя у тебя будет:
- 🌐 **Рабочее приложение** на Render
- 🤖 **YOLO детекция** через HuggingFace
- 📹 **Видеопоток** с ESP32
- 🎨 **Красивый фронтенд** с анимациями
- 📊 **Real-time мониторинг** катастроф

**Полностью бесплатно для тестов и небольшого использования!** 🎉
