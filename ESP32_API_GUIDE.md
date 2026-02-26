# 🛰️ SENTINEL.SAT ESP32 API Guide

## Архитектура связи

### Текущая система: WebSocket (работает)
```
WebSocket (pushed alerts)
ESP32 → постоянно слушает сервер
Сервер → отправляет災害 alerts
```

### Новая система: HTTP Polling (более надежная для IoT)
```
HTTP GET Polling
ESP32 → запрашивает статус каждые 5-10 сек
Сервер → возвращает latest detections + alerts
```

---

## API Endpoint для ESP32

### URL
```
GET /api/esp32/status
```

### Базовый URL для подключения
```
Render Deployment:
https://sentinel-sat.onrender.com/api/esp32/status

Локальный сервер:
http://localhost:8000/api/esp32/status
```

### Response (JSON)
```json
{
  "status": "success",
  "server_time": 1708944000,
  "latest_detection": {
    "type": "person",
    "confidence": 0.87,
    "source": "client",
    "timestamp": 1708943995000
  },
  "alerts": [
    {
      "type": "person",
      "confidence": 0.82,
      "count": 1
    },
    {
      "type": "hand",
      "confidence": 0.71,
      "count": 1
    }
  ],
  "disaster_count": 3,
  "total_detections": 156,
  "client_detection_count": 89
}
```

### Описание полей
- **status**: "success" или "error"
- **server_time**: Unix timestamp текущего времени на сервере
- **latest_detection**: Последнее обнаружение (65%+ confidence)
  - **type**: Класс объекта (person, fire, smoke, etc.)
  - **confidence**: Уверенность (0.0-1.0)
  - **source**: "client" (TensorFlow) или "server" (HuggingFace)
  - **timestamp**: Когда это обнаружено
- **alerts**: Массив текущих high-priority алертов (>65% confidence)
- **disaster_count**: Всего обнаружено катастроф за сессию
- **total_detections**: Всего объектов обнаружено
- **client_detection_count**: Количество детекций от TensorFlow.js

---

## Пример кода для ESP32 (Arduino)

### Опция 1: Simple HTTP Polling (Рекомендуется для IoT)

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <LiquidCrystal_I2C.h>

const char* SSID = "YourWiFiName";
const char* PASSWORD = "YourWiFiPassword";
const char* API_URL = "https://sentinel-sat.onrender.com/api/esp32/status";
// Для локального: const char* API_URL = "http://192.168.x.x:8000/api/esp32/status";

LiquidCrystal_I2C lcd(0x27, 16, 2);

unsigned long last_poll = 0;
const unsigned long POLL_INTERVAL = 5000; // 5 секунд

void setup() {
  Serial.begin(115200);

  // Init LCD
  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.print("SENTINEL.SAT");
  lcd.setCursor(0, 1);
  lcd.print("Connecting...");

  // Connect WiFi
  WiFi.mode(WIFI_STA);
  WiFi.begin(SSID, PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi Connected");
    lcd.clear();
    lcd.print("WiFi OK");
    lcd.setCursor(0, 1);
    lcd.print(WiFi.localIP().toString());
  } else {
    Serial.println("\n❌ WiFi Failed");
    lcd.clear();
    lcd.print("WiFi FAIL");
  }

  delay(2000);
}

void loop() {
  unsigned long current_time = millis();

  // Poll API каждые 5 секунд
  if (current_time - last_poll >= POLL_INTERVAL) {
    last_poll = current_time;
    pollServerStatus();
  }

  delay(100);
}

