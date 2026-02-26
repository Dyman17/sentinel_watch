import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Camera,
  Satellite,
  Settings,
  Activity,
  Clock
} from "lucide-react";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";
import "@tensorflow/tfjs-backend-cpu";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import apiClient from "@/lib/api";
import { NASAMap } from "./NASAMap";

// Particle Background Component
const ParticleBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
    }> = [];
    
    // Create particles
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 3 + 1,
        opacity: Math.random() * 0.5 + 0.2
      });
    }
    
    let animationId: number;
    
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;
        
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 107, 53, ${particle.opacity})`;
        ctx.fill();
      });
      
      animationId = requestAnimationFrame(animate);
    };
    
    animate();
    
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full pointer-events-none z-0"
      style={{ background: 'transparent' }}
    />
  );
};

interface LogEntry {
  short_log: string;
  full_log: {
    event: string;
    source: string;
    confidence: number;
    timestamp: string;
    detections: any[];
    region: string;
  };
  timestamp: string;
  source: string;
}

interface LatestResult {
  short_log: string;
  full_log: any;
  timestamp: string;
  source: string;
  analysis: any;
}

export const SimpleStream = () => {
  const [currentSource, setCurrentSource] = useState<'esp' | 'nasa'>('esp');
  const [streamUrl, setStreamUrl] = useState(`${import.meta.env.VITE_API_BASE_URL || ''}/api/stream`);
  const [latestResult, setLatestResult] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Таймер анализа (10 сек для HF модели)
  const [latencyMs, setLatencyMs] = useState(10000);
  const [frameTimestamp, setFrameTimestamp] = useState<number | null>(null);

  // Client-side YOLO detection
  const videoRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [model, setModel] = useState<cocoSsd.ObjectDetection | null>(null);
  const [clientDetections, setClientDetections] = useState<any[]>([]);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [modelLoading, setModelLoading] = useState(true);

  // API base URL from environment
  const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

  // Fetch latest analysis result
  const fetchLatest = async () => {
    try {
      setError(null);
      const response = await fetch(`${API_BASE}/api/latest`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setLatestResult(data);
    } catch (error) {
      console.error('Error fetching latest:', error);
      setError('Failed to fetch latest analysis');
    }
  };

  // Fetch logs history
  const fetchLogs = async () => {
    try {
      setError(null);
      const response = await fetch(`${API_BASE}/api/logs?limit=20`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setLogs(data.logs || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
      setError('Failed to fetch logs');
    }
  };

  // Switch data source
  const switchSource = async (source: 'esp' | 'nasa') => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE}/api/switch/${source}`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      setCurrentSource(source);
      setStreamUrl(source === 'esp' ? `${API_BASE}/stream` : 'https://picsum.photos/200/300');
      // Clear current data when switching
      setLatestResult(null);
      setLogs([]);
      
      // Fetch new data after switching
      await fetchLatest();
      await fetchLogs();
      
    } catch (error) {
      console.error('Error switching source:', error);
      setError('Failed to switch source');
    } finally {
      setIsLoading(false);
    }
  };

  // Таймер анализа (обновляется каждые 100мс)
  // Отсчитывает 10 секунд пока идет анализ HF модели
  useEffect(() => {
    const timer = setInterval(() => {
      if (frameTimestamp) {
        const elapsed = Date.now() - frameTimestamp;
        setLatencyMs(Math.max(0, 10000 - elapsed)); // 10 сек макс для HF анализа
      }
    }, 100);

    return () => clearInterval(timer);
  }, [frameTimestamp]);

  // Load COCO-SSD model on mount
  useEffect(() => {
    const loadModel = async () => {
      try {
        console.log('🚀 Initializing TensorFlow.js...');

        // Explicitly set backend (try WebGL first, fallback to CPU)
        try {
          await tf.setBackend('webgl');
          console.log('✅ Using WebGL backend');
        } catch (e) {
          console.warn('⚠️ WebGL not available, using CPU backend');
          await tf.setBackend('cpu');
        }

        console.log('📥 Loading COCO-SSD model...');
        const loadedModel = await cocoSsd.load();
        setModel(loadedModel);
        setModelLoading(false);
        console.log('✅ COCO-SSD model loaded successfully');
      } catch (error) {
        console.error('❌ Failed to load COCO-SSD model:', error);
        setModelLoading(false);
      }
    };
    loadModel();
  }, []);

  // Detection function
  const detectObjects = async () => {
    if (!model || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      // Match canvas size to video
      canvas.width = video.naturalWidth || video.width;
      canvas.height = video.naturalHeight || video.height;

      // Run detection
      const predictions = await model.detect(video);

      // Clear previous drawings
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw bounding boxes
      predictions.forEach(prediction => {
        const [x, y, width, height] = prediction.bbox;

        // Draw box
        ctx.strokeStyle = '#00ff00'; // Green
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, width, height);

        // Draw label background
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(x, y - 25, width, 25);

        // Draw label text
        ctx.fillStyle = '#000000';
        ctx.font = '16px Arial';
        ctx.fillText(
          `${prediction.class} ${Math.round(prediction.score * 100)}%`,
          x + 5,
          y - 7
        );
      });

      // Store detections
      setClientDetections(predictions);

      // Send to backend if detections found
      if (predictions.length > 0) {
        sendClientDetections(predictions);
      }
    } catch (error) {
      console.error('Detection error:', error);
    }
  };

  // Send client detections to backend
  const sendClientDetections = async (predictions: any[]) => {
    try {
      await apiClient.sendClientDetections(predictions);
    } catch (error) {
      console.error('Failed to send client detections:', error);
    }
  };

  // Continuous detection loop (every 500ms for ~2 FPS)
  useEffect(() => {
    if (!model) return;

    detectionIntervalRef.current = setInterval(() => {
      detectObjects();
    }, 500);

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, [model]);

  // Auto-refresh data
  useEffect(() => {
    fetchLatest();
    fetchLogs();

    const interval = setInterval(() => {
      fetchLatest();
      fetchLogs();
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [currentSource]);

  // Update stream URL based on source
  useEffect(() => {
    setStreamUrl(`${API_BASE}/api/stream`);
  }, [currentSource]);

  const getEventColor = (event: string) => {
    const colors = {
      fire: '#ef4444',
      person: '#3b82f6',
      car: '#10b981',
      dog: '#f59e0b',
      none: '#6b7280'
    };
    return colors[event as keyof typeof colors] || '#6b7280';
  };

  return (
    <div className="relative min-h-screen w-full">
      <ParticleBackground />
      <div className="relative z-10 space-y-6 px-8 py-6 min-h-screen w-full">
        {/* Control Panel */}
        <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {currentSource === 'esp' ? (
                <Camera className="w-5 h-5" />
              ) : (
                <Satellite className="w-5 h-5" />
              )}
              Система мониторинга
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Source Switch */}
          <div className="flex items-center justify-between">
            <Label htmlFor="source-toggle" className="text-base">Источник данных</Label>
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4" />
              <Switch
                id="source-toggle"
                checked={currentSource === 'nasa'}
                onCheckedChange={(checked) => switchSource(checked ? 'nasa' : 'esp')}
                disabled={isLoading}
              />
              <Satellite className="w-4 h-4" />
              {isLoading && <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>}
            </div>
          </div>

          <div className="flex items-center gap-2 text-base text-muted-foreground">
            <Activity className="w-4 h-4" />
            Текущий: <span className="font-medium">{currentSource === 'esp' ? 'ESP32 Камера' : 'NASA Спутник'}</span>
            {isLoading && <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>}
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-destructive/20 border border-destructive/30 rounded-lg">
              <div className="flex items-center gap-2 text-destructive">
                <Activity className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          {/* Latest Status */}
          {latestResult && (
            <div className="p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-base font-medium">Последний анализ:</span>
                <Badge 
                  variant="secondary"
                  style={{ backgroundColor: getEventColor(latestResult.full_log?.event || 'none') + '20' }}
                >
                  {latestResult.short_log}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                {new Date(latestResult.timestamp).toLocaleString('ru-RU')}
              </div>
            </div>
          )}

          {showSettings && (
            <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
              <div className="space-y-2">
                <Label className="text-base">URL потока:</Label>
                <input
                  type="text"
                  value={streamUrl}
                  onChange={(e) => setStreamUrl(e.target.value)}
                  className="w-full px-3 py-2 text-base border rounded"
                  placeholder="http://localhost:8000/stream"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={fetchLatest} size="sm" className="flex-1">
                  Обновить
                </Button>
                <Button onClick={fetchLogs} size="sm" variant="outline" className="flex-1">
                  Логи
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Video Stream - Left Top */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Видеопоток {frameTimestamp && <span className="text-xs text-green-500 ml-2">● LIVE</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
              {/* Base MJPEG stream */}
              <img
                ref={videoRef}
                src={streamUrl}
                alt="Video Stream"
                className="w-full h-full object-cover"
                onLoad={() => {
                  setFrameTimestamp(Date.now());
                  setIsLoading(false);
                  detectObjects();
                }}
                onError={(e) => {
                  e.currentTarget.src = '';
                  setIsLoading(false);
                }}
                crossOrigin="anonymous"
                style={{
                  background: 'linear-gradient(45deg, #1a1a1a 25%, transparent 25%), linear-gradient(-45deg, #1a1a1a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1a1a1a 75%), linear-gradient(-45deg, transparent 75%, #1a1a1a 75%)',
                  backgroundSize: '20px 20px',
                  backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                }}
              />

              {/* Canvas overlay for bounding boxes */}
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full pointer-events-none"
              />

              {/* Латентность таймер */}
              {frameTimestamp && (
                <div className="absolute top-2 right-2 z-10 bg-black/60 text-white px-3 py-2 rounded-lg font-mono text-sm">
                  ⏱️ {(latencyMs / 1000).toFixed(2)}s
                </div>
              )}

              {/* Индикатор обработки */}
              {isLoading && (
                <div className="absolute top-2 left-2 z-10 flex items-center gap-2 bg-black/60 text-white px-3 py-2 rounded-lg text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  Обработка...
                </div>
              )}

              {/* Model loading indicator */}
              {modelLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-20">
                  <div className="text-center text-white">
                    <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <div className="text-sm">Загрузка модели...</div>
                  </div>
                </div>
              )}

              {/* Analysis Results Overlay */}
              {latestResult && (
                <div className="absolute bottom-2 left-2 right-2 z-10 bg-black/70 text-white p-3 rounded-lg text-xs max-h-32 overflow-y-auto border border-green-500/50">
                  <div className="font-bold text-green-400 mb-2">📊 Анализ готов:</div>

                  {/* Disasters */}
                  {latestResult.full_log?.disaster_detections?.length > 0 && (
                    <div className="mb-2">
                      <div className="text-red-400 font-semibold mb-1">🚨 Катастрофы:</div>
                      {latestResult.full_log.disaster_detections.slice(0, 2).map((d: any, i: number) => (
                        <div key={i} className="text-red-300 ml-2">
                          • {d.label}: {Math.round(d.score * 100)}%
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Objects */}
                  {latestResult.full_log?.detections?.length > 0 && (
                    <div>
                      <div className="text-green-400 font-semibold mb-1">🎯 Объекты:</div>
                      {latestResult.full_log.detections.slice(0, 3).map((d: any, i: number) => (
                        <div key={i} className="text-green-300 ml-2">
                          • {d.label}: {Math.round(d.score * 100)}%
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Latest Analysis - Right Top */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="w-5 h-5" />
              🤖 AI Анализ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Real-time Client Detections */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-cyan-500 uppercase">⚡ Реальное время (TensorFlow):</div>
                {clientDetections.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {clientDetections.slice(0, 4).map((detection: any, index: number) => (
                      <div key={index} className="flex flex-col gap-1 p-2 bg-cyan-950/40 border border-cyan-900/50 rounded text-xs">
                        <span className="font-medium text-cyan-400">{detection.class}</span>
                        <Badge variant="secondary" className="self-start text-xs px-1.5 py-0.5 bg-cyan-600">
                          {Math.round(detection.score * 100)}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500 p-2 bg-gray-900/20 rounded">
                    Загрузка детектора...
                  </div>
                )}
              </div>

              {/* Server Analysis */}
              <div className="space-y-2 pt-2 border-t border-gray-700">
                <div className="text-xs font-semibold text-green-500 uppercase">📡 Анализ (HuggingFace):</div>

                {/* Обнаруженные объекты */}
                <div className="space-y-1.5">
                  <div className="text-xs font-semibold text-gray-400 uppercase">Объекты:</div>
                  {latestResult?.full_log?.detections?.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {latestResult.full_log.detections.map((detection: any, index: number) => (
                        <div key={index} className="flex flex-col gap-1 p-2 bg-green-950/30 border border-green-900/50 rounded text-xs">
                          <span className="font-medium text-green-400">{detection.label}</span>
                          <Badge variant="secondary" className="self-start text-xs px-1.5 py-0.5">
                            {(detection.score * 100).toFixed(0)}%
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500 p-1 bg-gray-900/20 rounded">
                      Объектов не обнаружено
                    </div>
                  )}
                </div>

                {/* Катастрофы */}
                <div className="space-y-1.5 pt-2 border-t border-gray-600">
                  <div className="text-xs font-semibold text-red-500 uppercase">🚨 Катастрофы:</div>
                  {latestResult?.full_log?.disaster_detections?.length > 0 ? (
                    <div className="space-y-1">
                      {latestResult.full_log.disaster_detections.map((disaster: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-red-950/40 border border-red-900/50 rounded text-xs">
                          <span className="font-bold text-red-400">{disaster.label}</span>
                          <Badge className="bg-red-600 text-white text-xs px-1.5 py-0.5">
                            {(disaster.score * 100).toFixed(0)}%
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500 p-1 bg-gray-900/20 rounded">
                      ✅ Катастроф не обнаружено
                    </div>
                  )}
                </div>
              </div>

              {/* Статистика */}
              {latestResult && (
                <div className="text-xs text-gray-400 pt-2 border-t border-gray-700 space-y-1">
                  <div>📊 Объекты (HF): <span className="font-bold text-white">{latestResult.full_log?.detections?.length || 0}</span></div>
                  <div>⚡ Реальное: <span className="font-bold text-cyan-400">{clientDetections.length}</span></div>
                  <div>⏱️ Время: <span className="text-gray-300 font-mono text-xs">
                    {latestResult.timestamp ? new Date(latestResult.timestamp).toLocaleTimeString('ru-RU') : 'N/A'}
                  </span></div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Logs History - Bottom Full Width */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-5 h-5" />
              История событий
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {logs.length > 0 ? (
                logs.map((log, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded text-base">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="secondary"
                        style={{ backgroundColor: getEventColor(log.full_log?.event || 'none') + '20' }}
                      >
                        {log.short_log}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {log.source === 'esp' ? 'ESP32' : 'NASA'}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(log.timestamp).toLocaleTimeString('ru-RU')}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-base text-muted-foreground text-center py-8">
                  Логов пока нет
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* NASA Map - Show only when NASA source is selected */}
        {currentSource === 'nasa' && (
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Satellite className="w-5 h-5" />
                  🛰️ NASA GIBS - Спутниковые данные
                </CardTitle>
              </CardHeader>
              <CardContent>
                <NASAMap isVisible={currentSource === 'nasa'} />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
