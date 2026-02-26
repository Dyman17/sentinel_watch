#include <WiFi.h>
#include <ArduinoJson.h>
#include <WebSocketsClient.h>
#include <SocketIOclient.h>
#include <ArduinoJson.h>
#include <LiquidCrystal_I2C.h>
#include <HTTPClient.h>

// --- WiFi настройки ---
const char* ssid = "BB";           // Твоя WiFi сеть
const char* password = "Student111";     // Пароль WiFi

// --- WebSocket сервер SENTINEL.SAT ---
const char* ws_server = "sentinel-sat.onrender.com";  // Без http://
const int ws_port = 443;  // HTTPS порт
const char* ws_path = "/ws/logs";

// --- LCD настройки (опционально) ---
LiquidCrystal_I2C lcd(0x27, 16, 2);  // I2C адрес 0x27, 16x2 дисплей

// --- WebSocket клиент ---
WebSocketsClient webSocket;

// --- Статусы ---
unsigned long last_reconnect_attempt = 0;
unsigned long last_ping_time = 0;
unsigned long last_display_update = 0;
bool connected = false;

// --- Данные логов ---
struct LogData {
  int disasters_found;
  String disaster_type;
  float confidence;
  int total_objects;
  String timestamp;
};

LogData current_log = {0, "", 0.0, 0, ""};

void setup() {
  Serial.begin(115200);
  Serial.println("🛰️ SENTINEL.SAT ESP32 Logger Starting...");

  // Инициализация LCD
  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.print("SENTINEL.SAT");
  lcd.setCursor(0, 1);
  lcd.print("Logger v1.0");

  delay(2000);

  // Подождём перед попыткой отправки логов
  delay(3000);
  sendLogToServer("🛰️ SENTINEL.SAT ESP32 Logger started - v1.0", "INFO");
  
  // Подключаемся к WiFi
  WiFi.begin(ssid, password);
  Serial.print("📡 Connecting to WiFi...");
  lcd.clear();
  lcd.print("Connecting WiFi");
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(1000);
    Serial.print(".");
    lcd.print(".");
    attempts++;
    
    if (attempts % 4 == 0) {
      lcd.clear();
      lcd.print("Connecting WiFi");
      lcd.setCursor(0, 1);
      lcd.print("Attempt ");
      lcd.print(attempts / 4 + 1);
    }
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi connected!");
    Serial.print("📡 IP address: ");
    Serial.println(WiFi.localIP());

    lcd.clear();
    lcd.print("WiFi Connected");
    lcd.setCursor(0, 1);
    lcd.print(WiFi.localIP());

    // Отправляем лог на сервер
    delay(1000);
    sendLogToServer("WiFi connected - IP: " + WiFi.localIP().toString(), "SUCCESS");

    // Настраиваем WebSocket
    setupWebSocket();
  } else {
    Serial.println("\n❌ Failed to connect to WiFi");
    lcd.clear();
    lcd.print("WiFi Failed!");
    lcd.setCursor(0, 1);
    lcd.print("Check Settings");

    // Отправляем лог на сервер (потом, когда будет WiFi)
    sendLogToServer("Failed to connect to WiFi after 30 attempts", "ERROR");
  }
  
  Serial.println("🛰️ SENTINEL.SAT ESP32 Logger Ready!");
}

void setupWebSocket() {
  // Настраиваем WebSocket события
  webSocket.onEvent(webSocketEvent);
  
  // Подключаемся к WebSocket серверу
  Serial.print("🔌 Connecting to WebSocket...");
  lcd.clear();
  lcd.print("Connecting WS");
  
  // Для HTTPS используем wss://
  String ws_url = "wss://" + String(ws_server) + ws_path;
  webSocket.beginSSL(ws_server, ws_port, ws_path, "", "");
  
  webSocket.setReconnectInterval(5000);  // Переподключение каждые 5 секунд
}

void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  switch (type) {
    case WStype_DISCONNECTED:
      Serial.println("🔌 WebSocket disconnected");
      connected = false;
      sendLogToServer("WebSocket disconnected, attempting to reconnect", "WARNING");
      lcd.clear();
      lcd.print("WS Disconnected");
      lcd.setCursor(0, 1);
      lcd.print("Reconnecting...");
      // Бесконечный цикл удален - reconnect handled by webSocket.setReconnectInterval()
      break;

    case WStype_CONNECTED:
      Serial.println("🔌 WebSocket connected");
      connected = true;
      sendLogToServer("WebSocket connected to SENTINEL.SAT server", "SUCCESS");
      lcd.clear();
      lcd.print("WS Connected");
      lcd.setCursor(0, 1);
      lcd.print("Waiting logs...");
      break;

    case WStype_TEXT:
      Serial.printf("📨 Received: %s\n", payload);
      processLogMessage((char*)payload);
      break;

    case WStype_BIN:
      Serial.println("📨 Binary message received");
      break;

    case WStype_ERROR:
      Serial.println("❌ WebSocket error");
      sendLogToServer("WebSocket error occurred", "ERROR");
      break;

    default:
      break;
  }
}

