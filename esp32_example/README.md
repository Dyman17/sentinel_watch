# ESP32 SENTINEL.SAT 🛰️

## 📋 Что это?

ESP32 код для отправки видеопотока на сервер SENTINEL.SAT для AI детекции катастроф через HuggingFace.

## 🔧 Настройка

### 1. WiFi настройки
В файле `esp32_sentinel.ino` измени:
```cpp
const char* ssid = "YOUR_WIFI_SSID";           // Твоя WiFi сеть
const char* password = "YOUR_WIFI_PASSWORD";     // Пароль WiFi
```

### 2. URL сервера
```cpp
const char* serverUrl = "https://sentinel-sat.onrender.com/api/upload-frame";
```

### 3. Настройки камеры
Можно изменить в `setup()`:
```cpp
config.frame_size = FRAMESIZE_SVGA;  // 800x600
config.jpeg_quality = 12;             // Качество JPEG (0-63)
```

Разрешения:
- `FRAMESIZE_QVGA`   320x240
- `FRAMESIZE_VGA`    640x480  
- `FRAMESIZE_SVGA`   800x600
- `FRAMESIZE_XGA`    1024x768
- `FRAMESIZE_SXGA`   1280x1024

## 📡 Как работает

1. **Подключение к WiFi** - ESP32 подключается к твоей сети
2. **Инициализация камеры** - Настраивает AI-Thinker камеру
3. **Захват кадра** - Каждые 5 секунд делает фото
4. **Отправка на сервер** - POST запрос с JPEG кадром
5. **Получение ответа** - Парсит JSON с результатами детекции

## 🚀 Загрузка в ESP32

### Через Arduino IDE:
1. Установи ESP32 Board Manager
2. Установи библиотеки:
   - `WiFi`
   - `HTTPClient` 
   - `ArduinoJson`
   - `ESP32-CAM`
3. Открой `esp32_sentinel.ino`
4. Выбери плату: **AI Thinker ESP32-CAM**
5. Загрузи в ESP32

### Через PlatformIO:
```ini
[env:esp32cam]
platform = espressif32
board = esp32cam
framework = arduino
lib_deps = 
    WiFi
    HTTPClient
    ArduinoJson
    esp32-camera
```

## 📊 Серийный монитор

При успешной работе увидишь:
```
🚀 SENTINEL.SAT ESP32 Starting...
✅ Camera initialized successfully
📡 Connecting to WiFi....
✅ WiFi connected!
📡 IP address: 192.168.1.100
🛰️ SENTINEL.SAT ESP32 Ready!
🎯 Sending frames to: https://sentinel-sat.onrender.com/api/upload-frame
📸 Capturing frame...
📸 Frame captured: 45678 bytes
📡 Sending frame to server...
✅ Frame sent successfully! HTTP 200
🤖 Server response:
{"status": "ok", "hf_result": {"disasters_found": 1, "disaster_detections": [{"label": "fire", "score": 0.95}]}}
🚨 DISASTER DETECTED! 1 disasters found
✅ Frame processing complete
```

## 🔍 API эндпоинт

ESP32 отправляет POST на:
```
POST /api/upload-frame
Content-Type: image/jpeg
Body: [JPEG кадр]
```

Сервер отвечает JSON:
```json
{
  "status": "ok",
  "message": "Frame received and processed",
  "hf_result": {
    "disasters_found": 1,
    "disaster_detections": [
      {
        "label": "fire",
        "score": 0.95,
        "original_label": "fire",
        "timestamp": 1672531200.123
      }
    ]
  },
  "frame_size": 45678,
  "clients_connected": 3
}
```

## ⚡ Оптимизация

### Экономия трафика:
```cpp
#define FRAME_INTERVAL 10000  // 10 секунд вместо 5
config.jpeg_quality = 15;     // Более сжатый JPEG
config.frame_size = FRAMESIZE_VGA;  // 640x480 вместо 800x600
```

### Стабильность:
```cpp
// Добавь в setup()
WiFi.setSleep(false);  // Отключить сон WiFi
WiFi.setAutoReconnect(true);  // Автопереподключение
```

## 🐛 Отладка

### Проблемы с WiFi:
- Проверь SSID и пароль
- Убедись что 2.4GHz сеть (не 5GHz)
- Проверь сигнал RSSI > -70dBm

### Проблемы с камерой:
- Проверь подключение камерного модуля
- Попробуй другое разрешение
- Увеличь `config.jpeg_quality`

### Проблемы с сервером:
- Проверь URL сервера
- Убедись что сервер запущен
- Проверь логи в Serial Monitor

## 🎯 Следующие шаги

1. **Настройте WiFi** в коде
2. **Загрузите** в ESP32
3. **Проверьте** Serial Monitor
4. **Откройте** https://sentinel-sat.onrender.com
5. **Наблюдайте** за детекцией катастроф в реальном времени!

---

**🛰️ SENTINEL.SAT - AI Disaster Monitoring System**  
*ESP32 + HuggingFace + React = Реальное время детекции катастроф*
