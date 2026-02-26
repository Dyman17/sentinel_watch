# 📡 ESP32 Logging System - Complete Guide

## Overview

The SENTINEL.SAT system now includes a complete logging infrastructure that allows your ESP32 device to send logs to the backend, which are then displayed in real-time on the website's Logs page.

## Architecture

```
ESP32
  ├─ Serial Monitor (USB)
  ├─ LCD Display (16x2 I2C)
  └─ HTTP POST logs → Backend

Backend (FastAPI)
  ├─ POST /api/logs/esp32 (receives logs)
  ├─ GET /api/logs/esp32 (retrieves logs)
  └─ Storage (memory, max 200 logs)

Frontend (React)
  └─ Logs Page displays real-time ESP32 logs
```

## What's Implemented

### ✅ ESP32 Code (`esp32.ino`)

**New Function:**
```cpp
void sendLogToServer(String message, String level = "INFO")
```

Automatically sends logs in these situations:
- 🟢 **SUCCESS**: WiFi connected
- 🔴 **ERROR**: WiFi connection failed
- 🟢 **SUCCESS**: WebSocket connected
- 🟡 **WARNING**: WebSocket disconnected
- 🔴 **ERROR**: WebSocket error
- 🔴 **ERROR**: Disaster detected (with details)
- ℹ️ **INFO**: Status updates (every 30 seconds)

**Log Levels:**
- `INFO` - General information
- `SUCCESS` - Connection/operation successful
- `WARNING` - Warning or temporary issue
- `ERROR` - Error or disaster detection

### ✅ Backend Endpoints

**POST /api/logs/esp32**
```json
// Request
{
  "device_id": "ESP32-CAM-1",
  "message": "WiFi connected - IP: 192.168.1.100",
  "level": "SUCCESS"
}

// Response
{
  "status": "success",
  "message": "Log received",
  "total_logs": 42
}
```

**GET /api/logs/esp32?limit=50**
```json
{
  "status": "ok",
  "logs": [
    {
      "device_id": "ESP32-CAM-1",
      "level": "INFO",
      "message": "Status - WiFi: OK, WS: OK, Heap: 125000B, Disasters: 0",
      "timestamp": 1708876543.123
    },
    ...
  ],
  "total_logs": 127,
  "timestamp": 1708876600.000
}
```

### ✅ Frontend Component

**ESP32Logs.tsx** - New component displays:
- 🟢/🔴 Connection status
- Real-time log list with color-coding
- Auto-refresh every 2 seconds
- Manual refresh button
- Clear logs button
- Device ID and timestamp for each log
- Instructions for sending logs

## How to Use

### 1. **Connect Your ESP32**

Make sure the WiFi credentials in `esp32.ino` are correct:
```cpp
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
```

### 2. **Upload the Code**

The updated `esp32.ino` includes:
- ✅ HTTPClient library
- ✅ sendLogToServer() function
- ✅ Automatic logging at key events
- ✅ Disaster alert logging

### 3. **View Logs on Website**

1. Go to: https://sentinel-sat.onrender.com
2. Click "Логи" (Logs) button in navigation
3. You'll see:
   - Connection status (WiFi/Device)
   - Real-time log feed
   - Auto-refresh indicator
   - Device logs with timestamps

### 4. **Monitor via Serial (USB)**

Connect ESP32 via USB and open Arduino Serial Monitor at **115200 baud**:
```
🛰️ SENTINEL.SAT ESP32 Logger Starting...
📡 Connecting to WiFi...
✅ WiFi connected!
📡 IP address: 192.168.1.100
✅ Log sent: WiFi connected - IP: 192.168.1.100
🔌 Connecting to WebSocket...
🔌 WebSocket connected
✅ Log sent: WebSocket connected to SENTINEL.SAT server
=== Status ===
WiFi: Connected
WebSocket: Connected
Disasters: 0
Free heap: 125000 bytes
==============
✅ Log sent: Status - WiFi: OK, WS: OK, Heap: 125000B, Disasters: 0
```

