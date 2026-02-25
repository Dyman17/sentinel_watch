import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Camera, Wifi, WifiOff, AlertTriangle, RefreshCw, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ESP32Config {
  ip: string;
  port: number;
  status: 'offline' | 'connecting' | 'online' | 'error';
  streamUrl?: string;
  info?: {
    model: string;
    firmware: string;
    ip: string;
    mac: string;
    freeHeap: number;
  };
}

export function ESP32Test() {
  const [config, setConfig] = useState<ESP32Config>({
    ip: '192.168.1.100',
    port: 80,
    status: 'offline'
  });
  const [testImage, setTestImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    setConfig(prev => ({ ...prev, status: 'connecting' }));

    try {
      // Создаем AbortController для таймаута
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      // Тест базового подключения
      const response = await fetch(`http://${config.ip}:${config.port}/`, {
        method: 'GET',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        // Получаем информацию об устройстве
        const infoResponse = await fetch(`http://${config.ip}:${config.port}/info`);
        let deviceInfo = null;
        
        if (infoResponse.ok) {
          deviceInfo = await infoResponse.json();
        }

        // Тест видеопотока
        const streamUrl = `http://${config.ip}:${config.port}/stream`;
        
        setConfig({
          ...config,
          status: 'online',
          streamUrl,
          info: deviceInfo || {
            model: 'ESP32-CAM',
            firmware: 'Unknown',
            ip: config.ip,
            mac: 'Unknown',
            freeHeap: 0
          }
        });

        // Загружаем тестовый кадр
        await loadTestFrame(streamUrl);
      } else {
        setConfig(prev => ({ ...prev, status: 'error' }));
      }
    } catch (error) {
      console.error('ESP32 connection error:', error);
      setConfig(prev => ({ ...prev, status: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  const loadTestFrame = async (streamUrl: string) => {
    try {
      // Для MJPEG потока
      const response = await fetch(streamUrl);
      const reader = response.body?.getReader();
      
      if (reader) {
        const chunks: Uint8Array[] = [];
        let boundaryFound = false;
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          chunks.push(value);
          
          // Ищем границу JPEG
          if (!boundaryFound) {
            const data = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
            let offset = 0;
            for (const chunk of chunks) {
              data.set(chunk, offset);
              offset += chunk.length;
            }
            
            // Ищем начало JPEG (0xFFD8)
            for (let i = 0; i < data.length - 1; i++) {
              if (data[i] === 0xFF && data[i + 1] === 0xD8) {
                // Ищем конец JPEG (0xFFD9)
                for (let j = i + 2; j < data.length - 1; j++) {
                  if (data[j] === 0xFF && data[j + 1] === 0xD9) {
                    const jpegData = data.slice(i, j + 2);
                    const base64 = btoa(String.fromCharCode(...jpegData));
                    setTestImage(`data:image/jpeg;base64,${base64}`);
                    boundaryFound = true;
                    break;
                  }
                }
                if (boundaryFound) break;
              }
            }
            
            if (boundaryFound) break;
          }
        }
      }
    } catch (error) {
      console.error('Failed to load test frame:', error);
    }
  };

  const addStreamToSystem = async () => {
    if (!config.streamUrl) return;

    try {
      // Используем новый ESP32 API
      const response = await fetch('/api/v1/esp32/streams/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stream_id: `ESP32-${config.ip.split('.').pop()}`,
          esp_ip: config.ip,
          port: config.port
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert('ESP32 поток успешно добавлен в систему!');
      } else {
        alert('Ошибка при добавлении потока');
      }
    } catch (error) {
      console.error('Failed to add ESP32 stream:', error);
      alert('Ошибка при добавлении потока');
    }
  };

  const getStatusIcon = () => {
    switch (config.status) {
      case 'connecting':
        return <RefreshCw className="w-5 h-5 text-yellow-500 animate-spin" />;
      case 'online':
        return <Wifi className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default:
        return <WifiOff className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (config.status) {
      case 'connecting':
        return 'Подключение...';
      case 'online':
        return 'Подключено';
      case 'error':
        return 'Ошибка подключения';
      default:
        return 'Офлайн';
    }
  };

  return (
    <Card className="glass-panel">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Camera className="w-6 h-6 text-primary" />
          <div>
            <h3 className="font-semibold">ESP32-CAM Тест</h3>
            <p className="text-xs text-muted-foreground">Проверка подключения и настройка видеопотока</p>
          </div>
        </div>

        {/* Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <Label htmlFor="esp32-ip">IP адрес ESP32</Label>
            <Input
              id="esp32-ip"
              placeholder="192.168.1.100"
              value={config.ip}
              onChange={(e) => setConfig(prev => ({ ...prev, ip: e.target.value }))}
              disabled={config.status === 'connecting'}
            />
          </div>
          <div>
            <Label htmlFor="esp32-port">Порт</Label>
            <Input
              id="esp32-port"
              type="number"
              placeholder="80"
              value={config.port}
              onChange={(e) => setConfig(prev => ({ ...prev, port: parseInt(e.target.value) || 80 }))}
              disabled={config.status === 'connecting'}
            />
          </div>
        </div>

        {/* Test Button */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            onClick={testConnection}
            disabled={loading}
            className="gap-2"
          >
            {getStatusIcon()}
            {loading ? 'Тестирование...' : 'Тест подключения'}
          </Button>
          
          <div className="flex items-center gap-2 text-sm">
            <span>Статус:</span>
            <span className={`font-medium ${
              config.status === 'online' ? 'text-green-500' :
              config.status === 'error' ? 'text-red-500' :
              config.status === 'connecting' ? 'text-yellow-500' :
              'text-gray-500'
            }`}>
              {getStatusText()}
            </span>
          </div>
        </div>

        {/* Device Info */}
        {config.info && config.status === 'online' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-background-panel/60 rounded-lg"
          >
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Info className="w-4 h-4" />
              Информация об устройстве
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Модель:</span>
                <span className="ml-2 font-mono">{config.info.model}</span>
              </div>
              <div>
                <span className="text-muted-foreground">IP:</span>
                <span className="ml-2 font-mono">{config.info.ip}</span>
              </div>
              <div>
                <span className="text-muted-foreground">MAC:</span>
                <span className="ml-2 font-mono">{config.info.mac}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Прошивка:</span>
                <span className="ml-2 font-mono">{config.info.firmware}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Свободно RAM:</span>
                <span className="ml-2 font-mono">{config.info.freeHeap} байт</span>
              </div>
              <div>
                <span className="text-muted-foreground">Поток:</span>
                <span className="ml-2 font-mono text-green-500">Доступен</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Test Image */}
        {testImage && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <h4 className="font-medium mb-3">Тестовый кадр</h4>
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <img
                src={testImage}
                alt="ESP32-CAM Test Frame"
                className="w-full h-full object-contain"
              />
            </div>
          </motion.div>
        )}

        {/* Actions */}
        {config.status === 'online' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3"
          >
            <Button
              onClick={addStreamToSystem}
              className="gap-2"
            >
              <Camera className="w-4 h-4" />
              Добавить в систему
            </Button>
            <Button
              variant="outline"
              onClick={() => setConfig(prev => ({ ...prev, status: 'offline' }))}
            >
              Отключить
            </Button>
          </motion.div>
        )}

        {/* Help */}
        <div className="mt-6 p-4 bg-muted/20 rounded-lg">
          <h4 className="font-medium mb-2">Инструкция по подключению ESP32-CAM:</h4>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Подключите ESP32-CAM к той же WiFi сети, что и компьютер</li>
            <li>Узнайте IP адрес ESP32 (можно через Serial Monitor)</li>
            <li>Убедитесь, что ESP32 раздает MJPEG поток на /stream</li>
            <li>Введите IP адрес и нажмите "Тест подключения"</li>
            <li>При успешном подключении нажмите "Добавить в систему"</li>
          </ol>
        </div>
      </div>
    </Card>
  );
}
