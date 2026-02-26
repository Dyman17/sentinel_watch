#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include "esp_camera.h"

#define CAMERA_MODEL_AI_THINKER
#include "camera_pins.h"

// ===== WiFi =====
const char* ssid = "SENTINEL.SAT";
const char* password = "EspTest1234+";

// ===== SERVER =====
const char* serverUrl = "https://sentinel-sat.onrender.com/api/upload-frame";

// ===== SETTINGS =====
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
  Serial.print("IP: "); Serial.println(WiFi.localIP());
}

void setup() {
  Serial.begin(115200);
  Serial.println("ESP32-CAM START");

  // ===== CAMERA CONFIG =====
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer   = LEDC_TIMER_0;
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
  config.pin_href  = HREF_GPIO_NUM;
  config.pin_sccb_sda = SIOD_GPIO_NUM;
  config.pin_sccb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn  = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;

  config.pixel_format = PIXFORMAT_RGB565;
  config.frame_size   = FRAMESIZE_VGA; // 640x480
  config.fb_count     = 1;

  if (esp_camera_init(&config) != ESP_OK) {
    Serial.println("Camera init FAILED");
    return;
  }
  Serial.println("Camera OK");

  // Настройки сенсора для минимального шума
  sensor_t * s = esp_camera_sensor_get();
  s->set_gain_ctrl(s, 0);
  s->set_exposure_ctrl(s, 0);
  s->set_brightness(s, 1);
  s->set_contrast(s, 0);
  s->set_saturation(s, 1);
  s->set_sharpness(s, 0);
  s->set_whitebal(s, 1);

  connectWiFi();
  client.setInsecure();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) { connectWiFi(); }

  sendFrame(); // кадр отправляется сразу после предыдущего
}

void sendFrame() {
  camera_fb_t* fb = esp_camera_fb_get();
  if (!fb) { 
    Serial.println("Capture failed"); 
    return; 
  }

  uint8_t* jpgBuf = NULL;
  size_t jpgLen = 0;

  if (!frame2jpg(fb, 63, &jpgBuf, &jpgLen)) { // максимальное качество JPEG
    Serial.println("JPEG conversion failed");
    esp_camera_fb_return(fb);
    return;
  }

  http.begin(client, serverUrl);
  http.setTimeout(20000);
  http.addHeader("Content-Type", "image/jpeg");

  unsigned long t1 = millis();
  int httpCode = http.POST(jpgBuf, jpgLen);
  unsigned long t2 = millis();

  Serial.printf("HTTP CODE: %d | Upload time: %lu ms | JPG size: %d bytes\n", httpCode, t2 - t1, jpgLen);

  if (httpCode > 0) Serial.println(http.getString());
  else Serial.println(http.errorToString(httpCode));

  http.end();
  free(jpgBuf);
  esp_camera_fb_return(fb);
}