void processLogMessage(char* payload) {
  // Парсим JSON сообщение
  DynamicJsonDocument doc(1024);
  DeserializationError error = deserializeJson(doc, payload);

  if (error) {
    Serial.printf("❌ JSON parse error: %s\n", error.c_str());
    sendLogToServer("JSON parse error received from server", "WARNING");
    return;
  }

  // Извлекаем данные
  current_log.disasters_found = doc["disasters_found"] | 0;
  current_log.total_objects = doc["total_objects"] | 0;
  current_log.confidence = doc["confidence"] | 0.0;
  current_log.disaster_type = doc["disaster_type"] | "";
  current_log.timestamp = doc["timestamp"] | "";

  Serial.printf("🚨 Disasters: %d, Objects: %d, Type: %s\n",
    current_log.disasters_found, current_log.total_objects, current_log.disaster_type.c_str());

  // Обновляем LCD
  updateDisplay();

  // Если найдены катастрофы - выводим сигнал
  if (current_log.disasters_found > 0) {
    alertDisaster();
  }
}

void updateDisplay() {
  static unsigned long last_update = 0;
  if (millis() - last_update < 2000) return;  // Обновляем каждые 2 секунды
  last_update = millis();
  
  lcd.clear();
  
  // Первая строка - статус
  if (connected) {
    lcd.print("🟢 SENTINEL.SAT");
  } else {
    lcd.print("🔴 No Connection");
  }
  
  // Вторая строка - данные
  lcd.setCursor(0, 1);
  if (current_log.disasters_found > 0) {
    lcd.print("🚨 ");
    lcd.print(current_log.disasters_found);
    lcd.print(" ");
    lcd.print(current_log.disaster_type.substring(0, 6));  // Обрезаем длинные названия
  } else {
    lcd.print("✅ No Disasters");
  }
}

void alertDisaster() {
  Serial.println("🚨🚨🚨 DISASTER ALERT! 🚨🚨🚨");

  // Отправляем лог на сервер
  String logMsg = "🚨 DISASTER DETECTED: " + current_log.disaster_type +
                  " (confidence: " + String(current_log.confidence * 100, 1) + "%)";
  sendLogToServer(logMsg, "ERROR");

  // Мигаем LCD подсветкой
  for (int i = 0; i < 5; i++) {
    lcd.noBacklight();
    delay(200);
    lcd.backlight();
    delay(200);
  }

  // Показываем детекцию
  lcd.clear();
  lcd.print("🚨 DISASTER!");
  lcd.setCursor(0, 1);
  lcd.print(current_log.disaster_type);
  delay(3000);
}

void loop() {
  // Обрабатываем WebSocket
  webSocket.loop();
  
  // Периодическое обновление дисплея
  if (millis() - last_display_update > 5000) {
    updateDisplay();
    last_display_update = millis();
  }
  
  // Выводим статус каждые 30 секунд
  static unsigned long last_status = 0;
  if (millis() - last_status > 30000) {
    Serial.println("=== Status ===");
    Serial.printf("WiFi: %s\n", WiFi.status() == WL_CONNECTED ? "Connected" : "Disconnected");
    Serial.printf("WebSocket: %s\n", connected ? "Connected" : "Disconnected");
    Serial.printf("Disasters: %d\n", current_log.disasters_found);
    Serial.printf("Free heap: %d bytes\n", ESP.getFreeHeap());
    Serial.println("==============");

    // Отправляем статус лог на сервер
    String statusMsg = "Status - WiFi: " +
                       String(WiFi.status() == WL_CONNECTED ? "OK" : "FAIL") +
                       ", WS: " +
                       String(connected ? "OK" : "FAIL") +
                       ", Heap: " +
                       String(ESP.getFreeHeap()) +
                       "B, Disasters: " +
                       String(current_log.disasters_found);
    sendLogToServer(statusMsg, "INFO");

    last_status = millis();
  }
  
  delay(100);
}

// --- Функция для ручного запроса статуса ---
void requestStatus() {
  if (connected) {
    webSocket.sendTXT("status");
  }
}

// --- Функция для сброса счетчиков ---
void resetCounters() {
  current_log.disasters_found = 0;
  current_log.total_objects = 0;
  current_log.disaster_type = "";
  current_log.confidence = 0.0;
  updateDisplay();
}

// --- Функция для отправки логов на сервер ---
void sendLogToServer(String message, String level = "INFO") {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;

    // URL бэкенда
    String url = "https://sentinel-sat.onrender.com/api/logs/esp32";

    // Создаём JSON
    DynamicJsonDocument doc(256);
    doc["message"] = message;
    doc["level"] = level;
    doc["device_id"] = "ESP32-CAM-1";

    String json;
    serializeJson(doc, json);

    http.begin(url);
    http.addHeader("Content-Type", "application/json");

    int httpCode = http.POST(json);

    if (httpCode == 200) {
      Serial.printf("✅ Log sent: %s\n", message.c_str());
    } else {
      Serial.printf("❌ Log send failed (HTTP %d): %s\n", httpCode, message.c_str());
    }

    http.end();
  } else {
    Serial.println("❌ WiFi not connected, log not sent");
  }
}
