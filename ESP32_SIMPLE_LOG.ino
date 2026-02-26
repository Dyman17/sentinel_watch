// 🛰️ SENTINEL.SAT ESP32 - Simple Log Polling
// ESP32 пингует /api/esp32/log каждые 2 секунды
// Получает логи в формате: {"log":"AI: person detected (87%)"}

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <LiquidCrystal_I2C.h>

// ========== НАСТРОЙКИ ==========
const char* SSID = "BB";                    // Твоя WiFi
const char* PASSWORD = "Student111";        // Пароль WiFi

// Выбери свой сервер:
// Render (production): https://sentinel-sat.onrender.com/api/esp32/log
// Локальный (dev):     http://192.168.x.x:8000/api/esp32/log
const char* LOG_URL = "https://sentinel-sat.onrender.com/api/esp32/log";

// LCD (опционально)
LiquidCrystal_I2C lcd(0x27, 16, 2);

// ========== ПЕРЕМЕННЫЕ ==========
unsigned long last_poll = 0;
const unsigned long POLL_INTERVAL = 2000;  // 2 секунды
String last_log = "Initializing...";

// ========== SETUP ==========
void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n\n🛰️ SENTINEL.SAT ESP32 Starting...");

  // Инициализируем LCD
  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.print("SENTINEL.SAT");
  lcd.setCursor(0, 1);
  lcd.print("Connecting...");

  // Подключаемся к WiFi
  connectWiFi();
}

// ========== MAIN LOOP ==========
void loop() {
  unsigned long now = millis();

  // Пингуем сервер каждые 2 секунды
  if (now - last_poll >= POLL_INTERVAL) {
    last_poll = now;
    pollServer();
  }

  delay(100);
}

// ========== WiFi ПОДКЛЮЧЕНИЕ ==========
void connectWiFi() {
  Serial.printf("\n📡 Connecting to WiFi: %s\n", SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(SSID, PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\n✅ WiFi Connected!\n");
    Serial.printf("IP: %s\n", WiFi.localIP().toString().c_str());
    lcd.clear();
    lcd.print("WiFi OK");
    lcd.setCursor(0, 1);
    lcd.print(WiFi.localIP().toString());
    delay(2000);
  } else {
    Serial.println("\n❌ WiFi Connection Failed!");
    lcd.clear();
    lcd.print("WiFi FAIL");
    lcd.setCursor(0, 1);
    lcd.print("Check settings");
  }
}

// ========== PING СЕРВЕР ==========
void pollServer() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ WiFi not connected");
    displayOnLCD("WiFi Lost", "Reconnecting...");
    connectWiFi();
    return;
  }

  HTTPClient http;

  Serial.printf("📡 Polling: %s\n", LOG_URL);

  http.begin(LOG_URL);
  http.setTimeout(3000);  // 3 сек timeout

  int httpCode = http.GET();

  if (httpCode == 200) {
    String response = http.getString();
    Serial.printf("📥 Response: %s\n", response.c_str());

    // Парсим JSON
    StaticJsonDocument<256> doc;
    DeserializationError error = deserializeJson(doc, response);

    if (!error) {
      String log = doc["log"] | "No data";
      last_log = log;

      Serial.printf("✅ Log: %s\n", log.c_str());

      // Обновляем LCD
      displayOnLCD("SENTINEL.SAT", log);

      // Проверяем на ключевые слова
      if (log.indexOf("detected") > 0 || log.indexOf("DISASTER") >= 0) {
        Serial.println("🚨 ALERT RECEIVED!");
        alertOnDetection();
      }
    } else {
      Serial.println("❌ JSON parse error");
      displayOnLCD("Error", "JSON parse fail");
    }
  } else {
    Serial.printf("❌ HTTP Error: %d\n", httpCode);
    displayOnLCD("HTTP Error", String(httpCode));
  }

  http.end();
}

// ========== DISPLAY НА LCD ==========
void displayOnLCD(String line1, String line2) {
  lcd.clear();
  lcd.setCursor(0, 0);

  // Обрезаем если слишком длинно (max 16 символов)
  if (line1.length() > 16) {
    line1 = line1.substring(0, 16);
  }
  lcd.print(line1);

  lcd.setCursor(0, 1);
  if (line2.length() > 16) {
    line2 = line2.substring(0, 16);
  }
  lcd.print(line2);
}

// ========== ALERT ПРИ ДЕТЕКЦИИ ==========
void alertOnDetection() {
  // Если у тебя есть LED на пине:
  // digitalWrite(LED_PIN, HIGH);
  // delay(500);
  // digitalWrite(LED_PIN, LOW);

  // Если есть buzzer на пине:
  // tone(BUZZER_PIN, 1000, 500);  // 1kHz, 500ms

  Serial.println("🔔 Alarm triggered!");
}

/*
========== ПРИМЕРЫ ОТВЕТОВ ==========

Успешное обнаружение:
{
  "log": "AI: PERSON detected (87%)",
  "timestamp": 1708944123456
}

Обнаружена катастрофа:
{
  "log": "DISASTER: FIRE (92%)",
  "timestamp": 1708944125000
}

Нет детекций:
{
  "log": "AI: Monitoring... No alerts",
  "timestamp": 1708944127000
}

Ошибка на сервере:
{
  "log": "ERROR: Connection refused",
  "timestamp": 1708944129000
}

========== КАК ИСПОЛЬЗОВАТЬ ==========

1. Установи WiFi credentials:
   const char* SSID = "YourWiFiName";
   const char* PASSWORD = "YourWiFiPassword";

2. Выбери URL (production или локальный):
   const char* LOG_URL = "https://sentinel-sat.onrender.com/api/esp32/log";
   // или для локального тестирования:
   // const char* LOG_URL = "http://192.168.x.x:8000/api/esp32/log";

3. Загрузи код на ESP32

4. Смотри в Serial Monitor детекции:
   📡 Polling: https://sentinel-sat.onrender.com/api/esp32/log
   📥 Response: {"log":"AI: person detected (87%)","timestamp":1708944123}
   ✅ Log: AI: person detected (87%)

5. На LCD будет показан log строка!

========== ДОПОЛНИТЕЛЬНО ==========

Если хочешь добавить LED или buzzer:

const int LED_PIN = 5;      // GPIO5
const int BUZZER_PIN = 13;  // GPIO13

void setup() {
  pinMode(LED_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  // ... остальной код
}

void alertOnDetection() {
  // Светодиод
  digitalWrite(LED_PIN, HIGH);
  delay(200);
  digitalWrite(LED_PIN, LOW);
  delay(200);
  digitalWrite(LED_PIN, HIGH);
  delay(200);
  digitalWrite(LED_PIN, LOW);

  // Buzzer (требует PWM)
  tone(BUZZER_PIN, 1000, 500);  // 1kHz звук на 500ms
  delay(600);
  tone(BUZZER_PIN, 1500, 500);  // Другая частота
}

========== ТЕСТИРОВАНИЕ БЕЗ ESP32 ==========

Через curl:
$ curl https://sentinel-sat.onrender.com/api/esp32/log

Через PowerShell:
PS> Invoke-WebRequest -Uri "https://sentinel-sat.onrender.com/api/esp32/log" | ConvertFrom-Json

Должен вернуть:
{
  "log": "AI: Monitoring... No alerts",
  "timestamp": 1708944127000
}

*/
