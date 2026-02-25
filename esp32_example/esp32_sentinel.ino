#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>

// --- WiFi настройки ---
const char* ssid = "BB";           // Твоя WiFi сеть
const char* password = "Student111";     // Пароль WiFi

// --- URL сервера SENTINEL.SAT ---
const char* serverUrl = "https://sentinel-sat.onrender.com/api/upload-frame";

// --- Настройки камеры ---
#define CAMERA_MODEL_AI_THINKER
#include "esp_camera.h"
#include "camera_pins.h"

// --- Интервал отправки кадров (мс) ---
#define FRAME_INTERVAL 250  // 0.25 секунды
unsigned long lastFrameTime = 0;

// --- WiFi клиент ---
HTTPClient http;
WiFiClientSecure client;

void setup() {
  Serial.begin(115200);
  Serial.println("🚀 SENTINEL.SAT ESP32 Starting...");
  
  // Настраиваем камеру
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sscb = SSCB_GPIO_NUM;
  config.pin_sccb_sda = SIOD_GPIO_NUM;
  config.pin_sccb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;
  
  // Разрешение (можно изменить)
  config.frame_size = FRAMESIZE_SVGA;  // 800x600
  config.jpeg_quality = 12;  // Качество JPEG (0-63, чем меньше тем лучше)
  config.fb_count = 2;

  // Инициализация камеры
  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("❌ Camera init failed with error 0x%x", err);
    return;
  }
  
  Serial.println("✅ Camera initialized successfully");

  // Подключаемся к WiFi
  WiFi.begin(ssid, password);
  Serial.print("📡 Connecting to WiFi...");
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(1000);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi connected!");
    Serial.print("📡 IP address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n❌ Failed to connect to WiFi");
    return;
  }

  // Настраиваем HTTPS клиент (для Render)
  client.setInsecure(); // Отключаем проверку сертификата для простоты
  
  Serial.println("🛰️ SENTINEL.SAT ESP32 Ready!");
  Serial.print("🎯 Sending frames to: ");
  Serial.println(serverUrl);
}

void loop() {
  unsigned long currentTime = millis();
  
  // Отправляем кадр каждые 5 секунд
  if (currentTime - lastFrameTime >= FRAME_INTERVAL) {
    sendFrameToServer();
    lastFrameTime = currentTime;
  }
  
  delay(100);
}

void sendFrameToServer() {
  Serial.println("📸 Capturing frame...");
  
  // Получаем кадр
  camera_fb_t* fb = esp_camera_fb_get();
  if (!fb) {
    Serial.println("❌ Camera capture failed");
    return;
  }
  
  Serial.printf("📸 Frame captured: %d bytes\n", fb->len);
  
  // Отправляем на сервер
  if (WiFi.status() == WL_CONNECTED) {
    http.begin(client, serverUrl);
    http.addHeader("Content-Type", "image/jpeg");
    http.addHeader("User-Agent", "SENTINEL.SAT-ESP32/1.0");
    
    Serial.print("📡 Sending frame to server...");
    
    int httpCode = http.POST(fb->buf, fb->len);
    
    if (httpCode > 0) {
      Serial.printf("✅ Frame sent successfully! HTTP %d\n", httpCode);
      
      // Читаем ответ сервера
      String response = http.getString();
      Serial.println("🤖 Server response:");
      Serial.println(response);
      
      // Парсим JSON ответ (опционально)
      DynamicJsonDocument doc(1024);
      DeserializationError error = deserializeJson(doc, response);
      
      if (!error) {
        if (doc.containsKey("hf_result")) {
          JsonObject hfResult = doc["hf_result"];
          if (hfResult.containsKey("disasters_found")) {
            int disasters = hfResult["disasters_found"];
            if (disasters > 0) {
              Serial.printf("🚨 DISASTER DETECTED! %d disasters found\n", disasters);
            }
          }
        }
      }
      
    } else {
      Serial.printf("❌ Error sending frame. HTTP %d\n", httpCode);
      String error = http.errorToString(httpCode);
      Serial.println("Error: " + error);
    }
    
    http.end();
  } else {
    Serial.println("❌ WiFi not connected");
  }
  
  // Освобождаем буфер кадра
  esp_camera_fb_return(fb);
  
  Serial.println("✅ Frame processing complete");
}

// --- Функция для отладки статуса ---
void printStatus() {
  Serial.println("\n=== SENTINEL.SAT Status ===");
  Serial.print("WiFi: ");
  Serial.println(WiFi.status() == WL_CONNECTED ? "Connected" : "Disconnected");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
  Serial.print("Signal: ");
  Serial.print(WiFi.RSSI());
  Serial.println(" dBm");
  Serial.print("Free heap: ");
  Serial.print(ESP.getFreeHeap());
  Serial.println(" bytes");
  Serial.println("========================");
}
