/*
  Rast-Red ESP32-CAM Stream Example
  Потоковое видео с ESP32-CAM для системы мониторинга
*/

#include "esp_camera.h"
#include <WiFi.h>
#include <esp_http_server.h>

// ===========================================
// 📷 Настройки пинов для ESP32-CAM AI-Thinker
// ===========================================
#define CAMERA_MODEL_AI_THINKER
#include "camera_pins.h"

// ===========================================
// 🌐 Настройки WiFi
// ===========================================
const char* ssid = "YOUR_WIFI_SSID";        // Ваше имя сети WiFi
const char* password = "YOUR_WIFI_PASSWORD";  // Ваш пароль WiFi

// ===========================================
// 🌐 Настройки веб-сервера
// ===========================================
#define PART_BOUNDARY "123456789000000000000987654321"
static const char* _STREAM_CONTENT_TYPE = "multipart/x-mixed-replace;boundary=" PART_BOUNDARY;
static const char* _STREAM_BOUNDARY = "\r\n--" PART_BOUNDARY "\r\n";
static const char* _STREAM_PART = "Content-Type: image/jpeg\r\nContent-Length: %u\r\n\r\n";

httpd_handle_t camera_httpd = NULL;

// ===========================================
// 📷 Настройка камеры
// ===========================================
void setupCamera() {
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
  config.pin_sscb_sda = SIOD_GPIO_NUM;
  config.pin_sscb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;
  
  // Настройки качества и размера
  config.frame_size = FRAMESIZE_SVGA;  // 800x600
  config.jpeg_quality = 12;            // Качество JPEG (0-63, чем меньше тем лучше)
  config.fb_count = 2;                 // Количество буферов кадров

  // Инициализация камеры
  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("❌ Ошибка инициализации камеры: 0x%x\n", err);
    return;
  }

  Serial.println("✅ Камера успешно инициализирована");
}

// ===========================================
// 🌐 Обработчик MJPEG потока
// ===========================================
static esp_err_t stream_handler(httpd_req_t *req) {
  camera_fb_t *fb = NULL;
  esp_err_t res = ESP_OK;
  size_t _jpg_buf_len = 0;
  uint8_t *_jpg_buf = NULL;
  char *part_buf[64];

  res = httpd_resp_set_type(req, _STREAM_CONTENT_TYPE);
  if (res != ESP_OK) {
    return res;
  }

  httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");
  httpd_resp_set_hdr(req, "Access-Control-Allow-Headers", "Content-Type");

  while (true) {
    fb = esp_camera_fb_get();
    if (!fb) {
      Serial.println("❌ Ошибка захвата кадра");
      res = ESP_FAIL;
    } else {
      if (fb->format != PIXFORMAT_JPEG) {
        bool jpeg_converted = frame2jpg(fb, 80, &_jpg_buf, &_jpg_buf_len);
        esp_camera_fb_return(fb);
        fb = NULL;
        if (!jpeg_converted) {
          Serial.println("❌ Ошибка конвертации JPEG");
          res = ESP_FAIL;
        }
      } else {
        _jpg_buf_len = fb->len;
        _jpg_buf = fb->buf;
      }
    }

    if (res == ESP_OK) {
      size_t hlen = snprintf((char *)part_buf, 64, _STREAM_PART, _jpg_buf_len);
      res = httpd_resp_send_chunk(req, (const char *)part_buf, hlen);
    }

    if (res == ESP_OK) {
      res = httpd_resp_send_chunk(req, (const char *)_jpg_buf, _jpg_buf_len);
    }

    if (res == ESP_OK) {
      res = httpd_resp_send_chunk(req, _STREAM_BOUNDARY, strlen(_STREAM_BOUNDARY));
    }

    if (fb) {
      esp_camera_fb_return(fb);
      fb = NULL;
      _jpg_buf = NULL;
    } else if (_jpg_buf) {
      free(_jpg_buf);
      _jpg_buf = NULL;
    }

    if (res != ESP_OK) {
      break;
    }
  }

  return res;
}