void pollServerStatus() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ WiFi disconnected");
    return;
  }

  HTTPClient http;
  Serial.println("📡 Polling: " + String(API_URL));

  http.begin(API_URL);
  http.addHeader("Content-Type", "application/json");

  int httpResponseCode = http.GET();

  if (httpResponseCode == 200) {
    String payload = http.getString();
    Serial.println("📥 Response: " + payload);

    // Parse JSON
    StaticJsonDocument<512> doc;
    DeserializationError error = deserializeJson(doc, payload);

    if (!error) {
      String status = doc["status"];

      if (status == "success") {
        // Get latest detection
        JsonObject latest = doc["latest_detection"];
        if (!latest.isNull()) {
          String type = latest["type"] | "none";
          float confidence = latest["confidence"] | 0.0;
          String source = latest["source"] | "unknown";

          Serial.printf("🎯 Detection: %s (%.0f%% from %s)\n",
                        type.c_str(), confidence * 100, source.c_str());

          // Update LCD
          displayDetection(type, confidence);
        }

        // Get alerts
        JsonArray alerts = doc["alerts"];
        if (alerts.size() > 0) {
          Serial.printf("🚨 %d High-priority alerts!\n", alerts.size());

          // Display first alert on LCD
          String alert_type = alerts[0]["type"];
          float alert_conf = alerts[0]["confidence"];
          displayAlert(alert_type, alert_conf);
        } else {
          Serial.println("✅ No alerts");
          displayNoAlert();
        }

        // Get disaster count
        int disaster_count = doc["disaster_count"];
        Serial.printf("📊 Disasters found: %d\n", disaster_count);
      }
    } else {
      Serial.println("❌ JSON parse error");
    }
  } else {
    Serial.printf("❌ HTTP Error: %d\n", httpResponseCode);
    displayError("HTTP Error");
  }

  http.end();
}

void displayDetection(String type, float confidence) {
  lcd.clear();
  lcd.print("DETECT:");
  lcd.setCursor(0, 1);
  lcd.print(type + " " + String(int(confidence * 100)) + "%");
}

void displayAlert(String type, float confidence) {
  lcd.clear();
  lcd.print("ALERT:");
  lcd.setCursor(0, 1);
  lcd.print(type + " " + String(int(confidence * 100)) + "%");

  // Бligнуть LED или издать звук
  // digitalWrite(ALERT_LED, HIGH);
  // delay(500);
  // digitalWrite(ALERT_LED, LOW);
}

void displayNoAlert() {
  lcd.clear();
  lcd.print("Status: OK");
  lcd.setCursor(0, 1);
  lcd.print("No alerts");
}

