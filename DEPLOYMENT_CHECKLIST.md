# 🚀 SENTINEL.SAT Deployment Checklist

## ✅ Перед деплоем на Render

### 1. Проверь GitHub репозиторий
- [ ] Все файлы загружены: `git push origin fresh-main:main`
- [ ] Последний коммит: `🚀 Industrial-grade optimizations: rate limiting, ping/pong, caching`
- [ ] Структура папок правильная

### 2. Проверь переменные окружения на Render
- [ ] `HF_TOKEN=Bearer hf_xxxxxxxxxxxxxxxxxxxx`
- [ ] `HF_API_URL=https://hf.space/embed/Dyman17/sentinel-watch/api/predict/`
- [ ] `PORT=10000` (автоматически)

### 3. Проверь render.yaml
```yaml
services:
  - type: web
    name: sentinel-sat
    env: python
    plan: free
    rootDirectory: backend
    buildCommand: pip install -r requirements.txt && cd ../frontend && npm install && npm run build && cd ../backend && mkdir -p static && cp -r ../frontend/dist/* static/
    startCommand: python -m uvicorn main:app --host 0.0.0.0 --port $PORT
    healthCheckPath: /api/health
    autoDeploy: yes
```

## 🔧 ESP32 Подготовка

### ESP32-Cam (отправка кадров)
```cpp
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverUrl = "https://sentinel-sat.onrender.com/api/upload-frame";
#define FRAME_INTERVAL 250  // 0.25 секунды
```

### ESP32-Logger (получение логов)
```cpp
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* ws_server = "sentinel-sat.onrender.com";
const char* ws_path = "/ws/logs";
```

## 🧪 Тестирование

### 1. Серверные тесты
```bash
# Health check
curl https://sentinel-sat.onrender.com/api/health

# Latest log
curl https://sentinel-sat.onrender.com/api/latest

# WebSocket тест
wscat -c wss://sentinel-sat.onrender.com/ws/logs
```

### 2. ESP32-Cam тест
```cpp
// В Serial Monitor должно быть:
📸 Frame captured: 45678 bytes
📡 Sending frame to server...
✅ Frame sent successfully! HTTP 200
🤖 Server response: {"status": "ok", "hf_result": {...}}
```

### 3. ESP32-Logger тест
```cpp
// В Serial Monitor должно быть:
🔌 WebSocket connected
📨 Received: {"disasters":1,"type":"fire","confidence":0.95}
🚨 Disasters: 1, Type: fire
```

## 📊 Ожидаемые результаты

### Успешный деплой:
- ✅ Сервер отвечает на `/api/health`
- ✅ Фронтенд загружается на `/`
- ✅ WebSocket подключается
- ✅ ESP32-Cam отправляет кадры
- ✅ ESP32-Logger получает логи

### Логи сервера:
```
🚀 Запускаем сервер на порту 10000
🤖 HF API URL: https://hf.space/embed/Dyman17/sentinel-watch/api/predict/
📡 Ожидаем кадры от ESP32 на /api/upload-frame
📸 Получен кадр от ESP32: 45678 байт
🤖 Starting HF analysis...
📝 Log added: 1 disasters, type: fire
```

## 🚨 Возможные проблемы

### 1. ESP32 не подключается к WiFi
- Проверь SSID и пароль
- Убедись что 2.4GHz сеть
- Проверь сигнал RSSI > -70dBm

### 2. Сервер не отвечает
- Проверь логи на Render
- Убедись что переменные окружения установлены
- Проверь health check путь

### 3. WebSocket не подключается
- Проверь URL: `wss://sentinel-sat.onrender.com/ws/logs`
- Убедись что порт 443 открыт
- Проверь ping/pong логику

### 4. HF API ошибки
- Проверь токен: `Bearer hf_xxxxxxxxxxxxxx`
- Убедись что Space развернут
- Проверь лимиты API

## 🎯 Успешный сценарий

1. **Render деплой успешен**
2. **ESP32-Cam подключена** → отправляет кадры
3. **ESP32-Logger подключена** → получает логи
4. **HF анализирует** → возвращает детекции
5. **Фронтенд показывает** → реальное время

## 📈 Мониторинг

### Server metrics:
- `GET /api/health` - статус сервера
- `GET /api/status` - количество клиентов
- `GET /api/detections` - история детекций

### ESP32 metrics:
- WiFi статус
- WebSocket статус
- Количество полученных логов
- Свободная память

---

**🛰️ SENTINEL.SAT готов к тестированию!**  
*Загрузи на Render, подключи ESP32 и наблюдай за детекцией катастроф в реальном времени!*
