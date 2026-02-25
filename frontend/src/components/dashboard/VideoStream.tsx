import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Settings, Monitor, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface StreamFrame {
  image: string;
  metadata: {
    frame_number: number;
    timestamp: string;
    satellite_id: string;
  };
  shape: [number, number, number];
}

interface Detection {
  type: string;
  confidence: number;
  bbox: [number, number, number, number];
  center: [number, number];
  label: string;
  color: { r: number; g: number; b: number };
  pulse?: boolean;
  glow?: boolean;
}

interface OverlayData {
  bbox: {
    bboxes: Detection[];
    count: number;
  };
  heatmap?: any;
  scan_cone?: any;
  grid?: any;
  hud?: any;
}

interface StreamMessage {
  type: 'FRAME' | 'STREAM_STATS' | 'LOG';
  stream_id: string;
  satellite_id: string;
  timestamp: string;
  frame?: StreamFrame;
  detections: Detection[];
  overlays: OverlayData;
  stats?: {
    fps: number;
    frame_number: number;
    detection_count: number;
    tracking_count: number;
    processing_time: number;
  };
}

interface VideoStreamProps {
  streamId?: string;
  satelliteId?: string;
  className?: string;
}

export function VideoStream({ streamId = "STREAM-SAT-01", satelliteId = "SAT-01", className }: VideoStreamProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState<string | null>(null);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [overlays, setOverlays] = useState<OverlayData>({ bbox: { bboxes: [], count: 0 } });
  const [stats, setStats] = useState({
    fps: 0,
    frameNumber: 0,
    detectionCount: 0,
    trackingCount: 0,
    processingTime: 0
  });
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [showSettings, setShowSettings] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const animationFrameRef = useRef<number>();

  // Подключение к WebSocket
  const connectWebSocket = useCallback(() => {
    try {
      setConnectionStatus('connecting');
      
      const wsUrl = `ws://localhost:8000/api/v1/live`;
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setConnectionStatus('connected');
        wsRef.current = ws;
        
        // Запрашиваем кадр с ESP32
        requestFrame();
      };
      
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          // Обрабатываем разные типы сообщений
          if (message.type === 'FRAME' && message.stream_id === streamId) {
            if (message.frame && message.frame.image) {
              setCurrentFrame(message.frame.image);
            }
            
            if (message.detections) {
              setDetections(message.detections);
            }
            
            if (message.overlays) {
              setOverlays(message.overlays);
            }
            
            if (message.stats) {
              setStats({
                fps: message.stats.fps,
                frameNumber: message.stats.frame_number,
                detectionCount: message.stats.detection_count,
                trackingCount: message.stats.tracking_count,
                processingTime: message.stats.processing_time
              });
            }
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        setConnectionStatus('disconnected');
        wsRef.current = null;
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('error');
      };
      
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      setConnectionStatus('error');
    }
  }, [streamId]);

  // Запрос кадра с ESP32
  const requestFrame = useCallback(async () => {
    try {
      const response = await fetch(`/api/v1/esp32/streams/${streamId}/frame/base64`);
      const data = await response.json();
      
      if (data.status === 'ok' && data.image) {
        setCurrentFrame(data.image);
        
        // Обновляем статистику
        setStats(prev => ({
          ...prev,
          frameNumber: prev.frameNumber + 1,
          fps: 10 // TODO: реальный расчет
        }));
      }
    } catch (error) {
      console.error('Failed to get frame:', error);
    }
  }, [streamId]);

  // Отрисовка кадра с оверлеями
  const drawFrame = useCallback(() => {
    if (!canvasRef.current || !currentFrame) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Загружаем изображение
    const img = new Image();
    img.onload = () => {
      // Очищаем canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Рисуем основной кадр
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Рисуем детекции (bounding boxes)
      detections.forEach((detection) => {
        const { bbox, color, label, pulse, glow } = detection;
        const [x, y, w, h] = bbox;
        
        // Масштабируем координаты под размер canvas
        const scaleX = canvas.width / img.width;
        const scaleY = canvas.height / img.height;
        const scaledX = x * scaleX;
        const scaledY = y * scaleY;
        const scaledW = w * scaleX;
        const scaledH = h * scaleY;
        
        // Рисуем bounding box
        ctx.strokeStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
        ctx.lineWidth = 2;
        
        if (glow) {
          ctx.shadowColor = `rgb(${color.r}, ${color.g}, ${color.b})`;
          ctx.shadowBlur = 10;
        }
        
        ctx.strokeRect(scaledX, scaledY, scaledW, scaledH);
        
        // Сбрасываем тень
        ctx.shadowBlur = 0;
        
        // Рисуем метку
        ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
        ctx.fillRect(scaledX, scaledY - 25, label.length * 8 + 10, 25);
        
        ctx.fillStyle = 'white';
        ctx.font = '12px monospace';
        ctx.fillText(label, scaledX + 5, scaledY - 8);
        
        // Анимация пульсации
        if (pulse) {
          ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 0.3)`;
          ctx.lineWidth = 1;
          const pulseSize = Math.sin(Date.now() / 200) * 5 + 5;
          ctx.strokeRect(
            scaledX - pulseSize/2, 
            scaledY - pulseSize/2, 
            scaledW + pulseSize, 
            scaledH + pulseSize
          );
        }
      });
      
      // Рисуем HUD элементы
      drawHUD(ctx, canvas.width, canvas.height);
    };
    
    img.src = `data:image/jpeg;base64,${currentFrame}`;
  }, [currentFrame, detections]);

  // Отрисовка HUD
  const drawHUD = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Верхняя панель
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, width, 40);
    
    ctx.fillStyle = '#00ff00';
    ctx.font = '14px monospace';
    ctx.fillText(satelliteId, 10, 25);
    
    ctx.fillStyle = '#ffffff';
    ctx.fillText(new Date().toLocaleTimeString(), width - 150, 25);
    
    // Нижняя панель
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, height - 40, width, 40);
    
    ctx.fillStyle = '#ffff00';
    ctx.fillText(`DETECTIONS: ${detections.length}`, 10, height - 15);
    
    ctx.fillStyle = '#00ffff';
    ctx.fillText(`FPS: ${stats.fps}`, 200, height - 15);
    
    ctx.fillStyle = '#00ff00';
    ctx.fillText('LIVE', width - 60, height - 15);
    
    // Сетка
    ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)';
    ctx.lineWidth = 1;
    
    for (let x = 0; x < width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    for (let y = 0; y < height; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  };

  // Animation loop
  useEffect(() => {
    if (isPlaying && currentFrame) {
      const animate = () => {
        drawFrame();
        animationFrameRef.current = requestAnimationFrame(animate);
      };
      animate();
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, currentFrame, drawFrame]);

  // Периодический запрос кадров
  useEffect(() => {
    if (isPlaying && isConnected) {
      const interval = setInterval(() => {
        requestFrame();
      }, 100); // 10 FPS
      
      return () => clearInterval(interval);
    }
  }, [isPlaying, isConnected, requestFrame]);

  // Подключение при монтировании
  useEffect(() => {
    if (isPlaying) {
      connectWebSocket();
    }
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [isPlaying, connectWebSocket]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connecting':
        return <Wifi className="w-4 h-4 text-yellow-500 animate-pulse" />;
      case 'connected':
        return <Wifi className="w-4 h-4 text-green-500" />;
      case 'disconnected':
        return <WifiOff className="w-4 h-4 text-gray-500" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <WifiOff className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <Card className={`glass-panel ${className}`}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Monitor className="w-5 h-5 text-primary" />
            <div>
              <h3 className="font-semibold">{satelliteId}</h3>
              <p className="text-xs text-muted-foreground">Видеопоток в реальном времени</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {getConnectionIcon()}
            <Button
              variant="outline"
              size="sm"
              onClick={handlePlayPause}
              className="gap-2"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isPlaying ? 'Пауза' : 'Старт'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Video Canvas */}
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
          {!currentFrame && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Monitor className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">
                  {isPlaying ? 'Подключение к потоку...' : 'Нажмите Старт для начала'}
                </p>
              </div>
            </div>
          )}
          
          <canvas
            ref={canvasRef}
            width={640}
            height={480}
            className="w-full h-full object-contain"
          />
        </div>

        {/* Stats */}
        {isPlaying && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 grid grid-cols-4 gap-4"
          >
            <div className="text-center">
              <p className="text-2xs text-muted-foreground">FPS</p>
              <p className="font-mono text-sm font-semibold text-info">{stats.fps}</p>
            </div>
            <div className="text-center">
              <p className="text-2xs text-muted-foreground">Кадр</p>
              <p className="font-mono text-sm font-semibold">{stats.frameNumber}</p>
            </div>
            <div className="text-center">
              <p className="text-2xs text-muted-foreground">Детекции</p>
              <p className="font-mono text-sm font-semibold text-warning">{stats.detectionCount}</p>
            </div>
            <div className="text-center">
              <p className="text-2xs text-muted-foreground">Обработка</p>
              <p className="font-mono text-sm font-semibold text-success">{(stats.processingTime * 1000).toFixed(0)}мс</p>
            </div>
          </motion.div>
        )}

        {/* Detection List */}
        {detections.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4"
          >
            <h4 className="text-sm font-medium mb-2">Обнаруженные объекты:</h4>
            <div className="space-y-2">
              {detections.map((detection, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-background-panel/60 rounded"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: `rgb(${detection.color.r}, ${detection.color.g}, ${detection.color.b})` }}
                    />
                    <span className="text-sm">{detection.label}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {(detection.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </Card>
  );
}
