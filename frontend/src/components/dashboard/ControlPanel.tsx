import { motion } from "framer-motion";
import { Satellite, Flame, Droplets, Wind, Activity, Globe, ChevronRight, Radio, Settings } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { Link } from "react-router-dom";

interface FilterOption {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  count: number;
}

const disasterFilters: FilterOption[] = [
  { id: "fire", label: "Fire", icon: Flame, color: "text-destructive", count: 12 },
  { id: "flood", label: "Flood", icon: Droplets, color: "text-info", count: 8 },
  { id: "smoke", label: "Smoke", icon: Wind, color: "text-muted-foreground", count: 5 },
  { id: "earthquake", label: "Earthquake", icon: Activity, color: "text-warning", count: 3 },
];

const regions = [
  { id: "asia", name: "Asia Pacific", events: 14 },
  { id: "europe", name: "Europe", events: 7 },
  { id: "americas", name: "Americas", events: 9 },
  { id: "africa", name: "Africa", events: 6 },
];

export function ControlPanel() {
  const [activeFilters, setActiveFilters] = useState<Record<string, boolean>>({
    fire: true,
    flood: true,
    smoke: true,
    earthquake: true,
  });
  const [satelliteMode, setSatelliteMode] = useState<"auto" | "manual">("auto");

  const toggleFilter = (id: string) => {
    setActiveFilters((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <motion.aside
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
      className="w-72 bg-background-secondary/80 backdrop-blur-xl border-r border-border/50 flex flex-col"
    >
      {/* Satellite Control Section */}
      <div className="p-4 border-b border-border/30">
        <div className="flex items-center gap-2 mb-4">
          <Satellite className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-display font-semibold uppercase tracking-wider">
            Satellite Control
          </h2>
        </div>

        <div className="space-y-3">
          {/* Satellite ID */}
          <div className="flex items-center justify-between py-2 px-3 bg-background-panel/60 rounded-md">
            <span className="text-2xs text-muted-foreground uppercase">ID</span>
            <span className="font-mono text-xs text-foreground">SAT-001-SENTINEL</span>
          </div>

          {/* Mode Toggle */}
          <div className="flex items-center justify-between py-2 px-3 bg-background-panel/60 rounded-md">
            <span className="text-2xs text-muted-foreground uppercase">Mode</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSatelliteMode("auto")}
                className={`px-2 py-1 text-2xs font-mono rounded transition-all ${
                  satelliteMode === "auto"
                    ? "bg-success/20 text-success"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                AUTO
              </button>
              <button
                onClick={() => setSatelliteMode("manual")}
                className={`px-2 py-1 text-2xs font-mono rounded transition-all ${
                  satelliteMode === "manual"
                    ? "bg-warning/20 text-warning"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                MANUAL
              </button>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between py-2 px-3 bg-background-panel/60 rounded-md">
            <span className="text-2xs text-muted-foreground uppercase">Status</span>
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-2 h-2 rounded-full bg-success" />
                <motion.div
                  className="absolute inset-0 rounded-full bg-success"
                  animate={{ scale: [1, 2, 1], opacity: [1, 0, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              <span className="font-mono text-xs text-success">ACTIVE</span>
            </div>
          </div>

          {/* Telemetry */}
          <div className="grid grid-cols-2 gap-2">
            <div className="py-2 px-3 bg-background-panel/60 rounded-md text-center">
              <span className="text-3xs text-muted-foreground uppercase block mb-1">Alt</span>
              <span className="font-mono text-xs text-info">408 km</span>
            </div>
            <div className="py-2 px-3 bg-background-panel/60 rounded-md text-center">
              <span className="text-3xs text-muted-foreground uppercase block mb-1">Vel</span>
              <span className="font-mono text-xs text-info">7.66 km/s</span>
            </div>
          </div>
        </div>
      </div>

      {/* Disaster Filters Section */}
      <div className="p-4 border-b border-border/30">
        <div className="flex items-center gap-2 mb-4">
          <Radio className="w-4 h-4 text-destructive" />
          <h2 className="text-sm font-display font-semibold uppercase tracking-wider">
            Disaster Filters
          </h2>
        </div>

        <div className="space-y-2">
          {disasterFilters.map((filter) => (
            <motion.div
              key={filter.id}
              whileHover={{ x: 4 }}
              className={`flex items-center justify-between py-2 px-3 rounded-md transition-all cursor-pointer ${
                activeFilters[filter.id]
                  ? "bg-background-panel/80 border border-border/50"
                  : "bg-background-panel/30 opacity-60"
              }`}
              onClick={() => toggleFilter(filter.id)}
            >
              <div className="flex items-center gap-3">
                <filter.icon className={`w-4 h-4 ${filter.color}`} />
                <span className="text-sm">{filter.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-muted-foreground">{filter.count}</span>
                <Switch
                  checked={activeFilters[filter.id]}
                  onCheckedChange={() => toggleFilter(filter.id)}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Regions Section */}
      <div className="p-4 flex-1">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-4 h-4 text-info" />
          <h2 className="text-sm font-display font-semibold uppercase tracking-wider">
            Regions
          </h2>
        </div>

        <div className="space-y-1">
          {regions.map((region, index) => (
            <motion.button
              key={region.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              whileHover={{ x: 4, backgroundColor: "hsl(var(--background-panel))" }}
              className="w-full flex items-center justify-between py-2.5 px-3 rounded-md text-left transition-colors group"
            >
              <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                {region.name}
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-info">{region.events}</span>
                <ChevronRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.aside>
  );
}
