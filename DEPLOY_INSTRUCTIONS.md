# 🚀 Деплой SENTINEL.SAT на GitHub и Render

## 📋 Пошаговая инструкция

### Шаг 1: Подготовка репозитория

#### 1.1 Запусти подготовительный скрипт
```bash
SETUP_GITHUB.bat
```

#### 1.2 Проверь структуру папки
```
sentinel-sat-github/
├── backend/           # FastAPI + YOLO
├── frontend/          # React + TypeScript
├── esp32_example/     # Пример кода для ESP32
├── model/             # Документация модели
├── Dockerfile         # Docker конфигурация
├── render-build.sh    # Скрипт сборки
├── render.yaml        # Конфигурация Render
├── README.md          # GitHub README
├── .env.example       # Пример переменных
└── .gitignore         # Git ignore
```

### Шаг 2: Создание GitHub репозитория

#### 2.1 Инициализация Git
```bash
cd sentinel-sat-github
git init
git add .
git commit -m "🚀 Initial commit: SENTINEL.SAT AI Disaster Monitoring"
```

#### 2.2 Создание репозитория на GitHub
1. Зайди на [github.com](https://github.com)
2. Нажми "New repository"
3. **Repository name**: `sentinel-sat`
4. **Description**: `AI-Powered Disaster Monitoring System`
5. **Visibility**: Public
6. ❌ Не добавляй README, .gitignore, license (у нас уже есть)

#### 2.3 Push на GitHub
```bash
git remote add origin https://github.com/yourusername/sentinel-sat.git
git branch -M main
git push -u origin main
```

### Шаг 3: Настройка HuggingFace

#### 3.1 Получение API токена
1. Зайди на [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
2. Нажми "New token"
3. **Name**: `sentinel-sat-token`
4. **Type**: `read`
5. Скопируй токен: `hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Шаг 4: Деплой на Render

#### 4.1 Создание Web Service
1. Зайди на [render.com](https://render.com)
2. Нажми "New" → "Web Service"
3. **Connect GitHub repository**
4. Выбери `sentinel-sat` репозиторий

#### 4.2 Настройки Web Service
```yaml
Name: sentinel-sat
Environment: Python
Region: Frankfurt (или ближайший)
Branch: main
Root Directory: ./backend  # Важно!
Runtime: Python
Build Command: ./render-build.sh
Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
```

#### 4.3 Environment Variables
```bash
HF_TOKEN=Bearer hf_your_token_here
ESP_STREAM_URL=http://192.168.1.100:81/stream
SUPABASE_URL=your_supabase_url  # опционально
SUPABASE_KEY=your_supabase_key  # опционально
```

#### 4.4 Health Check
- **Path**: `/api/health`
- **Auto-restart**: ✅ Включено
- **Health Check Frequency**: 30 секунд

### Шаг 5: Проверка деплоя

#### 5.1 Ожидание сборки
- **Build time**: 2-3 минуты
- **Deploy time**: 1-2 минуты
- **Total**: ~5 минут

#### 5.2 Проверка работоспособности
```bash
# Проверь API
curl https://sentinel-sat.onrender.com/api/health

# Проверь фронтенд
# Открой в браузере: https://sentinel-sat.onrender.com
```

#### 5.3 Expected Response
```json
{
  "status": "healthy",
  "source": "esp",
  "latest_analysis": true,
  "hf_api_available": true,
  "esp_connected": true
}
```

### Шаг 6: Пост-деплой настройка

#### 6.1 Настройка кастомного домена (опционально)
1. В настройках Web Service → "Custom Domains"
2. Добавь свой домен: `sentinel-sat.yourdomain.com`
3. Настрой DNS записи

#### 6.2 Мониторинг
- **Logs**: Вкладка "Logs" в дашборде Render
- **Metrics**: CPU, Memory, Response time
- **Events**: Deployments, restarts

#### 6.3 Тестирование функциональности
- ✅ Видеопоток загружается
- ✅ AI детекция работает
- ✅ История событий отображается
- ✅ Переключение источников работает
- ✅ Частицы анимируются на фоне

## 🔧 Troubleshooting

### Проблема: Build failed
**Решение**: Проверь логи в Render дашборде
```bash
# Common issues:
# - Missing dependencies
# - Frontend build errors
# - Python version mismatch
```

### Проблема: HF API Error
**Решение**: Проверь токен
```bash
# Test token:
curl -H "Authorization: Bearer hf_your_token" \
     https://api-inference.huggingface.co/models/yolos/yolos-tiny
```

### Проблема: White screen
**Решение**: Проверь консоль браузера
```bash
# Common issues:
# - JavaScript errors
# - CSS import order
# - Missing dependencies
```

### Проблема: Video not loading
**Решение**: Проверь ESP32 подключение
```bash
# Test ESP32 stream:
curl -I http://your-esp32-ip:81/stream
```

## 📊 Успешный деплой

После успешного деплоя у тебя будет:

### 🌐 **Доступные URL**
- **Основной**: `https://sentinel-sat.onrender.com`
- **API**: `https://sentinel-sat.onrender.com/api/health`
- **Видео**: `https://sentinel-sat.onrender.com/stream`

### 🎯 **Рабочие функции**
- ✅ Real-time AI детекция
- ✅ Видеопоток с ESP32
- ✅ История событий
- ✅ Интерактивная карта
- ✅ Мобильные уведомления
- ✅ Анимированные частицы

### 💰 **Стоимость**
- **Render**: Бесплатно (750 часов/месяц)
- **HuggingFace**: Бесплатно (30k запросов/месяц)
- **Итого**: $0/месяц

## 🎉 Поздравляем!

Твой SENTINEL.SAT теперь доступен всему миру! 🌍✨

### Что дальше?
1. **Поделись** проектом с друзьями
2. **Добавь** в портфолио
3. **Напиши** статью или пост
4. **Собери** обратную связь
5. **Улучши** на основе отзывов

---

**🌍 SENTINEL.SAT - AI спасает жизни по всему миру!**
