import { motion } from "framer-motion";
import { TopBar } from "@/components/dashboard/TopBar";
import { Link } from "react-router-dom";
import { 
  Satellite, 
  Activity, 
  Signal, 
  Battery, 
  Thermometer,
  Radio,
  Orbit,
  Camera,
  Gauge,
  MapPin
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface SatelliteData {
  id: string;
  name: string;
  status: "active" | "standby" | "maintenance";
  altitude: number;
  velocity: number;
  inclination: number;
  battery: number;
  temperature: number;
  signalStrength: number;
  lastContact: string;
  currentPosition: { lat: number; lon: number };
  capturesTotal: number;
  capturestoday: number;
  orbitType: string;
}

const satellites: SatelliteData[] = [
  {
    id: "SAT-001-SENTINEL",
    name: "Sentinel Alpha",
    status: "active",
    altitude: 408,
    velocity: 7.66,
    inclination: 51.6,
    battery: 94,
    temperature: 22,
    signalStrength: 98,
    lastContact: "2024-01-15T14:32:00Z",
    currentPosition: { lat: 42.5, lon: -102.3 },
    capturesTotal: 15420,
    capturestoday: 47,
    orbitType: "LEO"
  },
  {
    id: "SAT-002-GUARDIAN",
    name: "Guardian Beta",
    status: "active",
    altitude: 420,
    velocity: 7.64,
    inclination: 52.0,
    battery: 87,
    temperature: 24,
    signalStrength: 95,
    lastContact: "2024-01-15T14:30:00Z",
    currentPosition: { lat: -15.2, lon: 78.9 },
    capturesTotal: 12350,
    capturestoday: 38,
    orbitType: "LEO"
  },
  {
    id: "SAT-003-WATCHER",
    name: "Watcher Gamma",
    status: "standby",
    altitude: 395,
    velocity: 7.68,
    inclination: 51.4,
    battery: 72,
    temperature: 18,
    signalStrength: 82,
    lastContact: "2024-01-15T14:25:00Z",
    currentPosition: { lat: 28.7, lon: 156.2 },
    capturesTotal: 8920,
    capturestoday: 12,
    orbitType: "LEO"
  },
  {
    id: "SAT-004-OBSERVER",
    name: "Observer Delta",
    status: "maintenance",
    altitude: 0,
    velocity: 0,
    inclination: 0,
    battery: 100,
    temperature: 20,
    signalStrength: 0,
    lastContact: "2024-01-10T08:00:00Z",
    currentPosition: { lat: 0, lon: 0 },
    capturesTotal: 5210,
    capturestoday: 0,
    orbitType: "Ground"
  },
];

const statusConfig = {
  active: { color: "bg-success text-success-foreground", pulse: true },
  standby: { color: "bg-warning text-warning-foreground", pulse: false },
  maintenance: { color: "bg-muted text-muted-foreground", pulse: false },
};

const Satellites = () => {
  const activeSatellites = satellites.filter(s => s.status === "active").length;
  const totalCaptures = satellites.reduce((sum, s) => sum + s.capturestoday, 0);

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
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
                ← Back
              </Link>
              <div>
                <h1 className="text-2xl font-display font-bold flex items-center gap-2">
                  <Satellite className="w-6 h-6 text-primary" />
                  Satellite Fleet
                </h1>
                <p className="text-muted-foreground text-sm">Monitor satellite constellation status and telemetry</p>
              </div>
            </div>
          </div>

          {/* Fleet Overview */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-background-panel/60 rounded-lg border border-border/30 p-4"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Satellite className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <span className="text-2xs text-muted-foreground uppercase block">Total Fleet</span>
                  <span className="text-2xl font-mono font-bold">{satellites.length}</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-background-panel/60 rounded-lg border border-border/30 p-4"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-success" />
                </div>
                <div>
                  <span className="text-2xs text-muted-foreground uppercase block">Active</span>
                  <span className="text-2xl font-mono font-bold text-success">{activeSatellites}</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-background-panel/60 rounded-lg border border-border/30 p-4"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-info/20 flex items-center justify-center">
                  <Camera className="w-5 h-5 text-info" />
                </div>
                <div>
                  <span className="text-2xs text-muted-foreground uppercase block">Today's Captures</span>
                  <span className="text-2xl font-mono font-bold text-info">{totalCaptures}</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-background-panel/60 rounded-lg border border-border/30 p-4"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center">
                  <Signal className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <span className="text-2xs text-muted-foreground uppercase block">Avg Signal</span>
                  <span className="text-2xl font-mono font-bold text-warning">92%</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Satellite Cards */}
          <div className="grid grid-cols-2 gap-6">
            {satellites.map((sat, index) => (
              <motion.div
                key={sat.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="bg-background-panel/60 rounded-lg border border-border/30 overflow-hidden"
              >
                {/* Card Header */}
                <div className="p-4 border-b border-border/30 bg-background-secondary/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                          <Satellite className="w-6 h-6 text-primary" />
                        </div>
                        {statusConfig[sat.status].pulse && (
                          <motion.div
                            className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-success"
                            animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          />
                        )}
                      </div>
                      <div>
                        <h3 className="font-display font-bold">{sat.name}</h3>
                        <span className="font-mono text-xs text-muted-foreground">{sat.id}</span>
                      </div>
                    </div>
                    <Badge className={statusConfig[sat.status].color}>
                      {sat.status.charAt(0).toUpperCase() + sat.status.slice(1)}
                    </Badge>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4">
                  {sat.status !== "maintenance" ? (
                    <>
                      {/* Telemetry Grid */}
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="p-3 bg-background-secondary/50 rounded-md text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <Orbit className="w-3 h-3 text-info" />
                            <span className="text-2xs text-muted-foreground">Altitude</span>
                          </div>
                          <span className="font-mono text-sm text-info">{sat.altitude} km</span>
                        </div>
                        <div className="p-3 bg-background-secondary/50 rounded-md text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <Gauge className="w-3 h-3 text-info" />
                            <span className="text-2xs text-muted-foreground">Velocity</span>
                          </div>
                          <span className="font-mono text-sm text-info">{sat.velocity} km/s</span>
                        </div>
                        <div className="p-3 bg-background-secondary/50 rounded-md text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <MapPin className="w-3 h-3 text-primary" />
                            <span className="text-2xs text-muted-foreground">Position</span>
                          </div>
                          <span className="font-mono text-2xs text-primary">
                            {sat.currentPosition.lat.toFixed(1)}°, {sat.currentPosition.lon.toFixed(1)}°
                          </span>
                        </div>
                      </div>

                      {/* Status Bars */}
                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <div className="flex items-center gap-1">
                              <Battery className="w-3 h-3 text-success" />
                              <span className="text-muted-foreground">Battery</span>
                            </div>
                            <span className="font-mono text-success">{sat.battery}%</span>
                          </div>
                          <Progress value={sat.battery} className="h-1.5" />
                        </div>
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <div className="flex items-center gap-1">
                              <Signal className="w-3 h-3 text-info" />
                              <span className="text-muted-foreground">Signal</span>
                            </div>
                            <span className="font-mono text-info">{sat.signalStrength}%</span>
                          </div>
                          <Progress value={sat.signalStrength} className="h-1.5" />
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1">
                            <Thermometer className="w-3 h-3 text-warning" />
                            <span className="text-muted-foreground">Temperature</span>
                          </div>
                          <span className="font-mono text-warning">{sat.temperature}°C</span>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="mt-4 pt-4 border-t border-border/30 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1">
                          <Camera className="w-3 h-3 text-muted-foreground" />
                          <span className="text-muted-foreground">Today: </span>
                          <span className="font-mono text-primary">{sat.capturestoday}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Radio className="w-3 h-3 text-muted-foreground" />
                          <span className="text-muted-foreground">Last contact: </span>
                          <span className="font-mono text-muted-foreground">
                            {new Date(sat.lastContact).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-4">
                        <Satellite className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground text-sm">Currently undergoing maintenance</p>
                      <p className="text-2xs text-muted-foreground mt-1">Expected return: Feb 2024</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Satellites;
