---
title: SENTINEL.SAT AI Disaster Detection
emoji: 🛰️
colorFrom: red
colorTo: yellow
sdk: docker
app_file: app.py
pinned: false
---

# 🛰️ SENTINEL.SAT HuggingFace Space

## 📋 Описание

HuggingFace Space для AI детекции катастроф. Интегрируется с основным сервером SENTINEL.SAT для обработки изображений и отправки результатов.

## 🚀 Функции

### 🤖 AI детекция
- **YOLO модель** для детекции объектов
- **Классификация катастроф** (пожары, наводнения, землетрясения, штормы)
- **Уверенность детекции** с порогами

### 📡 Интеграция с сервером
- **Отправка результатов** на SENTINEL.SAT сервер
- **API эндпоинт** для внешних запросов
- **Статус мониторинга** сервера

### 🎥 Gradio интерфейс
- **Загрузка изображений** для анализа
- **Визуализация результатов** детекции
- **Статус системы** в реальном времени

## 🔗 Интеграция

### API эндпоинты
```
POST /api/predict
Content-Type: multipart/form-data
Body: image_file
```

### Ответ сервера
```json
{
  "status": "success",
  "predictions": [
    {
      "label": "fire",
      "score": 0.95,
      "box": {"xmin": 100, "ymin": 50, "xmax": 200, "ymax": 150}
    }
  ],
  "timestamp": 1672531200.123,
  "hf_space": true
}
```

### Отправка на SENTINEL.SAT
```python
POST https://sentinel-sat.onrender.com/api/hf-results
Content-Type: application/json
{
  "disaster_detections": [...],
  "total_objects": 5,
  "disasters_found": 1
}
```

## 🛠️ Деплой на HuggingFace

### 1. Создай Space
1. Перейди на https://huggingface.co/spaces
2. Нажми "Create new Space"
3. Выбери "Gradio" SDK
4. Назови `sentinel-watch`

### 2. Загрузи файлы
```bash
git clone https://huggingface.co/spaces/Dyman17/sentinel-watch
cd sentinel-watch
cp ../hf_space/* .
git add .
git commit -m "🚀 Deploy SENTINEL.SAT HF Space"
git push
```

### 3. Настрой переменные окружения
В настройках Space добавь:
```
SENTINEL_SERVER_URL=https://sentinel-sat.onrender.com
HF_API_TOKEN=hf_xxxxxxxxxxxxxx
```

## 🎯 Детектируемые катастрофы

### 🔥 Пожары
- fire, flame, smoke, burning, blaze

### 🌊 Наводнения  
- flood, water, inundated, submerged, overflow

### 🌍 Землетрясения
- earthquake, collapse, rubble, destruction, damaged

### ⛈️ Штормы
- storm, tornado, hurricane, cyclone, wind

## 📊 Мониторинг

### Статус сервера
- ✅ Онлайн/офлайн статус
- 📡 Количество подключенных клиентов
- 🤖 HF API статус

### История детекций
- 🕐 Временные метки
- 📍 Координаты объектов
- 📈 Уверенность детекции

## 🔧 Разработка

### Локальный запуск
```bash
pip install -r requirements.txt
python app.py
```

### Тестирование API
```bash
curl -X POST http://localhost:7860/api/predict \
  -F "image=@test_image.jpg"
```

## 🚨 Безопасность

- 🔒 **HTTPS** для всех запросов
- 🛡️ **Token аутентификация** для API
- 📝 **Логирование** всех запросов
- 🔍 **Валидация** входных данных

## 📈 Производительность

- ⚡ **Быстрая обработка** изображений
- 🔄 **Асинхронные** запросы
- 💾 **Кэширование** результатов
- 📊 **Мониторинг** нагрузки

---

**🛰️ SENTINEL.SAT - AI Disaster Monitoring System**  
*HuggingFace Space + FastAPI + ESP32 = Реальное время детекции катастроф*