void displayError(String msg) {
  lcd.clear();
  lcd.print("ERROR:");
  lcd.setCursor(0, 1);
  lcd.print(msg);
}
```

---

## Опция 2: Оптимизированный код с reconnection

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

class ESP32SentinelClient {
private:
  const char* api_url;
  const char* ssid;
  const char* password;
  unsigned long poll_interval;
  unsigned long last_poll;
  int retry_count;

public:
  ESP32SentinelClient(const char* url, const char* _ssid,
                      const char* _password, unsigned long interval = 5000) {
    api_url = url;
    ssid = _ssid;
    password = _password;
    poll_interval = interval;
    last_poll = 0;
    retry_count = 0;
  }

  void begin() {
    WiFi.mode(WIFI_STA);
    connectWiFi();
  }

  void connectWiFi() {
    if (WiFi.status() == WL_CONNECTED) return;

    Serial.printf("📡 Connecting to %s...\n", ssid);
    WiFi.begin(ssid, password);

    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 30) {
      delay(500);
      Serial.print(".");
      attempts++;
    }

    if (WiFi.status() == WL_CONNECTED) {
      Serial.printf("\n✅ WiFi connected: %s\n", WiFi.localIP().toString().c_str());
      retry_count = 0;
    } else {
      Serial.println("\n❌ WiFi connection failed");
      retry_count++;
    }
  }

  void update() {
    unsigned long now = millis();

    // Reconnect WiFi if needed
    if (WiFi.status() != WL_CONNECTED) {
      if (retry_count > 3) {
        Serial.println("⚠️ WiFi retry limit reached, restarting...");
        ESP.restart();
      }
      connectWiFi();
      return;
    }

    // Poll server
    if (now - last_poll >= poll_interval) {
      last_poll = now;
      poll();
    }
  }

  void poll() {
    HTTPClient http;
    http.begin(api_url);
    http.setTimeout(5000);

    int code = http.GET();

    if (code == 200) {
      String response = http.getString();
      handleResponse(response);
    } else {
      Serial.printf("❌ HTTP %d\n", code);
    }

    http.end();
  }

  void handleResponse(String json) {
    StaticJsonDocument<1024> doc;

    if (deserializeJson(doc, json)) {
      Serial.println("❌ JSON error");
      return;
    }

    String status = doc["status"];
    if (status != "success") return;

    // Get latest detection
    JsonObject detection = doc["latest_detection"];
    if (!detection.isNull()) {
      String type = detection["type"];
      float conf = detection["confidence"];
      String source = detection["source"];

      Serial.printf("✅ %s %.0f%% (%s)\n",
                    type.c_str(), conf * 100, source.c_str());

      // You can add callback here
      onDetection(type, conf);
    }

    // Check alerts
    JsonArray alerts = doc["alerts"];
    if (alerts.size() > 0) {
      onAlert(alerts.size());
    }
  }

  // Override these methods
  virtual void onDetection(String type, float confidence) {}
  virtual void onAlert(int count) {}
};

// Usage:
class MyESP32 : public ESP32SentinelClient {
public:
  using ESP32SentinelClient::ESP32SentinelClient;

  void onDetection(String type, float confidence) override {
    Serial.printf("🎯 My Detection: %s\n", type.c_str());
    // Update LCD, set LEDs, etc.
  }

  void onAlert(int count) override {
    Serial.printf("🚨 My Alert: %d objects\n", count);
    // Flash LED, sound buzzer, etc.
  }
};

// In main code:
MyESP32 sentinel("https://sentinel-sat.onrender.com/api/esp32/status",
                 "WiFiName", "Password", 5000);

void setup() {
  Serial.begin(115200);
  sentinel.begin();
}

void loop() {
  sentinel.update();
  delay(100);
}
```

---

## Confidence порог

**Текущий порог: 65%** (обновлен в backend)

Это значит:
- ✅ Любое обнаружение с confidence **≥ 65%** отправится на ESP32
- ❌ Ниже 65% - игнорируется

Если хочешь изменить, можно в backend изменить эту строку:
```python
high_priority = [d for d in detections if d["score"] > 0.65]  # Измени 0.65
```

---

## Тестирование API

### Через curl:
```bash
curl https://sentinel-sat.onrender.com/api/esp32/status
```

### Через PowerShell:
```powershell
Invoke-WebRequest -Uri "https://sentinel-sat.onrender.com/api/esp32/status" -Method GET | ConvertFrom-Json
```

### Локально:
```bash
curl http://localhost:8000/api/esp32/status
```

---

## Плюсы Poll модели vs WebSocket

| Фактор | Poll (HTTP) | WebSocket |
|--------|-----------|-----------|
| **Надежность** | ✅ Лучше (автоматический reconnect) | ⚠️ Нужна постоянная связь |
| **Bandwidth** | ✅ Меньше (периодические запросы) | ⚠️ Больше (постоянное соединение) |
| **Задержка** | 🟡 5-10 сек (зависит от интервала) | ✅ Тут же |
| **Простота** | ✅ Стандартный HTTP | ⚠️ Нужна WebSocket lib |
| **Батарея** | ✅ Экономнее | ⚠️ Расходует быстрее |
| **IoT friendly** | ✅ Да | ⚠️ Не очень |

**Рекомендация**: Используй **Poll** для основной логики + **WebSocket** для real-time alerts (если нужна минимальная задержка).

---

## Что дальше?

1. **Скопируй код ESP32** и загрузи на микроконтроллер
2. **Установи интервал polling**: 5-10 сек (зависит от батареи)
3. **Добавь обработчик** для своего LCD/LED/Audio
4. **Тестируй**: Смотри в Serial Monitor детекции приходят

Если вопросы - спрашивай! 🚀
