import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

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

export const MapView: React.FC<MapViewProps> = ({ lat, lng, detections = [] }) => {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={5}
      style={{ height: '500px', width: '100%' }}
    >
      {/* NASA Satellite Tiles */}
      <TileLayer
        attribution='&copy; NASA Earth Observatory'
        url="https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg"
      />

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

      {/* Default Location Marker */}
      <Marker position={[lat, lng]}>
        <Popup>Default Location</Popup>
      </Marker>
    </MapContainer>
  )
}
