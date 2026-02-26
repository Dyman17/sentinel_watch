import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet'
import L from 'leaflet'
import { useState, useEffect } from 'react'

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface Station {
  id: number
  name: string
  lat: number
  lon: number
  current_detection: {
    disaster_type: string
    confidence: number
    color: string
  }
  last_update: number
}

interface MapViewProps {
  lat: number
  lng: number
  detections?: Array<{
    id: string
    lat: number
    lng: number
    event_type: string
    confidence: number
  }>
}

const getDisasterEmoji = (disasterType: string) => {
  switch (disasterType) {
    case 'fire':
      return '🔥'
    case 'flood':
      return '🌊'
    case 'earthquake':
      return '🏚️'
    case 'smoke':
      return '💨'
    case 'storm':
      return '🌪️'
    default:
      return '📍'
  }
}

export const MapView: React.FC<MapViewProps> = ({ lat, lng, detections = [] }) => {
  const [stations, setStations] = useState<Station[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Загрузить демо-станции
    const fetchStations = async () => {
      try {
        const response = await fetch('/api/demo/stations')
        const data = await response.json()
        setStations(data.stations)
      } catch (error) {
        console.error('Failed to load stations:', error)
        // Fallback to hardcoded stations
        setStations([
          {
            id: 1,
            name: 'Северное Бутово',
            lat: 55.3485,
            lon: 37.7449,
            current_detection: { disaster_type: 'none', confidence: 0, color: '#4CAF50' },
            last_update: Date.now()
          },
          {
            id: 2,
            name: 'Центр (Кремль)',
            lat: 55.7525,
            lon: 37.6231,
            current_detection: { disaster_type: 'none', confidence: 0, color: '#4CAF50' },
            last_update: Date.now()
          },
          {
            id: 3,
            name: 'ЮАО (Царицыно)',
            lat: 55.6204,
            lon: 37.7383,
            current_detection: { disaster_type: 'none', confidence: 0, color: '#4CAF50' },
            last_update: Date.now()
          }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchStations()
    // Обновлять станции каждые 30 секунд
    const interval = setInterval(fetchStations, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <MapContainer
      center={[lat, lng]}
      zoom={10}
      style={{ height: '600px', width: '100%' }}
      className="rounded-lg border border-border"
    >
      {/* OpenStreetMap Tiles */}
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Station Markers */}
      {stations.map((station) => (
        <CircleMarker
          key={station.id}
          center={[station.lat, station.lon]}
          radius={15}
          fillColor={station.current_detection.color}
          color={station.current_detection.color}
          weight={2}
          opacity={0.8}
          fillOpacity={0.7}
        >
          <Popup>
            <div className="p-2 min-w-xs">
              <h3 className="font-bold text-lg">
                {getDisasterEmoji(station.current_detection.disaster_type)} {station.name}
              </h3>
              <hr className="my-2" />
              <div className="text-sm space-y-1">
                <p><strong>Тип:</strong> {station.current_detection.disaster_type || 'Нет данных'}</p>
                <p><strong>Уверенность:</strong> {(station.current_detection.confidence * 100).toFixed(1)}%</p>
                <p><strong>Обновлено:</strong> {new Date(station.last_update).toLocaleTimeString('ru-RU')}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Координаты: {station.lat.toFixed(4)}, {station.lon.toFixed(4)}
                </p>
              </div>
            </div>
          </Popup>
        </CircleMarker>
      ))}

      {/* Detection Markers */}
      {detections.map((detection) => (
        <Marker key={detection.id} position={[detection.lat, detection.lng]}>
          <Popup>
            <div>
              <strong>{detection.event_type}</strong><br />
              Confidence: {(detection.confidence * 100).toFixed(1)}%
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
