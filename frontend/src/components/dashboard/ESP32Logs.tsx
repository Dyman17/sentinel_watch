import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface LogEntry {
  device_id: string
  level: string
  message: string
  timestamp: number
}

const getLevelColor = (level: string) => {
  switch (level?.toUpperCase()) {
    case 'ERROR': return 'bg-red-50 border-red-200'
    case 'WARNING': return 'bg-yellow-50 border-yellow-200'
    case 'SUCCESS': return 'bg-green-50 border-green-200'
    default: return 'bg-blue-50 border-blue-200'
  }
}

const ESP32Logs = () => {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchLogs = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/logs/esp32?limit=50')
      if (!response.ok) throw new Error('Failed to fetch')
      const data = await response.json()
      if (data.logs) {
        setLogs(data.logs || [])
      }
    } catch (error) {
      console.error('Fetch error:', error)
      setLogs([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
    if (autoRefresh) {
      const interval = setInterval(fetchLogs, 3000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>📡 ESP32 Logs</CardTitle>
          <div className="flex gap-2">
            <Badge>{logs.length} logs</Badge>
            <Button variant="outline" size="sm" onClick={fetchLogs} disabled={isLoading}>
              Refresh
            </Button>
            <Button
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? 'Auto' : 'Manual'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No logs yet - connect your ESP32</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {logs.map((log, i) => (
                <div key={i} className={`p-3 rounded border ${getLevelColor(log.level)}`}>
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <div className="flex gap-2">
                      <span className="text-xs font-mono bg-white px-2 py-1 rounded">{log.device_id}</span>
                      <span className="text-xs font-mono bg-white px-2 py-1 rounded">{log.level}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(log.timestamp * 1000).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm">{log.message}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default ESP32Logs
