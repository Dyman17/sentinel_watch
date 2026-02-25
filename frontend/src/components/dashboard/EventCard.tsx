import { motion } from "framer-motion";
import { X, MapPin, Clock, Percent, Eye, Flame, Droplets, Wind, Activity, Trees } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Event } from "@/lib/api";

interface EventCardProps {
  event: Event;
  onClose: () => void;
}

const typeConfig = {
  fire: { icon: Flame, color: "text-destructive", bgColor: "bg-destructive/20", label: "Пожар" },
  flood: { icon: Droplets, color: "text-info", bgColor: "bg-info/20", label: "Наводнение" },
  smoke: { icon: Wind, color: "text-muted-foreground", bgColor: "bg-muted/20", label: "Задымление" },
  earthquake: { icon: Activity, color: "text-warning", bgColor: "bg-warning/20", label: "Землетрясение" },
  wildfire: { icon: Flame, color: "text-destructive", bgColor: "bg-destructive/20", label: "Лесной пожар" },
  deforestation: { icon: Trees, color: "text-success", bgColor: "bg-success/20", label: "Вырубка лесов" },
};

export function EventCard({ event, onClose }: EventCardProps) {
  const config = typeConfig[event.event_type as keyof typeof typeConfig] || typeConfig.fire;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: 50, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.95 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="absolute top-4 right-4 w-80 glass-panel overflow-hidden"
    >
      {/* Header */}
      <div className="relative p-4 border-b border-border/30">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${config.bgColor}`}>
              <Icon className={`w-5 h-5 ${config.color}`} />
            </div>
            <div>
              <h3 className="font-display font-semibold">{config.label}</h3>
              <p className="text-xs text-muted-foreground">{event.region}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-background-panel transition-colors text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scanning line effect */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Confidence */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Percent className="w-3.5 h-3.5" />
              <span className="text-xs uppercase tracking-wider">Confidence</span>
            </div>
            <span className="font-mono text-lg font-semibold text-success">{Math.round(event.confidence * 100)}%</span>
          </div>
          <div className="h-1.5 bg-background-panel rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${event.confidence * 100}%` }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="h-full bg-gradient-to-r from-success/60 to-success rounded-full"
            />
          </div>
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-background-panel/60 rounded-md">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <MapPin className="w-3 h-3" />
              <span className="text-2xs uppercase tracking-wider">Coordinates</span>
            </div>
            <p className="font-mono text-xs">
              {event.latitude.toFixed(4)}°, {event.longitude.toFixed(4)}°
            </p>
          </div>
          <div className="p-3 bg-background-panel/60 rounded-md">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <Clock className="w-3 h-3" />
              <span className="text-2xs uppercase tracking-wider">Detected</span>
            </div>
            <p className="font-mono text-xs">{new Date(event.created_at).toLocaleTimeString()}</p>
          </div>
        </div>

        {/* Satellite Image Preview */}
        <div className="relative aspect-video bg-background-panel rounded-md overflow-hidden">
          <div className="absolute inset-0 grid-pattern opacity-20" />
          
          {/* Fake satellite image placeholder with scan effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-background-panel via-muted/10 to-background-panel" />
          
          {/* Scan line */}
          <motion.div
            className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/60 to-transparent"
            animate={{ top: ["0%", "100%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />

          {/* Telemetry overlay */}
          <div className="absolute inset-0 p-2">
            <div className="flex justify-between">
              <span className="font-mono text-2xs text-primary/80">ESP32-CAM</span>
              <span className="font-mono text-2xs text-muted-foreground">LIVE</span>
            </div>
            <div className="absolute bottom-2 left-2 right-2 flex justify-between">
              <span className="font-mono text-2xs text-muted-foreground">ALT: 408km</span>
              <span className="font-mono text-2xs text-muted-foreground">
                {event.latitude.toFixed(2)}° / {event.longitude.toFixed(2)}°
              </span>
            </div>
          </div>

          {/* Noise overlay */}
          <div className="absolute inset-0 noise-overlay opacity-50" />
        </div>

        {/* Action Button */}
        <Button className="w-full bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 hover:border-primary/50 transition-all">
          <Eye className="w-4 h-4 mr-2" />
          View Full Capture
        </Button>
      </div>
    </motion.div>
  );
}
