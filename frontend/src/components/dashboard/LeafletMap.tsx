import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Satellite, Camera, MapPin } from 'lucide-react';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

interface DetectionEvent {
  id: string;
  latitude: number;
  longitude: number;
  event_type: string;
  confidence: number;
  region: string;
  severity: string;
  created_at: string;
}

interface LeafletMapProps {
  events: DetectionEvent[];
  onSourceChange?: (source: 'esp' | 'nasa') => void;
  currentSource?: 'esp' | 'nasa';
}

// NASA World View Tile Layer
const NASA_TILE_LAYER = 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_TrueColor/default/2023-01-01/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg';

// OpenStreetMap for comparison
const OSM_TILE_LAYER = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  
  return null;
}

export function LeafletMap({ events = [], onSourceChange, currentSource = 'nasa' }: LeafletMapProps) {
  const [mapCenter] = useState<[number, number]>([20, 0]);
  const [mapZoom] = useState(2);
  const [useNASA, setUseNASA] = useState(true);

  const handleSourceToggle = (checked: boolean) => {
    setUseNASA(checked);
    onSourceChange?.(checked ? 'nasa' : 'esp');
  };

  const getEventColor = (eventType: string) => {
    const colors = {
      wildfire: '#ef4444',
      fire: '#ef4444',
      flood: '#3b82f6',
      smoke: '#6b7280',
      earthquake: '#f59e0b',
      deforestation: '#10b981'
    };
    return colors[eventType as keyof typeof colors] || '#6b7280';
  };

  const createCustomIcon = (eventType: string) => {
    const color = getEventColor(eventType);
    return L.divIcon({
      html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
      popupAnchor: [0, -8],
      className: ''
    });
  };

  return (
    <div className="relative w-full h-full">
      {/* Control Panel */}
      <Card className="absolute top-4 right-4 z-[1000] w-80">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4" />
            Источник данных
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="source-toggle" className="text-sm">
              {useNASA ? 'NASA Спутник' : 'ESP32 Камера'}
            </Label>
            <Switch
              id="source-toggle"
              checked={useNASA}
              onCheckedChange={handleSourceToggle}
            />
          </div>
          
          <div className="flex items-center gap-2">
            {useNASA ? (
              <Satellite className="w-4 h-4 text-blue-500" />
            ) : (
              <Camera className="w-4 h-4 text-green-500" />
            )}
            <span className="text-xs text-muted-foreground">
              {useNASA 
                ? 'Данные со спутников NASA WorldView' 
                : 'Поток с ESP32 камеры'
              }
            </span>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-medium">Обнаруженные события:</div>
            <div className="flex flex-wrap gap-1">
              {events.length > 0 ? (
                events.map((event) => (
                  <Badge 
                    key={event.id} 
                    variant="secondary" 
                    className="text-xs"
                    style={{ backgroundColor: getEventColor(event.event_type) + '20', color: getEventColor(event.event_type) }}
                  >
                    {event.event_type}
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-muted-foreground">Событий не обнаружено</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Map */}
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        className="w-full h-full"
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url={useNASA ? NASA_TILE_LAYER : OSM_TILE_LAYER}
          attribution={
            useNASA 
              ? '&copy; NASA Earth Observatory'
              : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          }
        />
        
        <MapController center={mapCenter} zoom={mapZoom} />
        
        {/* Event Markers */}
        {events.map((event) => (
          <Marker
            key={event.id}
            position={[event.latitude, event.longitude]}
            icon={createCustomIcon(event.event_type)}
          >
            <Popup>
              <div className="space-y-2">
                <div className="font-medium">{event.region}</div>
                <div className="text-sm text-muted-foreground">
                  Тип: {event.event_type}
                </div>
                <div className="text-sm">
                  Уверенность: <span className="font-medium">{(event.confidence * 100).toFixed(1)}%</span>
                </div>
                <div className="text-sm">
                  Серьезность: <span className="font-medium">{event.severity}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(event.created_at).toLocaleString('ru-RU')}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
