import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Camera, Wifi, WifiOff, RefreshCw, Settings } from 'lucide-react';

interface StreamConfig {
  espUrl: string;
  backendUrl: string;
  isActive: boolean;
}

interface DetectionResult {
  source: string;
  analysis: {
    predictions?: Array<{
      label: string;
      confidence: number;
      box?: {
        xmin: number;
        ymin: number;
        xmax: number;
        ymax: number;
      };
    }>;
    error?: string;
  };
  timestamp: string;
}

export function ESP32Stream() {
  const [config, setConfig] = useState<StreamConfig>({
    espUrl: 'http://192.168.1.100:81/stream',
    backendUrl: '',
    isActive: false
  });
  
  const [detectionResults, setDetectionResults] = useState<DetectionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [showSettings, setShowSettings] = useState(false);
  
  const imgRef = useRef<HTMLImageElement>(null);
  const streamIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Test connection to ESP32
  const testConnection = async () => {
    setConnectionStatus('connecting');
    try {
      const img = new Image();
      img.onload = () => setConnectionStatus('connected');
      img.onerror = () => setConnectionStatus('disconnected');
      img.src = config.espUrl + '?t=' + Date.now();
    } catch (error) {
      setConnectionStatus('disconnected');
    }
  };

  // Toggle stream
  const toggleStream = async (enabled: boolean) => {
    setConfig(prev => ({ ...prev, isActive: enabled }));
    
    if (enabled) {
      await testConnection();
      startAnalysis();
    } else {
      stopAnalysis();
    }
  };

  // Start analysis loop
  const startAnalysis = () => {
    if (streamIntervalRef.current) {
      clearInterval(streamIntervalRef.current);
    }

    streamIntervalRef.current = setInterval(async () => {
      if (!config.isActive) return;
      
      try {
        // Get latest analysis from backend
        const response = await fetch(`${config.backendUrl}/result`);
        if (response.ok) {
          const result = await response.json();
          setDetectionResults({
            ...result,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('Error fetching analysis:', error);
      }
    }, 2000); // Every 2 seconds
  };

  // Stop analysis loop
  const stopAnalysis = () => {
    if (streamIntervalRef.current) {
      clearInterval(streamIntervalRef.current);
      streamIntervalRef.current = null;
    }
  };

  // Switch source
  const switchSource = async (source: 'esp' | 'nasa') => {
    setIsLoading(true);
    try {
      const response = await fetch(`${config.backendUrl}/switch/${source}`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Switched source:', result);
      }
    } catch (error) {
      console.error('Error switching source:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAnalysis();
    };
  }, []);

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="w-4 h-4 text-green-500" />;
      case 'connecting':
        return <RefreshCw className="w-4 h-4 text-yellow-500 animate-spin" />;
      default:
        return <WifiOff className="w-4 h-4 text-red-500" />;
    }
  };

  const getConnectionText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Подключено';
      case 'connecting':
        return 'Подключение...';
      default:
        return 'Отключено';
    }
  };

  return (
    <div className="space-y-4">
      {/* Control Panel */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              ESP32 Видеопоток
            </div>
            <div className="flex items-center gap-2">
              {getConnectionIcon()}
              <span className="text-sm text-muted-foreground">{getConnectionText()}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="stream-toggle">Видеопоток</Label>
            <Switch
              id="stream-toggle"
              checked={config.isActive}
              onCheckedChange={toggleStream}
            />
          </div>

          {showSettings && (
            <div className="space-y-3 p-3 bg-muted/30 rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="esp-url" className="text-sm">ESP32 URL:</Label>
                <input
                  id="esp-url"
                  type="text"
                  value={config.espUrl}
                  onChange={(e) => setConfig(prev => ({ ...prev, espUrl: e.target.value }))}
                  className="w-full px-3 py-1 text-sm border rounded"
                  placeholder="http://192.168.1.100:81/stream"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="backend-url" className="text-sm">Backend URL:</Label>
                <input
                  id="backend-url"
                  type="text"
                  value={config.backendUrl}
                  onChange={(e) => setConfig(prev => ({ ...prev, backendUrl: e.target.value }))}
                  className="w-full px-3 py-1 text-sm border rounded"
                  placeholder="http://localhost:8000"
                />
              </div>
              <Button onClick={testConnection} size="sm" className="w-full">
                Проверить соединение
              </Button>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={() => switchSource('esp')}
              size="sm"
              variant={detectionResults?.source === 'esp' ? 'default' : 'outline'}
              disabled={isLoading}
            >
              ESP32 Источник
            </Button>
            <Button
              onClick={() => switchSource('nasa')}
              size="sm"
              variant={detectionResults?.source === 'nasa' ? 'default' : 'outline'}
              disabled={isLoading}
            >
              NASA Источник
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Video Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Видеопоток</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
              {config.isActive ? (
                <img
                  ref={imgRef}
                  src={config.espUrl}
                  alt="ESP32 Stream"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '';
                    setConnectionStatus('disconnected');
                  }}
                  onLoad={() => setConnectionStatus('connected')}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Видеопоток отключен</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Analysis Results */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Результаты анализа</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {detectionResults?.analysis?.predictions ? (
                <div className="space-y-2">
                  {detectionResults.analysis.predictions.map((prediction, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                      <span className="text-sm font-medium">{prediction.label}</span>
                      <Badge variant="secondary">
                        {(prediction.confidence * 100).toFixed(1)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : detectionResults?.analysis?.error ? (
                <div className="text-sm text-red-500 p-2 bg-red-50 rounded">
                  Ошибка: {detectionResults.analysis.error}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground text-center py-4">
                  Ожидание результатов анализа...
                </div>
              )}
              
              {detectionResults && (
                <div className="text-xs text-muted-foreground pt-2 border-t">
                  Источник: {detectionResults.source} | 
                  {new Date(detectionResults.timestamp).toLocaleTimeString('ru-RU')}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
