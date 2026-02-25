import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Settings, Trash2, Wifi, WifiOff, AlertTriangle, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface StreamConfig {
  stream_id: string;
  satellite_id: string;
  stream_url: string;
  quality: string;
  status: 'active' | 'inactive' | 'error';
  stats?: {
    fps: number;
    actual_fps: number;
    total_frames_sent: number;
    frame_loss_rate: number;
    avg_frame_time: number;
  };
}

interface StreamManagerProps {
  onStreamSelect?: (streamId: string) => void;
}

export function StreamManager({ onStreamSelect }: StreamManagerProps) {
  const [streams, setStreams] = useState<StreamConfig[]>([]);
  const [showAddStream, setShowAddStream] = useState(false);
  const [newStream, setNewStream] = useState({
    satellite_id: '',
    stream_url: '',
    quality: 'medium'
  });
  const [loading, setLoading] = useState(false);

  // Загрузка существующих потоков
  useEffect(() => {
    loadStreams();
  }, []);

  const loadStreams = async () => {
    try {
      const response = await fetch('/api/v1/video/streams');
      const data = await response.json();
      
      if (data.success) {
        const streamList = Object.entries(data.streams).map(([id, stream]: [string, any]) => ({
          stream_id: id,
          satellite_id: stream.satellite_id,
          stream_url: stream.url,
          quality: stream.quality || 'medium',
          status: stream.status,
          stats: stream.output_stats
        }));
        setStreams(streamList);
      }
    } catch (error) {
      console.error('Failed to load streams:', error);
    }
  };

  const addStream = async () => {
    if (!newStream.satellite_id || !newStream.stream_url) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/v1/video/streams/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stream_url: newStream.stream_url,
          satellite_id: newStream.satellite_id,
          quality: newStream.quality,
          resolution: [640, 480]
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setStreams([...streams, {
          stream_id: data.stream_id,
          satellite_id: newStream.satellite_id,
          stream_url: newStream.stream_url,
          quality: newStream.quality,
          status: 'active'
        }]);
        
        setNewStream({ satellite_id: '', stream_url: '', quality: 'medium' });
        setShowAddStream(false);
      }
    } catch (error) {
      console.error('Failed to add stream:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeStream = async (streamId: string) => {
    try {
      const response = await fetch(`/api/v1/video/streams/${streamId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        setStreams(streams.filter(s => s.stream_id !== streamId));
      }
    } catch (error) {
      console.error('Failed to remove stream:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Wifi className="w-4 h-4 text-green-500" />;
      case 'inactive':
        return <WifiOff className="w-4 h-4 text-gray-500" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <WifiOff className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Активен';
      case 'inactive':
        return 'Неактивен';
      case 'error':
        return 'Ошибка';
      default:
        return 'Неизвестно';
    }
  };

  return (
    <Card className="glass-panel">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold">Управление потоками</h3>
            <p className="text-xs text-muted-foreground">Видеопотоки ESP32-CAM</p>
          </div>
          <Button
            onClick={() => setShowAddStream(!showAddStream)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Добавить поток
          </Button>
        </div>

        {/* Add Stream Form */}
        {showAddStream && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-4 p-4 bg-background-panel/60 rounded-lg"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="satellite_id">ID Спутника</Label>
                <Input
                  id="satellite_id"
                  placeholder="SAT-01"
                  value={newStream.satellite_id}
                  onChange={(e) => setNewStream({...newStream, satellite_id: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="stream_url">URL Потока</Label>
                <Input
                  id="stream_url"
                  placeholder="http://192.168.1.100:81/stream"
                  value={newStream.stream_url}
                  onChange={(e) => setNewStream({...newStream, stream_url: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="quality">Качество</Label>
                <Select value={newStream.quality} onValueChange={(value) => setNewStream({...newStream, quality: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Низкое (5 FPS)</SelectItem>
                    <SelectItem value="medium">Среднее (10 FPS)</SelectItem>
                    <SelectItem value="high">Высокое (15 FPS)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={addStream} disabled={loading}>
                {loading ? 'Добавление...' : 'Добавить'}
              </Button>
              <Button variant="outline" onClick={() => setShowAddStream(false)}>
                Отмена
              </Button>
            </div>
          </motion.div>
        )}

        {/* Streams List */}
        <div className="space-y-3">
          {streams.length === 0 ? (
            <div className="text-center py-8">
              <WifiOff className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">Нет активных потоков</p>
              <p className="text-xs text-muted-foreground">Добавьте поток для начала работы</p>
            </div>
          ) : (
            streams.map((stream) => (
              <motion.div
                key={stream.stream_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-3 bg-background-panel/60 rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(stream.status)}
                    <div>
                      <p className="font-medium">{stream.satellite_id}</p>
                      <p className="text-xs text-muted-foreground">{stream.stream_id}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded ${
                      stream.status === 'active' ? 'bg-success/20 text-success' :
                      stream.status === 'error' ? 'bg-destructive/20 text-destructive' :
                      'bg-muted/20 text-muted-foreground'
                    }`}>
                      {getStatusText(stream.status)}
                    </span>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onStreamSelect?.(stream.stream_id)}
                    >
                      <Play className="w-3 h-3" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeStream(stream.stream_id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                
                {/* Stream Stats */}
                {stream.stats && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs"
                  >
                    <div>
                      <span className="text-muted-foreground">FPS: </span>
                      <span className="font-mono">{stream.stats.actual_fps.toFixed(1)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Кадры: </span>
                      <span className="font-mono">{stream.stats.total_frames_sent}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Потери: </span>
                      <span className="font-mono text-warning">{stream.stats.frame_loss_rate.toFixed(1)}%</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Время: </span>
                      <span className="font-mono">{stream.stats.avg_frame_time.toFixed(0)}мс</span>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))
          )}
        </div>
      </div>
    </Card>
  );
}