## Custom Logging

You can also add custom logs anywhere in your ESP32 code:

```cpp
// In your loop() or any function:

// Simple log
sendLogToServer("Custom message", "INFO");

// Success log
sendLogToServer("Frame captured successfully", "SUCCESS");

// Warning log
sendLogToServer("WiFi signal weak (RSSI: -75)", "WARNING");

// Error log
sendLogToServer("Failed to read camera sensor", "ERROR");
```

## Example: Logging Frame Capture

If you have image capture code, add logging:

```cpp
void captureFrame() {
  Serial.println("📸 Capturing frame...");
  sendLogToServer("Capturing frame...", "INFO");

  // Your frame capture code
  bool success = camera_fb.capture();

  if (success) {
    sendLogToServer("Frame captured: " + String(camera_fb.len) + " bytes", "SUCCESS");
  } else {
    sendLogToServer("Failed to capture frame - camera error", "ERROR");
  }
}
```

## Log Storage

- **Backend**: Stores last 200 logs in memory
- **Frontend**: Displays last 100 logs (limit configurable)
- **Auto-cleanup**: Oldest logs automatically removed when limit reached
- **Retention**: Logs stay until server restart (use database for persistence)

## Troubleshooting

### Logs not appearing on website?

1. **Check WiFi connection:**
   - Verify SSID and password in esp32.ino
   - Check Serial Monitor for WiFi connection status
   - Look for "✅ WiFi connected!" message

2. **Check backend connectivity:**
   - Verify backend is running: https://sentinel-sat.onrender.com/api/health
   - Check for "HTTP" errors in Serial Monitor

3. **Check frontend:**
   - Clear browser cache (Ctrl+Shift+Del)
   - Check browser console for errors (F12)
   - Verify "Auto-refresh" is enabled

### "Failed to send log" message?

- **Reason 1**: WiFi disconnected - wait for reconnection
- **Reason 2**: Backend unreachable - check server status
- **Reason 3**: HTTPS certificate issue - rare, check ESP8266 certificate bundle

### Logs appearing but old?

- Check device timestamp is correct
- Verify time synchronization (NTP) if using timestamps

## Performance Considerations

- **HTTP POST requests**: ~500ms per log
- **Memory impact**: ~1KB per log entry
- **Bandwidth**: ~200 bytes per log (minimal)
- **Server load**: Negligible for typical logging

**Recommendation**: Send important logs (WiFi, WebSocket, Disasters), not every frame capture.

## Advanced: Database Persistence

For production, replace in-memory storage with SQLite or PostgreSQL:

```python
# In backend main.py (future enhancement)
from sqlalchemy import create_engine, Column, String, DateTime
from sqlalchemy.orm import sessionmaker

engine = create_engine('sqlite:///esp32_logs.db')
Session = sessionmaker(bind=engine)

@app.post("/api/logs/esp32")
async def receive_esp32_log(data: dict):
    session = Session()
    log = ESP32Log(
        device_id=data['device_id'],
        level=data['level'],
        message=data['message']
    )
    session.add(log)
    session.commit()
    return {"status": "success"}
```

## Next Steps

1. ✅ **Deploy updated code** to your ESP32
2. ✅ **Watch Serial Monitor** for logs
3. ✅ **View on Website** - Logs page
4. ✅ **Add Custom Logs** for your specific use cases
5. 📋 **Consider Database** for long-term storage

## Files Modified

- `backend/main.py` - Added `/api/logs/esp32` endpoints
- `frontend/src/components/dashboard/ESP32Logs.tsx` - New logs display component
- `frontend/src/pages/Index.tsx` - Integrated ESP32Logs into Logs page
- `esp32_example/esp32.ino` - Added sendLogToServer() function and logging

---

**Last Updated**: February 2026
**System**: SENTINEL.SAT v1.0
