#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include "esp_camera.h"

#define CAMERA_MODEL_AI_THINKER
#include "camera_pins.h"

// ===== WiFi =====
const char* ssid = "Dyman";
const char* password = "Dastan2020+";

// ===== SERVER =====
const char* serverUrl = "https://sentinel-sat.onrender.com/api/upload-frame";

// ===== SETTINGS =====
#define FRAME_INTERVAL 5000
unsigned long lastFrameTime = 0;

WiFiClientSecure client;
HTTPClient http;

void connectWiFi() {
  WiFi.begin(ssid, password);
  Serial.print("Connecting WiFi");

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi connected");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
}

void setup() {
  Serial.begin(115200);
  Serial.println("ESP32-CAM START");

  // ===== CAMERA CONFIG =====
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

  config.pin_sccb_sda = SIOD_GPIO_NUM;
  config.pin_sccb_scl = SIOC_GPIO_NUM;

  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;

  config.xclk_freq_hz = 20000000;

  // RGB565 режим
  config.pixel_format = PIXFORMAT_RGB565;

  // СТАБИЛЬНОЕ маленькое разрешение
  config.frame_size = FRAMESIZE_QQVGA; // 160x120
  config.fb_count = 1;

  if (esp_camera_init(&config) != ESP_OK) {
    Serial.println("Camera init FAILED");
    return;
  }

  Serial.println("Camera OK");

  connectWiFi();

  // отключаем проверку SSL (Render иначе не пустит)
  client.setInsecure();
}

void loop() {

  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  if (millis() - lastFrameTime > FRAME_INTERVAL) {
    sendFrame();
    lastFrameTime = millis();
  }
}

void sendFrame() {

  camera_fb_t* fb = esp_camera_fb_get();
  if (!fb) {
    Serial.println("Capture failed");
    return;
  }

  Serial.printf("Frame size: %d bytes\n", fb->len);

  http.begin(client, serverUrl);
  http.setTimeout(20000);

  http.addHeader("Content-Type", "application/octet-stream");
  http.addHeader("X-Width", String(fb->width));
  http.addHeader("X-Height", String(fb->height));
  http.addHeader("X-Format", "RGB565");

  int httpCode = http.POST(fb->buf, fb->len);

  Serial.print("HTTP CODE: ");
  Serial.println(httpCode);

  if (httpCode > 0) {
    String response = http.getString();
    Serial.println("SERVER RESPONSE:");
    Serial.println(response);
  } else {
    Serial.println("HTTP ERROR:");
    Serial.println(http.errorToString(httpCode));
  }

  http.end();
  esp_camera_fb_return(fb);
}