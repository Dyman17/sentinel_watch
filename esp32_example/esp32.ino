#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <ESP32Servo.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

#define SCREEN_WIDTH 128 
#define SCREEN_HEIGHT 64 
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);

const int ldrLeft = 34;   
const int ldrRight = 35;  
const int servoPin = 18;  
Servo myservo;

// ===== WIFI =====
const char* ssid = "SENTINEL.SAT";
const char* password = "EspTest1234+";

// ===== SERVER =====
const char* serverUrl = "https://sentinel-sat.onrender.com/api/esp32/log";

// ===== SERVO SETTINGS =====
int pos = 45;
int minAngle = 0;
int maxAngle = 90;
int tolerance = 150;
int speed = 8;

// ===== INTERNET SETTINGS =====
unsigned long lastRequest = 0;
unsigned long requestInterval = 2000; // каждые 2 секунды
String currentLog = "Waiting...";

void drawScreen() {
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(WHITE);
  display.setCursor(0,0);
  display.println(currentLog);
  display.display();
}

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

void fetchLog() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  http.begin(serverUrl);
  int httpCode = http.GET();

  if (httpCode == 200) {
    String payload = http.getString();
    Serial.println(payload);

    StaticJsonDocument<256> doc;
    DeserializationError error = deserializeJson(doc, payload);

    if (!error) {
      currentLog = doc["log"].as<String>();
    }
  } else {
    Serial.printf("HTTP error: %d\n", httpCode);
  }

  http.end();
}

void setup() {
  Serial.begin(115200);

  if(!display.begin(SSD1306_SWITCHCAPVCC, 0x3C))
    Serial.println("OLED error");

  ESP32PWM::allocateTimer(0);
  myservo.setPeriodHertz(50);    
  myservo.attach(servoPin, 500, 2400); 

  myservo.write(pos);
  delay(2000);

  connectWiFi();
  drawScreen();
}

void loop() {
  // ===== СЕРВО + ДАТЧИКИ =====
  int valLeft = analogRead(ldrLeft);
  int valRight = analogRead(ldrRight);

  if (abs(valLeft - valRight) > tolerance) {
    if (valLeft > valRight) {
      if (pos > minAngle) pos -= speed; 
    } 
    else {
      if (pos < maxAngle) pos += speed; 
    }
    myservo.write(pos);
  }

  // ===== ПИНГУЕМ СЕРВЕР =====
  if (millis() - lastRequest > requestInterval) {
    fetchLog();
    drawScreen();
    lastRequest = millis();
  }

  delay(15); // плавность серво
}