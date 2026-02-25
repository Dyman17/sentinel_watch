import { useState } from 'react';
import { TopBar } from "@/components/dashboard/TopBar";
import { SimpleStream } from "@/components/dashboard/SimpleStream";
import { MapView } from "@/components/dashboard/MapView";
import ImageUpload from "@/components/dashboard/ImageUpload";
import AIStatus from "@/components/dashboard/AIStatus";
import { Button } from "@/components/ui/button";
import { Camera, BarChart3, Map, Upload, Brain } from "lucide-react";

const Index = () => {
  const [activeView, setActiveView] = useState<'stream' | 'logs' | 'map' | 'upload' | 'status'>('stream');
  const [detections, setDetections] = useState<any[]>([]);

  const renderMainContent = () => {
    switch (activeView) {
      case 'status':
        return <AIStatus />;
      case 'upload':
        return <ImageUpload />;
      case 'logs':
        return (
          <div className="flex-1 p-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold mb-4">Логи системы</h2>
              <p className="text-muted-foreground">
                Здесь будет отображаться подробная история событий системы
              </p>
            </div>
          </div>
        );
      case 'map':
        return (
          <div className="flex-1 p-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-2xl font-bold mb-4">Карта событий</h2>
              <MapView 
                lat={55.7558} 
                lng={37.6173}
                detections={detections}
              />
            </div>
          </div>
        );
      case 'stream':
      default:
        return <SimpleStream />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden">
      {/* Top Bar */}
      <TopBar />

      {/* Navigation Bar */}
      <div className="bg-background-panel/80 border-b border-border/30 px-4 py-2">
        <div className="flex items-center gap-2">
          <Button
            variant={activeView === 'stream' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveView('stream')}
            className="gap-2"
          >
            <Camera className="w-4 h-4" />
            Мониторинг
          </Button>
          <Button
            variant={activeView === 'upload' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveView('upload')}
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            Загрузить
          </Button>
          <Button
            variant={activeView === 'status' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveView('status')}
            className="gap-2"
          >
            <Brain className="w-4 h-4" />
            AI Статус
          </Button>
          <Button
            variant={activeView === 'map' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveView('map')}
            className="gap-2"
          >
            <Map className="w-4 h-4" />
            Карта
          </Button>
          <Button
            variant={activeView === 'logs' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveView('logs')}
            className="gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            Логи
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex pt-20">
        {renderMainContent()}
      </div>
    </div>
  );
};

export default Index;
