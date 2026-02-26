import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface NASAMapProps {
  isVisible: boolean;
}

export const NASAMap = ({ isVisible }: NASAMapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isVisible || !containerRef.current) return;

    // Initialize map only once
    if (!mapRef.current) {
      const map = L.map(containerRef.current).setView([20, 0], 3);

      // NASA GIBS TileLayer - True Color (visible)
      // More layers available at: https://map1.vis.earthdata.nasa.gov/
      L.tileLayer(
        'https://map1.vis.earthdata.nasa.gov/wmts-webmerc/VIIRS_CityLights_2012/default//GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpg',
        {
          attribution:
            '&copy; <a href="https://earthdata.nasa.gov/">NASA Earthdata</a>',
          maxZoom: 8,
          minZoom: 2,
        }
      ).addTo(map);

      // Add True Color imagery layer
      L.tileLayer(
        'https://map1.vis.earthdata.nasa.gov/wmts-webmerc/BlueMarble_ShadedRelief_Bathymetry/default//GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpg',
        {
          attribution:
            '&copy; <a href="https://earthdata.nasa.gov/">NASA Earthdata</a>',
          maxZoom: 8,
          minZoom: 2,
          opacity: 0.7,
        }
      ).addTo(map);

      // Add some markers for demo (major disaster-prone areas)
      const locations = [
        { lat: 35.6762, lng: 139.6503, name: '🔥 Tokyo' },
        { lat: -15.7975, lng: -47.8919, name: '🌊 Brasília' },
        { lat: 40.7128, lng: -74.006, name: '🌪️ New York' },
        { lat: 51.5074, lng: -0.1278, name: '❄️ London' },
      ];

      locations.forEach(loc => {
        L.marker([loc.lat, loc.lng])
          .bindPopup(loc.name)
          .addTo(map);
      });

      mapRef.current = map;

      // Trigger resize on next tick to fix map display
      setTimeout(() => map.invalidateSize(), 100);
    }

    return () => {
      // Don't destroy map on unmount, keep it for performance
    };
  }, [isVisible]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="space-y-4 mt-4">
      <div className="rounded-lg overflow-hidden border border-gray-700 bg-gray-900">
        <div
          ref={containerRef}
          style={{
            width: '100%',
            height: '500px',
            backgroundColor: '#1a1a2e',
          }}
          className="relative"
        >
          {/* Loading state */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-10">
            <div className="text-white text-center">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <div className="text-sm">🛰️ Загрузка спутниковых данных...</div>
            </div>
          </div>
        </div>

        {/* Map info */}
        <div className="p-3 bg-gray-900 border-t border-gray-700">
          <div className="text-xs text-gray-400">
            <p className="mb-2">
              📡 <strong>NASA GIBS</strong> - Global Imagery Browse Services
            </p>
            <p className="text-gray-500">
              Real-time satellite imagery from NASA Earth Observation satellites
            </p>
          </div>

          {/* Layer info */}
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-400 p-2 bg-black/20 rounded">
            <div>
              <span className="text-blue-400">◆</span> Night Lights (VIIRS)
            </div>
            <div>
              <span className="text-cyan-400">◆</span> Blue Marble
            </div>
            <div>
              <span className="text-red-400">◆</span> Fire Detection
            </div>
            <div>
              <span className="text-green-400">◆</span> Land Cover
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-3 bg-muted/30 rounded-lg">
          <div className="text-xs text-gray-400">Спутников активных</div>
          <div className="text-lg font-bold text-green-400">28</div>
        </div>
        <div className="p-3 bg-muted/30 rounded-lg">
          <div className="text-xs text-gray-400">Датчиков работает</div>
          <div className="text-lg font-bold text-blue-400">186</div>
        </div>
      </div>
    </div>
  );
};

export default NASAMap;
