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
              Видеопоток
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
              <img
                src={streamUrl}
                alt="Video Stream"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = '';
                }}
                style={{ 
                  background: 'linear-gradient(45deg, #1a1a1a 25%, transparent 25%), linear-gradient(-45deg, #1a1a1a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1a1a1a 75%), linear-gradient(-45deg, transparent 75%, #1a1a1a 75%)',
                  backgroundSize: '20px 20px',
                  backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Latest Analysis - Right Top */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Результаты анализа
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {latestResult?.full_log?.detections?.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {latestResult.full_log.detections.map((detection: any, index: number) => (
                    <div key={index} className="flex flex-col gap-1 p-3 bg-muted/30 rounded">
                      <span className="text-sm font-medium">{detection.label}</span>
                      <Badge variant="secondary" className="self-start">
                        {(detection.score * 100).toFixed(1)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-base text-muted-foreground text-center py-8">
                  Детекций не найдено
                </div>
              )}
              
              {latestResult && (
                <div className="text-sm text-muted-foreground pt-4 border-t">
                  <div>Источник: {latestResult.source}</div>
                  <div>Регион: {latestResult.full_log?.region || 'unknown'}</div>
                  <div>Уверенность: {latestResult.full_log?.confidence ? (latestResult.full_log.confidence * 100).toFixed(1) : 0}%</div>
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
      </div>
      </div>
    </div>
  );
}
