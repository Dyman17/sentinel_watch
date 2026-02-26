import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Info, AlertCircle, CheckCircle, Wifi, WifiOff, RefreshCw } from "lucide-react"

interface LogEntry {
  device_id: string
  level: "INFO" | "WARNING" | "ERROR" | "SUCCESS"
  message: string
  timestamp: number
}

const levelConfig = {
  INFO: {
    icon: Info,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200"
  },
  SUCCESS: {
    icon: CheckCircle,
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200"
  },
  WARNING: {
    icon: AlertTriangle,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200"
  },
  ERROR: {
    icon: AlertCircle,
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200"
  },
}

const ESP32Logs = () => {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchLogs = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/logs/esp32?limit=100')
      const data = await response.json()

      if (data.status === 'ok') {
        setLogs(data.logs)
        setIsConnected(true)
      } else {
        setIsConnected(false)
      }
    } catch (error) {
      console.error('Failed to fetch ESP32 logs:', error)
      setIsConnected(false)
    } finally {
      setIsLoading(false)
    }
  }

  // Initial fetch and auto-refresh
  useEffect(() => {
    fetchLogs()

    if (autoRefresh) {
      const interval = setInterval(fetchLogs, 2000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const clearLogs = () => {
    setLogs([])
  }

  return (
    <div className="space-y-4">
      {/* Status Panel */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isConnected ? (
                <>
                  <Wifi className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-700">ESP32 Connected</p>
                    <p className="text-sm text-green-600">{logs.length} logs received</p>
                  </div>
                </>
              ) : (
                <>
                  <WifiOff className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-semibold text-gray-700">No ESP32 Connection</p>
                    <p className="text-sm text-gray-600">Waiting for device logs...</p>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchLogs}
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant={autoRefresh ? "default" : "outline"}
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                {autoRefresh ? "Auto" : "Manual"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Display */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>📡 ESP32 Device Logs</CardTitle>
          <div className="flex gap-2">
            <Badge>{logs.length} logs</Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearLogs}
              className="text-xs"
            >
              Clear
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-12">
              <WifiOff className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-muted-foreground mb-2">No logs yet</p>
              <p className="text-sm text-gray-500">
                Connect your ESP32 and it will start sending logs here
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {logs.map((log, idx) => {
                const config = levelConfig[log.level]
                const Icon = config.icon

                return (
                  <div
                    key={idx}
                    className={`flex gap-3 p-3 rounded-lg border ${config.bgColor} ${config.borderColor}`}
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 ${config.color}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {log.device_id}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {log.level}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.timestamp * 1000).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm break-words">{log.message}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-6">
          <h4 className="font-semibold text-amber-900 mb-2">📝 How to send logs from ESP32:</h4>
          <pre className="text-xs bg-white p-2 rounded overflow-x-auto border border-amber-200">
{`// Send log via HTTP POST
void sendLog(String message, String level) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin("https://sentinel-sat.onrender.com/api/logs/esp32");
    http.addHeader("Content-Type", "application/json");

    String json = "{";
    json += "\\"device_id\\":\\"ESP32-1\\",";
    json += "\\"message\\":\\"" + message + "\\",";
    json += "\\"level\\":\\"" + level + "\\"";
    json += "}";

    int code = http.POST(json);
    http.end();
  }
}

// In your code:
sendLog("WiFi connected!", "SUCCESS");
sendLog("Frame captured", "INFO");
sendLog("Disaster detected!", "WARNING");`}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}

export default ESP32Logs
