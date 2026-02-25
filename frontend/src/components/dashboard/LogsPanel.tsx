/**
 * 📋 Панель логов в реальном времени
 */

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { 
  Info, 
  Satellite, 
  Search, 
  AlertTriangle, 
  AlertCircle, 
  XCircle,
  X,
  Filter
} from "lucide-react";
import { useWebSocket } from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface LogEntry {
  id: string;
  level: "INFO" | "SCAN" | "DETECT" | "EVENT" | "ALERT" | "ERROR";
  message: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  event_type?: string;
  severity?: string;
  color: string;
  timestamp: string;
}

const levelConfig = {
  INFO: { icon: Info, color: "#64748B", bgColor: "#64748B20" },
  SCAN: { icon: Satellite, color: "#3B82F6", bgColor: "#3B82F620" },
  DETECT: { icon: Search, color: "#F59E0B", bgColor: "#F59E0B20" },
  EVENT: { icon: AlertTriangle, color: "#EF4444", bgColor: "#EF444420" },
  ALERT: { icon: AlertCircle, color: "#DC2626", bgColor: "#DC262620" },
  ERROR: { icon: XCircle, color: "#991B1B", bgColor: "#991B1B20" }
};

export function LogsPanel() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [filter, setFilter] = useState<string | null>(null);
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const { socket, isConnected } = useWebSocket();

  // WebSocket обработчик
  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === "LOG") {
          const newLog: LogEntry = {
            id: data.payload.id,
            level: data.payload.level,
            message: data.payload.message,
            region: data.payload.region,
            latitude: data.payload.latitude,
            longitude: data.payload.longitude,
            event_type: data.payload.event_type,
            severity: data.payload.severity,
            color: data.payload.color,
            timestamp: data.payload.timestamp
          };

          setLogs(prev => [newLog, ...prev].slice(0, 100)); // Максимум 100 логов
        }
      } catch (error) {
        console.error("Failed to parse log message:", error);
      }
    };

    socket.addEventListener("message", handleMessage);
    return () => socket.removeEventListener("message", handleMessage);
  }, [socket]);

  // Автоскролл
  useEffect(() => {
    if (isAutoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, isAutoScroll]);

  const filteredLogs = filter 
    ? logs.filter(log => log.level === filter)
    : logs;

  const clearLogs = () => setLogs([]);

  return (
    <motion.div
      initial={{ height: 60 }}
      animate={{ height: isExpanded ? 400 : 60 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="bg-background-secondary/80 backdrop-blur-xl border-t border-border/50 flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/30">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-2 h-2 rounded-full bg-success" />
              {isConnected && (
                <motion.div
                  className="absolute inset-0 rounded-full bg-success"
                  animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </div>
            <span className="text-sm font-display font-semibold uppercase tracking-wider">
              Event Feed
            </span>
          </div>
          <Badge variant="secondary" className="text-xs">
            {filteredLogs.length} logs
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter buttons */}
          <div className="flex items-center gap-1 mr-4">
            {Object.entries(levelConfig).map(([level, config]) => (
              <Button
                key={level}
                variant={filter === level ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilter(filter === level ? null : level)}
                className="h-6 px-2 text-xs"
                style={{
                  backgroundColor: filter === level ? config.color : undefined
                }}
              >
                <config.icon className="w-3 h-3" />
              </Button>
            ))}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAutoScroll(!isAutoScroll)}
            className={`text-xs ${isAutoScroll ? "text-primary" : "text-muted-foreground"}`}
          >
            Auto-scroll
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={clearLogs}
            className="text-xs text-muted-foreground"
          >
            Clear
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <X className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Logs content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 overflow-hidden"
          >
            <div className="h-full overflow-y-auto custom-scrollbar p-4 space-y-2">
              {filteredLogs.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <Filter className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No logs yet</p>
                    <p className="text-xs">Waiting for events...</p>
                  </div>
                </div>
              ) : (
                filteredLogs.map((log, index) => {
                  const config = levelConfig[log.level];
                  const Icon = config.icon;
                  
                  return (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-start gap-3 p-3 rounded-lg bg-background-panel/40 border border-border/20 hover:bg-background-panel/60 transition-colors"
                    >
                      {/* Icon */}
                      <div 
                        className="p-2 rounded-md flex-shrink-0"
                        style={{ backgroundColor: config.bgColor }}
                      >
                        <Icon 
                          className="w-4 h-4" 
                          style={{ color: config.color }}
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge 
                            variant="secondary" 
                            className="text-xs font-mono"
                            style={{ 
                              backgroundColor: config.bgColor,
                              color: config.color 
                            }}
                          >
                            {log.level}
                          </Badge>
                          {log.region && (
                            <Badge variant="outline" className="text-xs">
                              {log.region}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground font-mono">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm text-foreground break-words">
                          {log.message}
                        </p>
                        {log.event_type && (
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">Type:</span>
                            <Badge variant="outline" className="text-xs">
                              {log.event_type}
                            </Badge>
                            {log.severity && (
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${
                                  log.severity === "critical" ? "text-destructive border-destructive" :
                                  log.severity === "high" ? "text-warning border-warning" :
                                  log.severity === "medium" ? "text-info border-info" :
                                  "text-success border-success"
                                }`}
                              >
                                {log.severity}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Coordinates */}
                      {log.latitude && log.longitude && (
                        <div className="text-xs text-muted-foreground font-mono">
                          {log.latitude.toFixed(2)}°, {log.longitude.toFixed(2)}°
                        </div>
                      )}
                    </motion.div>
                  );
                })
              )}
              <div ref={logsEndRef} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
