import { motion } from "framer-motion";
import { useState } from "react";
import { EventCard } from "./EventCard";
import { useEvents, useCriticalEvents } from "@/hooks/use-api";
import { Event } from "@/lib/api";

// Интерфейс соответствует нашему API
interface DisasterEvent {
  id: string;
  event_type: "wildfire" | "flood" | "smoke" | "earthquake" | "deforestation";
  latitude: number;
  longitude: number;
  confidence: number;
  created_at: string;
  region: string;
  severity: string;
  // Для совместимости со старым кодом
  type?: string;
  lat?: number;
  lng?: number;
  time?: string;
  location?: string;
}

// Используем реальные данные с бэкенда
const typeColors = {
  fire: "#EF4444",
  flood: "#38BDF8", 
  smoke: "#94A3B8",
  earthquake: "#F59E0B",
  // Добавляем новые типы из нашего бэкенда
  wildfire: "#EF4444",
  deforestation: "#10B981",
};

export function WorldMap() {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [hoveredEvent, setHoveredEvent] = useState<string | null>(null);

  // Получаем реальные события с бэкенда
  const { data: eventsData, isLoading } = useEvents();
  const events = eventsData?.events || [];

  const latToY = (lat: number) => ((90 - lat) / 180) * 100;
  const lngToX = (lng: number) => ((lng + 180) / 360) * 100;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.3 }}
      className="flex-1 relative bg-background overflow-hidden"
    >
      {/* Grid Pattern Background */}
      <div className="absolute inset-0 grid-pattern opacity-30" />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-background/80" />

      {/* Simple SVG World Map Outline */}
      <svg
        viewBox="0 0 100 50"
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Simplified world continents paths */}
        <defs>
          <linearGradient id="continentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.1" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.05" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="0.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Stylized continent shapes */}
        <g fill="url(#continentGradient)" stroke="hsl(var(--primary))" strokeWidth="0.1" strokeOpacity="0.4">
          {/* North America */}
          <path d="M10,10 Q15,8 20,12 L25,10 Q28,15 25,20 L20,22 Q15,25 12,20 Z" />
          {/* South America */}
          <path d="M22,25 Q25,28 24,32 L22,38 Q20,40 18,36 L19,30 Q20,27 22,25 Z" />
          {/* Europe */}
          <path d="M45,12 Q50,10 52,12 L54,15 Q52,18 48,16 L45,14 Z" />
          {/* Africa */}
          <path d="M45,20 Q50,18 54,22 L55,30 Q52,35 48,32 L45,25 Z" />
          {/* Asia */}
          <path d="M55,8 Q65,6 75,10 L80,15 Q78,22 70,20 L60,18 Q55,15 55,8 Z" />
          {/* Australia */}
          <path d="M75,30 Q80,28 82,32 L80,36 Q76,38 74,34 Z" />
        </g>

        {/* Latitude/Longitude grid lines */}
        <g stroke="hsl(var(--border))" strokeWidth="0.05" strokeOpacity="0.3">
          {[...Array(7)].map((_, i) => (
            <line key={`lat-${i}`} x1="0" y1={i * 8.33} x2="100" y2={i * 8.33} />
          ))}
          {[...Array(13)].map((_, i) => (
            <line key={`lng-${i}`} x1={i * 8.33} y1="0" x2={i * 8.33} y2="50" />
          ))}
        </g>

        {/* Satellite orbit path */}
        <motion.ellipse
          cx="50"
          cy="25"
          rx="45"
          ry="20"
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="0.1"
          strokeOpacity="0.3"
          strokeDasharray="2,1"
          className="orbit-path"
        />

        {/* Satellite position */}
        <motion.g
          initial={{ offsetDistance: "0%" }}
          animate={{ offsetDistance: "100%" }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        >
          <motion.circle
            cx="50"
            cy="5"
            r="1"
            fill="hsl(var(--primary))"
            filter="url(#glow)"
            animate={{
              cx: [5, 95],
              cy: [25, 25],
            }}
            transition={{
              duration: 30,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "linear",
            }}
          />
        </motion.g>
      </svg>

      {/* Event Points */}
      <div className="absolute inset-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-muted-foreground">Загрузка событий...</div>
          </div>
        ) : (
          events.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
              className="absolute cursor-pointer group"
              style={{
                left: `${lngToX(event.longitude)}%`,
                top: `${latToY(event.latitude)}%`,
                transform: "translate(-50%, -50%)",
              }}
              onMouseEnter={() => setHoveredEvent(event.id)}
              onMouseLeave={() => setHoveredEvent(null)}
              onClick={() => setSelectedEvent(event)}
            >
              {/* Pulse ring */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{ backgroundColor: typeColors[event.event_type as keyof typeof typeColors] || typeColors.fire }}
                animate={{
                  scale: [1, 2.5, 1],
                  opacity: [0.4, 0, 0.4],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: index * 0.3,
                }}
              />
              {/* Event dot */}
              <div
                className="relative w-3 h-3 rounded-full border-2 border-background transition-transform group-hover:scale-150"
                style={{
                  backgroundColor: typeColors[event.event_type as keyof typeof typeColors] || typeColors.fire,
                  boxShadow: `0 0 10px ${(typeColors[event.event_type as keyof typeof typeColors] || typeColors.fire)}80`,
                }}
              />

              {/* Hover tooltip */}
              {hoveredEvent === event.id && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-10"
                >
                  <div className="glass-panel px-3 py-2 whitespace-nowrap">
                    <p className="text-xs font-medium">{event.region}</p>
                    <p className="text-2xs text-muted-foreground capitalize">{event.event_type}</p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )))}
        </div>

        {/* Scan cone effect */}
        <motion.div
          className="absolute w-96 h-96 pointer-events-none"
          style={{
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          <div
            className="w-full h-full"
            style={{
              background: "conic-gradient(from 0deg, transparent 0deg, hsl(var(--primary) / 0.1) 30deg, transparent 60deg)",
            }}
          />
        </motion.div>

      {/* Map legend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="absolute bottom-4 left-4 glass-panel p-3"
      >
        <p className="text-2xs text-muted-foreground uppercase tracking-wider mb-2">Legend</p>
        <div className="flex flex-wrap gap-3">
          {Object.entries(typeColors).map(([type, color]) => (
            <div key={type} className="flex items-center gap-1.5">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-2xs capitalize">{type}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Coordinates display */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="absolute top-4 right-4 glass-panel px-3 py-2"
      >
        <div className="flex items-center gap-4 font-mono text-xs">
          <span className="text-muted-foreground">
            LAT: <span className="text-info">35.6762°</span>
          </span>
          <span className="text-muted-foreground">
            LNG: <span className="text-info">139.6503°</span>
          </span>
        </div>
      </motion.div>

      {/* Event Card */}
      {selectedEvent && (
        <EventCard
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </motion.div>
  );
}
