#include <WiFi.h>
#include <ArduinoJson.h>
#include <HTTPClient.h>
#include <LiquidCrystal_I2C.h>

// --- WiFi настройки ---
const char* ssid = "YOUR_WIFI_SSID";           // Твоя WiFi сеть
const char* password = "YOUR_WIFI_PASSWORD";     // Пароль WiFi

// --- HTTP сервер SENTINEL.SAT ---
const char* server_url = "https://sentinel-sat.onrender.com/api/latest";

// --- LCD настройки (опционально) ---
LiquidCrystal_I2C lcd(0x27, 16, 2);  // I2C адрес 0x27, 16x2 дисплей

// --- HTTP клиент ---
HTTPClient http;
WiFiClientSecure client;

// --- Настройки ---
#define POLL_INTERVAL 5000  // 5 секунд
unsigned long last_poll = 0;

// --- Данные логов ---
struct LogData {
  int disasters_found;
  String disaster_type;
  float confidence;
  int total_objects;
  String timestamp;
  String status;
};

LogData current_log = {0, "", 0.0, 0, "", "no_data"};

void setup() {
  Serial.begin(115200);
  Serial.println("🛰️ SENTINEL.SAT ESP32 Logger HTTP Starting...");
  
  // Инициализация LCD
  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.print("SENTINEL.SAT");
  lcd.setCursor(0, 1);
  lcd.print("Logger HTTP v1.0");
  
  delay(2000);
  
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
    
    // Настраиваем HTTPS клиент
    client.setInsecure(); // Отключаем проверку сертификата
    
  } else {
    Serial.println("\n❌ Failed to connect to WiFi");
    lcd.clear();
    lcd.print("WiFi Failed!");
    lcd.setCursor(0, 1);
    lcd.print("Check Settings");
  }
  
  Serial.println("🛰️ SENTINEL.SAT ESP32 Logger HTTP Ready!");
  Serial.print("🎯 Polling URL: ");
  Serial.println(server_url);
}

void loop() {
  // Опрашиваем сервер каждые 5 секунд
  if (millis() - last_poll >= POLL_INTERVAL) {
    pollServer();
    last_poll = millis();
  }
  
  // Обновляем дисплей
  updateDisplay();
  
  // Выводим статус каждые 30 секунд
  static unsigned long last_status = 0;
  if (millis() - last_status > 30000) {
    printStatus();
    last_status = millis();
  }
  
  delay(100);
}

void pollServer() {
  Serial.println("📡 Polling server...");
  
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ WiFi not connected");
    return;
  }
  
  // Отправляем GET запрос
  http.begin(client, server_url);
  http.addHeader("User-Agent", "SENTINEL.SAT-Logger/1.0");
  http.setTimeout(10000);  // 10 секунд таймаут
  
  int httpCode = http.GET();
  
  if (httpCode == 200) {
    String response = http.getString();
    Serial.println("✅ Server response received");
    Serial.println(response);
    
    // Парсим JSON
    parseLogResponse(response);
    
  } else {
    Serial.printf("❌ HTTP error: %d\n", httpCode);
    String error = http.errorToString(httpCode);
    Serial.println("Error: " + error);
    
    // Показываем ошибку на LCD
    lcd.clear();
    lcd.print("HTTP Error:");
    lcd.setCursor(0, 1);
    lcd.print(String(httpCode));
    delay(2000);
  }
  
  http.end();
}

void parseLogResponse(String response) {
  // Парсим JSON ответ
  DynamicJsonDocument doc(1024);
  DeserializationError error = deserializeJson(doc, response);
  
  if (error) {
    Serial.printf("❌ JSON parse error: %s\n", error.c_str());
    return;
  }
  
  // Извлекаем данные
  current_log.disasters_found = doc["disasters"] | 0;
  current_log.disaster_type = doc["type"] | "none";
  current_log.confidence = doc["confidence"] | 0.0;
  current_log.total_objects = doc["total_objects"] | 0;
  current_log.timestamp = doc["timestamp"] | "";
  current_log.status = doc["status"] | "error";
  
  Serial.printf("🚨 Disasters: %d, Type: %s, Confidence: %.2f\n", 
    current_log.disasters_found, current_log.disaster_type.c_str(), current_log.confidence);
  
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
  if (WiFi.status() == WL_CONNECTED) {
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

void printStatus() {
  Serial.println("=== Status ===");
  Serial.printf("WiFi: %s\n", WiFi.status() == WL_CONNECTED ? "Connected" : "Disconnected");
  Serial.printf("IP: %s\n", WiFi.localIP().toString().c_str());
  Serial.printf("Signal: %d dBm\n", WiFi.RSSI());
  Serial.printf("Free heap: %d bytes\n", ESP.getFreeHeap());
  Serial.printf("Last disasters: %d\n", current_log.disasters_found);
  Serial.printf("Last type: %s\n", current_log.disaster_type.c_str());
  Serial.printf("Server status: %s\n", current_log.status.c_str());
  Serial.println("==============");
}

// --- Функция для ручного запроса статуса ---
void requestStatus() {
  pollServer();
}

// --- Функция для сброса счетчиков ---
void resetCounters() {
  current_log.disasters_found = 0;
  current_log.disaster_type = "";
  current_log.confidence = 0.0;
  current_log.timestamp = "";
  current_log.status = "reset";
  updateDisplay();
}
