# ESP32 Logger для SENTINEL.SAT 🛰️

## 📋 Что это?

Вторая ESP32 которая подключается к SENTINEL.SAT серверу через WebSocket и получает логи детекции катастроф в реальном времени.

## 🔧 Настройка

### 1. WiFi настройки
В файле `esp32_logger.ino` измени:
```cpp
const char* ssid = "YOUR_WIFI_SSID";           // Твоя WiFi сеть
const char* password = "YOUR_WIFI_PASSWORD";     // Пароль WiFi
```

### 2. WebSocket сервер
```cpp
const char* ws_server = "sentinel-sat.onrender.com";  // Без http://
const int ws_port = 443;  // HTTPS порт
const char* ws_path = "/ws/logs";
```

### 3. LCD дисплей (опционально)
```cpp
LiquidCrystal_I2C lcd(0x27, 16, 2);  // I2C адрес 0x27, 16x2 дисплей
```

## 📡 Как работает

1. **Подключение к WiFi** - ESP32 подключается к твоей сети
2. **WebSocket подключение** - Подключается к серверу SENTINEL.SAT
3. **Получение логов** - Получает JSON сообщения с результатами детекции
4. **Отображение** - Показывает информацию на LCD и Serial Monitor
5. **Оповещения** - Мигает подсветкой при обнаружении катастроф

## 📊 WebSocket сообщения

### От сервера к ESP32:
```json
{
  "disasters_found": 2,
  "disaster_type": "fire",
  "confidence": 0.95,
  "total_objects": 5,
  "timestamp": 1672531200.123,
  "clients_connected": 3
}
```

### От ESP32 к серверу:
```
"status"  - Запрос статуса сервера
"reset"  - Сброс счетчиков
```

## 🖥️ LCD дисплей

### Первая строка:
- 🟢 SENTINEL.SAT (подключен)
- 🔴 No Connection (нет подключения)

### Вторая строка:
- 🚨 2 fire (найдено 2 пожара)
- ✅ No Disasters (нет катастроф)

## 🚨 Оповещения

При обнаружении катастроф:
1. **Мигает подсветка** LCD (5 раз)
2. **Показывает детекцию** на 3 секунды
3. **Выводит в Serial** подробную информацию

## 📦 Библиотеки

Установи в Arduino IDE:
- `WiFi`
- `ArduinoJson`
- `WebSocketsClient`
- `LiquidCrystal_I2C`

## 🔌 Подключение LCD

```
ESP32    -> I2C LCD
GND      -> GND
5V       -> VCC
GPIO22   -> SDA
GPIO21   -> SCL
```

## 📱 Serial Monitor вывод

```
🛰️ SENTINEL.SAT ESP32 Logger Starting...
✅ WiFi connected!
📡 IP address: 192.168.1.100
🔌 Connecting to WebSocket...
🔌 WebSocket connected
📨 Received: {"disasters_found":2,"disaster_type":"fire","confidence":0.95}
🚨 Disasters: 2, Objects: 5, Type: fire
🚨🚨🚨 DISASTER ALERT! 🚨🚨🚨
```

## 🔄 Автоматическое переподключение

- **WiFi**: каждые 30 секунд проверка подключения
- **WebSocket**: автоматическое переподключение каждые 5 секунд
- **Обработка ошибок**: удаление отключенных клиентов

## ⚡ Оптимизация

### Экономия памяти:
```cpp
#define JSON_BUFFER_SIZE 1024  // Размер JSON буфера
#define RECONNECT_INTERVAL 5000  // Интервал переподключения
```

### Энергосбережение:
```cpp
#include "esp_deep_sleep.h"
// Можно добавить deep sleep между проверками
```

## 🐛 Отладка

### Проблемы с WiFi:
- Проверь SSID и пароль
- Убедись что 2.4GHz сеть
- Проверь сигнал RSSI > -70dBm

### Проблемы с WebSocket:
- Проверь URL сервера
- Убедись что порт 443 открыт
- Проверь логи сервера

### Проблемы с LCD:
- Проверь I2C подключение
- Убедись что адрес 0x27 правильный
- Проверь питание 5V

## 🎯 Следующие шаги

1. **Настройте WiFi** в коде
2. **Подключите LCD** (опционально)
3. **Загрузите код** в ESP32
4. **Запустите сервер** SENTINEL.SAT
5. **Наблюдайте** за логами в реальном времени!

---

**🛰️ SENTINEL.SAT - AI Disaster Monitoring System**  
*ESP32 Logger + WebSocket + Real-time Alerts = Мгновенные уведомления о катастрофах*
