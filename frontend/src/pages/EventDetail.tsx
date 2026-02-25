import { motion } from "framer-motion";
import { TopBar } from "@/components/dashboard/TopBar";
import { useParams, Link } from "react-router-dom";
import { 
  Flame, 
  Droplets, 
  Wind, 
  Activity, 
  MapPin, 
  Clock, 
  Satellite,
  Download,
  Share2,
  AlertTriangle,
  TrendingUp,
  Users,
  FileText,
  Camera
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const eventData = {
  id: "EVT-001",
  type: "fire" as const,
  location: "California, USA",
  region: "Western United States",
  coordinates: { lat: 36.7783, lon: -119.4179 },
  severity: "critical" as const,
  confidence: 94,
  timestamp: "2024-01-15T14:32:00Z",
  status: "active" as const,
  description: "Large wildfire spreading across 2,500 acres of forest. Multiple fire crews deployed. Evacuation orders in effect for nearby communities.",
  affectedArea: "2,500 acres",
  estimatedPopulation: "12,000",
  responseTeams: 8,
  satelliteId: "SAT-001-SENTINEL",
  lastCapture: "2024-01-15T14:30:00Z",
  captureResolution: "10m",
  weatherConditions: {
    temperature: "32°C",
    humidity: "15%",
    windSpeed: "25 km/h",
    windDirection: "NW"
  },
  timeline: [
    { time: "14:32", event: "Initial detection by satellite" },
    { time: "14:35", event: "Alert dispatched to regional authorities" },
    { time: "14:42", event: "First responders deployed" },
    { time: "14:55", event: "Evacuation order issued" },
    { time: "15:10", event: "Additional resources requested" },
  ],
  recommendations: [
    "Continue monitoring wind direction changes",
    "Prepare for potential spread to eastern sectors",
    "Coordinate with neighboring county fire services",
    "Monitor air quality for nearby urban areas"
  ]
};

const typeConfig = {
  fire: { icon: Flame, color: "text-destructive", bg: "bg-destructive/20", label: "Wildfire" },
  flood: { icon: Droplets, color: "text-info", bg: "bg-info/20", label: "Flood" },
  smoke: { icon: Wind, color: "text-muted-foreground", bg: "bg-muted/20", label: "Smoke" },
  earthquake: { icon: Activity, color: "text-warning", bg: "bg-warning/20", label: "Earthquake" },
};

const EventDetail = () => {
  const { id } = useParams();
  const TypeIcon = typeConfig[eventData.type].icon;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopBar />

      <main className="flex-1 pt-14 p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-7xl mx-auto"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <Link to="/disasters" className="text-muted-foreground hover:text-foreground transition-colors">
                ← Back to Events
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Share2 className="w-4 h-4" />
                Share
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="w-4 h-4" />
                Export Report
              </Button>
            </div>
          </div>

          {/* Event Header Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-background-panel/60 rounded-lg border border-border/30 p-6 mb-6"
          >
            <div className="flex items-start gap-6">
              <div className={`w-16 h-16 rounded-xl ${typeConfig[eventData.type].bg} flex items-center justify-center`}>
                <TypeIcon className={`w-8 h-8 ${typeConfig[eventData.type].color}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-display font-bold">{typeConfig[eventData.type].label}</h1>
                  <Badge className="bg-destructive text-destructive-foreground">Critical</Badge>
                  <Badge variant="outline" className="bg-destructive/20 text-destructive border-destructive/30">Active</Badge>
                </div>
                <p className="text-muted-foreground mb-4">{eventData.description}</p>
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{eventData.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>{new Date(eventData.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Satellite className="w-4 h-4 text-primary" />
                    <span className="font-mono text-xs">{eventData.satelliteId}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-3xs text-muted-foreground uppercase block mb-1">Event ID</span>
                <span className="font-mono text-lg text-primary">{id || eventData.id}</span>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-3 gap-6">
            {/* Left Column - Stats & Satellite */}
            <div className="space-y-6">
              {/* Key Metrics */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-background-panel/60 rounded-lg border border-border/30 p-4"
              >
                <h3 className="text-sm font-display font-semibold uppercase tracking-wider mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-info" />
                  Key Metrics
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Detection Confidence</span>
                      <span className="font-mono text-primary">{eventData.confidence}%</span>
                    </div>
                    <Progress value={eventData.confidence} className="h-2" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-background-secondary/50 rounded-md text-center">
                      <span className="text-2xs text-muted-foreground block mb-1">Affected Area</span>
                      <span className="font-mono text-sm text-destructive">{eventData.affectedArea}</span>
                    </div>
                    <div className="p-3 bg-background-secondary/50 rounded-md text-center">
                      <span className="text-2xs text-muted-foreground block mb-1">Population</span>
                      <span className="font-mono text-sm text-warning">{eventData.estimatedPopulation}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-2 px-3 bg-background-secondary/50 rounded-md">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-success" />
                      <span className="text-sm">Response Teams</span>
                    </div>
                    <span className="font-mono text-success">{eventData.responseTeams}</span>
                  </div>
                </div>
              </motion.div>

              {/* Weather Conditions */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-background-panel/60 rounded-lg border border-border/30 p-4"
              >
                <h3 className="text-sm font-display font-semibold uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Wind className="w-4 h-4 text-info" />
                  Weather Conditions
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-background-secondary/50 rounded-md text-center">
                    <span className="text-2xs text-muted-foreground block mb-1">Temperature</span>
                    <span className="font-mono text-sm text-warning">{eventData.weatherConditions.temperature}</span>
                  </div>
                  <div className="p-3 bg-background-secondary/50 rounded-md text-center">
                    <span className="text-2xs text-muted-foreground block mb-1">Humidity</span>
                    <span className="font-mono text-sm text-info">{eventData.weatherConditions.humidity}</span>
                  </div>
                  <div className="p-3 bg-background-secondary/50 rounded-md text-center">
                    <span className="text-2xs text-muted-foreground block mb-1">Wind Speed</span>
                    <span className="font-mono text-sm">{eventData.weatherConditions.windSpeed}</span>
                  </div>
                  <div className="p-3 bg-background-secondary/50 rounded-md text-center">
                    <span className="text-2xs text-muted-foreground block mb-1">Wind Dir</span>
                    <span className="font-mono text-sm">{eventData.weatherConditions.windDirection}</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Center Column - Satellite Image */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-background-panel/60 rounded-lg border border-border/30 p-4"
            >
              <h3 className="text-sm font-display font-semibold uppercase tracking-wider mb-4 flex items-center gap-2">
                <Camera className="w-4 h-4 text-primary" />
                Satellite Capture
              </h3>
              
              {/* Simulated Satellite Image */}
              <div className="relative aspect-square bg-background-secondary rounded-lg overflow-hidden mb-4">
                <div className="absolute inset-0 bg-gradient-to-br from-destructive/30 via-warning/20 to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="relative w-32 h-32 mx-auto mb-4">
                      <div className="absolute inset-0 bg-destructive/40 rounded-full blur-xl animate-pulse" />
                      <Flame className="w-32 h-32 text-destructive/80" />
                    </div>
                    <p className="text-2xs text-muted-foreground">Thermal Signature Detected</p>
                  </div>
                </div>
                
                {/* Scan Effect */}
                <motion.div
                  className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"
                  animate={{ top: ["0%", "100%", "0%"] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                />
                
                {/* Telemetry Overlay */}
                <div className="absolute top-2 left-2 font-mono text-3xs text-primary/80 space-y-0.5">
                  <div>LAT: {eventData.coordinates.lat.toFixed(4)}°</div>
                  <div>LON: {eventData.coordinates.lon.toFixed(4)}°</div>
                  <div>RES: {eventData.captureResolution}</div>
                </div>
                <div className="absolute top-2 right-2 font-mono text-3xs text-muted-foreground">
                  {new Date(eventData.lastCapture).toLocaleTimeString()} UTC
                </div>
              </div>
              
              <Button className="w-full gap-2">
                <Download className="w-4 h-4" />
                Download Full Resolution
              </Button>
            </motion.div>

            {/* Right Column - Timeline & Recommendations */}
            <div className="space-y-6">
              {/* Event Timeline */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-background-panel/60 rounded-lg border border-border/30 p-4"
              >
                <h3 className="text-sm font-display font-semibold uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-warning" />
                  Event Timeline
                </h3>
                <div className="relative pl-4 border-l-2 border-border/50 space-y-4">
                  {eventData.timeline.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      className="relative"
                    >
                      <div className="absolute -left-[21px] w-3 h-3 rounded-full bg-primary border-2 border-background" />
                      <div className="font-mono text-2xs text-primary mb-0.5">{item.time}</div>
                      <div className="text-sm text-muted-foreground">{item.event}</div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Recommendations */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-background-panel/60 rounded-lg border border-border/30 p-4"
              >
                <h3 className="text-sm font-display font-semibold uppercase tracking-wider mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-success" />
                  Recommendations
                </h3>
                <ul className="space-y-2">
                  {eventData.recommendations.map((rec, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <AlertTriangle className="w-3 h-3 text-warning mt-1 shrink-0" />
                      {rec}
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default EventDetail;
