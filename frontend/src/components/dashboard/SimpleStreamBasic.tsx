import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Camera, Satellite, Activity, Clock } from "lucide-react";

export const SimpleStreamBasic = () => {
  const [currentSource, setCurrentSource] = useState<'esp' | 'nasa'>('esp');
  const [showSettings, setShowSettings] = useState(false);

  const switchSource = (source: 'esp' | 'nasa') => {
    setCurrentSource(source);
  };

  const getEventColor = (event: string) => {
    const colors: { [key: string]: string } = {
      fire: '#ef4444',
      flood: '#3b82f6',
      smoke: '#a3a3a3',
      person: '#3b82f6',
      car: '#10b981',
      dog: '#f59e0b',
      none: '#6b7280'
    };
    return colors[event as keyof typeof colors] || '#6b7280';
  };

  // Mock data для демонстрации
  const mockLatestResult = {
    short_log: "FIRE DETECTED",
    full_log: {
      event: "fire",
      source: "esp",
      confidence: 0.89,
      timestamp: new Date().toISOString(),
      detections: [
        { label: "fire", score: 0.89 },
        { label: "smoke", score: 0.76 }
      ],
      region: "california"
    },
    source: "esp",
    timestamp: new Date().toISOString()
  };

  const mockLogs = [
    {
      short_log: "FIRE DETECTED",
      full_log: {
        event: "fire",
        source: "esp",
        confidence: 0.89,
        timestamp: new Date(Date.now() - 5000).toISOString(),
        region: "california"
      },
      source: "esp",
      timestamp: new Date(Date.now() - 5000).toISOString()
    },
    {
      short_log: "NO DETECTION",
      full_log: {
        event: "none",
        source: "esp",
        confidence: 0.95,
        timestamp: new Date(Date.now() - 10000).toISOString(),
        region: "unknown"
      },
      source: "esp",
      timestamp: new Date(Date.now() - 10000).toISOString()
    }
  ];

  return (
    <div className="space-y-6 px-8 py-6 min-h-screen w-full">
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
              Настройки
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
              />
              <Satellite className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-center gap-2 text-base text-muted-foreground">
            <Activity className="w-4 h-4" />
            Текущий: <span className="font-medium">{currentSource === 'esp' ? 'ESP32 Камера' : 'NASA Спутник'}</span>
          </div>

          {/* Latest Status */}
          <div className="p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-base font-medium">Последний анализ:</span>
              <Badge 
                variant="secondary"
                style={{ backgroundColor: getEventColor(mockLatestResult.full_log?.event || 'none') + '20' }}
              >
                {mockLatestResult.short_log}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              {new Date(mockLatestResult.timestamp).toLocaleString('ru-RU')}
            </div>
          </div>
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
            <div className="relative aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center">
              <div className="text-center">
                <Camera className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">Видеопоток {currentSource === 'esp' ? 'ESP32' : 'NASA'}</p>
              </div>
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
              <div className="grid grid-cols-2 gap-3">
                {mockLatestResult.full_log.detections.map((detection: any, index: number) => (
                  <div key={index} className="flex flex-col gap-1 p-3 bg-muted/30 rounded">
                    <span className="text-sm font-medium">{detection.label}</span>
                    <Badge variant="secondary" className="self-start">
                      {(detection.score * 100).toFixed(1)}%
                    </Badge>
                  </div>
                ))}
              </div>
              
              <div className="text-sm text-muted-foreground pt-4 border-t">
                <div>Источник: {mockLatestResult.source}</div>
                <div>Регион: {mockLatestResult.full_log?.region || 'unknown'}</div>
                <div>Уверенность: {(mockLatestResult.full_log?.confidence * 100).toFixed(1)}%</div>
              </div>
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
              {mockLogs.map((log, index) => (
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
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
