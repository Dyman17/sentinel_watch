import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, Cpu, CheckCircle, AlertTriangle, XCircle, RefreshCw } from "lucide-react";

interface AIStatus {
  hf_api: {
    status: 'online' | 'offline' | 'error';
    response_time?: number;
    last_check: string;
  };
  yolo_model: {
    status: 'loaded' | 'loading' | 'error';
    model_name: string;
    device: string;
  };
  integration: {
    status: 'connected' | 'disconnected' | 'error';
    messages_sent: number;
    last_message: string;
  };
}

const AIStatus = () => {
  const [status, setStatus] = useState<AIStatus>({
    hf_api: {
      status: 'offline',
      last_check: 'Никогда'
    },
    yolo_model: {
      status: 'loading',
      model_name: 'DETR-ResNet-50',
      device: 'CPU'
    },
    integration: {
      status: 'disconnected',
      messages_sent: 0,
      last_message: 'Нет данных'
    }
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const checkAIStatus = async () => {
    setIsRefreshing(true);
    
    try {
      // Проверяем статус HF API
      const hfResponse = await fetch('/api/health');
      const hfData = hfResponse.ok ? await hfResponse.json() : null;
      
      // Проверяем статус YOLO модели (через HF Space)
      const spaceResponse = await fetch('https://dyman17-sentinel-watch.hf.space/api/health', {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      const spaceData = spaceResponse.ok ? await spaceResponse.json() : null;

      setStatus(prev => ({
        hf_api: {
          status: hfData?.hf === 200 ? 'online' : hfResponse.ok ? 'online' : 'offline',
          response_time: hfData?.response_time,
          last_check: new Date().toLocaleTimeString()
        },
        yolo_model: {
          status: spaceData?.model_loaded ? 'loaded' : 'loading',
          model_name: 'DETR-ResNet-50',
          device: spaceData?.device || 'CPU'
        },
        integration: {
          status: hfData && spaceData ? 'connected' : 'disconnected',
          messages_sent: prev.integration.messages_sent,
          last_message: new Date().toLocaleTimeString()
        }
      }));
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        hf_api: {
          status: 'error',
          last_check: new Date().toLocaleTimeString()
        },
        yolo_model: {
          ...prev.yolo_model,
          status: 'error'
        },
        integration: {
          ...prev.integration,
          status: 'error'
        }
      }));
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    checkAIStatus();
    const interval = setInterval(checkAIStatus, 30000); // Проверяем каждые 30 секунд
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
      case 'loaded':
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'loading':
        return <RefreshCw className="w-4 h-4 text-yellow-500 animate-spin" />;
      case 'offline':
      case 'disconnected':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      online: 'default',
      loaded: 'default',
      connected: 'default',
      loading: 'secondary',
      offline: 'outline',
      disconnected: 'outline',
      error: 'destructive'
    } as const;

    const labels = {
      online: 'Онлайн',
      loaded: 'Загружена',
      connected: 'Подключено',
      loading: 'Загрузка...',
      offline: 'Офлайн',
      disconnected: 'Отключено',
      error: 'Ошибка'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Brain className="w-6 h-6" />
          Статус AI систем
        </h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={checkAIStatus}
          disabled={isRefreshing}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Обновить
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* HF API Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Cpu className="w-5 h-5" />
              HuggingFace API
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Статус:</span>
              <div className="flex items-center gap-2">
                {getStatusIcon(status.hf_api.status)}
                {getStatusBadge(status.hf_api.status)}
              </div>
            </div>
            
            {status.hf_api.response_time && (
              <div className="flex items-center justify-between">
                <span className="text-sm">Время отклика:</span>
                <span className="text-sm font-mono">
                  {status.hf_api.response_time}ms
                </span>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Последняя проверка:</span>
              <span className="text-sm text-muted-foreground">
                {status.hf_api.last_check}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* YOLO Model Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Brain className="w-5 h-5" />
              YOLO Модель
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Статус:</span>
              <div className="flex items-center gap-2">
                {getStatusIcon(status.yolo_model.status)}
                {getStatusBadge(status.yolo_model.status)}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Модель:</span>
              <span className="text-sm font-mono">
                {status.yolo_model.model_name}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Устройство:</span>
              <span className="text-sm font-mono">
                {status.yolo_model.device}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Integration Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <RefreshCw className="w-5 h-5" />
              Интеграция
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Статус:</span>
              <div className="flex items-center gap-2">
                {getStatusIcon(status.integration.status)}
                {getStatusBadge(status.integration.status)}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Сообщений отправлено:</span>
              <span className="text-sm font-mono">
                {status.integration.messages_sent}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Последнее сообщение:</span>
              <span className="text-sm text-muted-foreground">
                {status.integration.last_message}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overall Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Общий статус системы</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {getStatusIcon(
              status.hf_api.status === 'online' && 
              status.yolo_model.status === 'loaded' && 
              status.integration.status === 'connected' 
                ? 'online' 
                : 'error'
            )}
            <div>
              <p className="font-medium">
                {
                  status.hf_api.status === 'online' && 
                  status.yolo_model.status === 'loaded' && 
                  status.integration.status === 'connected'
                    ? '🚀 Система полностью готова к работе'
                    : '⚠️ Система требует внимания'
                }
              </p>
              <p className="text-sm text-muted-foreground">
                AI детекция катастроф активна и готова к обработке изображений
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIStatus;