// ===========================================
// 🌐 Запуск веб-сервера
// ===========================================
void startCameraServer() {
  httpd_config_t config = HTTPD_DEFAULT_CONFIG();
  config.server_port = 80;
  config.ctrl_port = 80;

  httpd_uri_t index_uri = {
    .uri      = "/",
    .method   = HTTP_GET,
    .handler  = [](httpd_req_t *req) {
      const char* html = R"(
<!DOCTYPE html>
<html>
<head>
    <title>ESP32-CAM Stream</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .container { max-width: 800px; margin: 0 auto; }
        .stream { width: 100%; max-width: 640px; }
        .info { background: #f0f0f0; padding: 10px; margin: 10px 0; border-radius: 5px; }
        .status { color: green; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎥 ESP32-CAM Stream</h1>
        <div class="info">
            <p class="status">✅ Камера работает</p>
            <p><strong>URL потока:</strong> <code>http://%s:81/stream</code></p>
            <p><strong>URL для бэкенда:</strong> <code>http://%s:81/stream</code></p>
        </div>
        <img src="/stream" class="stream" alt="Camera Stream">
        <div class="info">
            <h3>📊 Информация:</h3>
            <ul>
                <li>Разрешение: 800x600 (SVGA)</li>
                <li>Формат: MJPEG</li>
                <li>Порт поток: 81</li>
                <li>Порт управления: 80</li>
            </ul>
        </div>
    </div>
</body>
</html>
      )";
      
      char response[1024];
      snprintf(response, sizeof(response), html, WiFi.localIP().toString().c_str(), WiFi.localIP().toString().c_str());
      
      httpd_resp_send(req, response, strlen(response));
      return ESP_OK;
    }
  };

  httpd_uri_t stream_uri = {
    .uri      = "/stream",
    .method   = HTTP_GET,
    .handler  = stream_handler,
  };

  if (httpd_start(&camera_httpd, &config) == ESP_OK) {
    httpd_register_uri_handler(camera_httpd, &index_uri);
    httpd_register_uri_handler(camera_httpd, &stream_uri);
    
    Serial.println("✅ Веб-сервер запущен");
    Serial.printf("📡 Главная страница: http://%s/\n", WiFi.localIP().toString().c_str());
    Serial.printf("🎥 Потоковое видео: http://%s/stream\n", WiFi.localIP().toString().c_str());
    Serial.printf("🔗 URL для бэкенда: http://%s:81/stream\n", WiFi.localIP().toString().c_str());
  }
}

// ===========================================
// 🌐 Подключение к WiFi
// ===========================================
void connectToWiFi() {
  Serial.printf("🔌 Подключение к WiFi: %s\n", ssid);
  
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(1000);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi подключен!");
    Serial.printf("📡 IP адрес: %s\n", WiFi.localIP().toString().c_str());
    Serial.printf("🌐 Сигнал: %d dBm\n", WiFi.RSSI());
  } else {
    Serial.println("\n❌ Ошибка подключения к WiFi!");
    Serial.println("🔄 Перезагрузка через 5 секунд...");
    delay(5000);
    ESP.restart();
  }
}

// ===========================================
// ⚙️ Настройка системы
// ===========================================
void setup() {
  Serial.begin(115200);
  Serial.setDebugOutput(true);
  Serial.println();
  
  Serial.println("🚀 Запуск Rast-Red ESP32-CAM...");
  Serial.println("================================");
  
  // Настройка камеры
  setupCamera();
  
  // Подключение к WiFi
  connectToWiFi();
  
  // Запуск веб-сервера
  startCameraServer();
  
  Serial.println("================================");
  Serial.println("✅ Система готова к работе!");
  Serial.println("📡 Система готова принимать подключения");
}

// ===========================================
// 🔄 Основной цикл
// ===========================================
void loop() {
  delay(1000);
  
  // Проверка статуса WiFi
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ Потеряно соединение WiFi!");
    Serial.println("🔄 Попытка переподключения...");
    connectToWiFi();
  }
  
  // Индикация работы (мигание светодиодом)
  static unsigned long lastBlink = 0;
  if (millis() - lastBlink > 2000) {
    digitalWrite(4, !digitalRead(4));  // Мигаем встроенным светодиодом
    lastBlink = millis();
  }
}
