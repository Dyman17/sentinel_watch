# 🧪 Quick Test - ESP32 Logging System

## Test 1: Backend is Working

### Check backend health:
```bash
curl https://sentinel-sat.onrender.com/api/health
```

### Send test log:
```bash
curl -X POST https://sentinel-sat.onrender.com/api/logs/esp32 \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "TEST-ESP32",
    "message": "This is a test log message",
    "level": "INFO"
  }'
```

Expected response:
```json
{
  "status": "success",
  "message": "Log received",
  "total_logs": 1
}
```

## Test 2: Retrieve Logs

### Get recent logs:
```bash
curl https://sentinel-sat.onrender.com/api/logs/esp32?limit=10
```

Expected response:
```json
{
  "status": "ok",
  "logs": [
    {
      "device_id": "TEST-ESP32",
      "level": "INFO",
      "message": "This is a test log message",
      "timestamp": 1708876543.123
    }
  ],
  "total_logs": 1,
  "timestamp": 1708876600.000
}
```

## Test 3: Frontend Display

### Visit the website:
1. Go to: https://sentinel-sat.onrender.com
2. Click "Логи" (Logs) button in top navigation
3. You should see:
   - 🔴 Red "No ESP32 Connection" status (unless ESP32 is connected)
   - Your test logs displayed below
   - Auto-refresh active
   - Manual refresh button works

## Test 4: Real ESP32

### Prerequisites:
- ESP32 with WiFi capability
- USB cable for programming
- Arduino IDE with ESP32 board support
- Required libraries installed:
  - WiFi
  - ArduinoJson
  - WebSockets
  - LiquidCrystal_I2C
  - HTTPClient

### Steps:
1. Update WiFi credentials in esp32.ino:
   ```cpp
   const char* ssid = "YOUR_NETWORK";
   const char* password = "YOUR_PASSWORD";
   ```

2. Upload to ESP32

3. Open Serial Monitor (115200 baud)

4. Watch for logs:
   ```
   🛰️ SENTINEL.SAT ESP32 Logger Starting...
   📡 Connecting to WiFi...
   ✅ WiFi connected!
   📡 IP address: 192.168.x.x
   ✅ Log sent: WiFi connected - IP: 192.168.x.x
   ```

5. Go to website Logs page → see logs appear in real-time!

## Test 5: Disaster Detection

### Send disaster alert:
```bash
curl -X POST https://sentinel-sat.onrender.com/api/logs/esp32 \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "ESP32-CAM-1",
    "message": "🚨 DISASTER DETECTED: fire (confidence: 92.5%)",
    "level": "ERROR"
  }'
```

### On website, you should see:
- Red background on log entry
- ❌ Icon
- Full alert details

## Expected Log Examples

### Startup:
```
device_id: ESP32-CAM-1
level: INFO
message: 🛰️ SENTINEL.SAT ESP32 Logger started - v1.0
```

### WiFi Connected:
```
device_id: ESP32-CAM-1
level: SUCCESS
message: WiFi connected - IP: 192.168.1.100
```

### WebSocket Connected:
```
device_id: ESP32-CAM-1
level: SUCCESS
message: WebSocket connected to SENTINEL.SAT server
```

### Status Update (every 30 seconds):
```
device_id: ESP32-CAM-1
level: INFO
message: Status - WiFi: OK, WS: OK, Heap: 125000B, Disasters: 0
```

### Disaster Alert:
```
device_id: ESP32-CAM-1
level: ERROR
message: 🚨 DISASTER DETECTED: fire (confidence: 92.3%)
```

## Troubleshooting Quick Guide

| Problem | Solution |
|---------|----------|
| No logs appearing | 1. Check backend: `/api/health` 2. Check WiFi on ESP32 |
| ESP32 won't connect to WiFi | Check SSID/password - same case sensitivity |
| Logs not visible on website | 1. Refresh page 2. Check browser console (F12) 3. Clear cache |
| HTTP 500 error from backend | Check backend logs on Render.com dashboard |
| Serial Monitor shows "Log send failed" | WiFi disconnected or backend unreachable |

## Performance Testing

### How many logs per minute?
- Startup: 2-3 logs
- WiFi events: 1-2 logs
- WebSocket events: 1-2 logs
- Status updates: 1 log per 30 seconds
- Disaster: 1 log + LCD alert

**Typical**: 2-3 logs per minute during normal operation

### Bandwidth per log:
- Message: ~200 bytes over HTTP
- JSON overhead: ~50 bytes
- Total: ~250 bytes per log

### Server impact:
- Backend: negligible (< 1 API call per second)
- Frontend: auto-refresh every 2 seconds (minimal)
- Storage: 200 logs × 1KB = 200KB max

## Next Steps

1. ✅ Test with curl commands above
2. ✅ Upload updated esp32.ino to real device
3. ✅ Monitor Serial output
4. ✅ Watch logs appear on website
5. ✅ Verify disaster alerts appear correctly
6. 📋 Consider database persistence for production

---

**Quick Links:**
- Backend Health: https://sentinel-sat.onrender.com/api/health
- Logs Page: https://sentinel-sat.onrender.com (then click Logs)
- Backend Logs: POST /api/logs/esp32, GET /api/logs/esp32

**Last Updated**: 2026-02-26
