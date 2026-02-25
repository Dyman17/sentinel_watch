import { motion } from "framer-motion";
import { TopBar } from "@/components/dashboard/TopBar";
import { 
  Flame, 
  Droplets, 
  Wind, 
  Search, 
  Filter, 
  ArrowUpDown,
  Eye,
  MapPin,
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

interface DisasterEvent {
  id: string;
  type: "fire" | "flood" | "smoke";
  location: string;
  coordinates: { lat: number; lon: number };
  severity: "critical" | "high" | "medium" | "low";
  confidence: number;
  timestamp: string;
  status: "active" | "monitoring" | "resolved";
  description: string;
}

const disasterEvents: DisasterEvent[] = [];

const typeConfig = {
  fire: { icon: Flame, color: "text-destructive", bg: "bg-destructive/20" },
  flood: { icon: Droplets, color: "text-info", bg: "bg-info/20" },
  smoke: { icon: Wind, color: "text-muted-foreground", bg: "bg-muted/20" },
};

const severityConfig = {
  critical: { color: "bg-destructive text-destructive-foreground", label: "Critical" },
  high: { color: "bg-warning text-warning-foreground", label: "High" },
  medium: { color: "bg-info text-info-foreground", label: "Medium" },
  low: { color: "bg-success text-success-foreground", label: "Low" },
};

const statusConfig = {
  active: { color: "bg-destructive/20 text-destructive border-destructive/30", label: "Active" },
  monitoring: { color: "bg-warning/20 text-warning border-warning/30", label: "Monitoring" },
  resolved: { color: "bg-success/20 text-success border-success/30", label: "Resolved" },
};

const Disasters = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"timestamp" | "severity" | "confidence">("timestamp");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const filteredEvents = disasterEvents
    .filter(event => {
      const matchesSearch = event.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           event.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = !filterType || event.type === filterType;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      if (sortBy === "timestamp") return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      if (sortBy === "severity") {
        const order = { critical: 4, high: 3, medium: 2, low: 1 };
        return order[b.severity] - order[a.severity];
      }
      return b.confidence - a.confidence;
    });

  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
  const paginatedEvents = filteredEvents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
                  <AlertTriangle className="w-6 h-6 text-destructive" />
                  Disaster Events
                </h1>
                <p className="text-muted-foreground text-sm">Monitor and manage all detected disaster events</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-muted-foreground">
                {filteredEvents.length} events
              </span>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-background-panel/60 rounded-lg border border-border/30">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by location or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-background-secondary/50"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              {Object.entries(typeConfig).map(([type, config]) => (
                <Button
                  key={type}
                  variant={filterType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterType(filterType === type ? null : type)}
                  className="gap-1"
                >
                  <config.icon className="w-3 h-3" />
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="bg-background-secondary/50 border border-border/30 rounded-md px-3 py-1.5 text-sm"
              >
                <option value="timestamp">Latest First</option>
                <option value="severity">Severity</option>
                <option value="confidence">Confidence</option>
              </select>
            </div>
          </div>

          {/* Events Table */}
          <div className="bg-background-panel/60 rounded-lg border border-border/30 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/30 bg-background-secondary/30">
                    <th className="text-left p-4 text-2xs font-medium text-muted-foreground uppercase tracking-wider">Event</th>
                    <th className="text-left p-4 text-2xs font-medium text-muted-foreground uppercase tracking-wider">Location</th>
                    <th className="text-left p-4 text-2xs font-medium text-muted-foreground uppercase tracking-wider">Severity</th>
                    <th className="text-left p-4 text-2xs font-medium text-muted-foreground uppercase tracking-wider">Confidence</th>
                    <th className="text-left p-4 text-2xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="text-left p-4 text-2xs font-medium text-muted-foreground uppercase tracking-wider">Time</th>
                    <th className="text-left p-4 text-2xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedEvents.map((event, index) => {
                    const TypeIcon = typeConfig[event.type].icon;
                    return (
                      <motion.tr
                        key={event.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b border-border/20 hover:bg-background-secondary/30 transition-colors cursor-pointer"
                        onClick={() => navigate(`/event/${event.id}`)}
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg ${typeConfig[event.type].bg} flex items-center justify-center`}>
                              <TypeIcon className={`w-4 h-4 ${typeConfig[event.type].color}`} />
                            </div>
                            <div>
                              <span className="font-mono text-xs text-muted-foreground">{event.id}</span>
                              <p className="text-sm font-medium capitalize">{event.type}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3 h-3 text-muted-foreground" />
                            <span className="text-sm">{event.location}</span>
                          </div>
                          <span className="font-mono text-2xs text-muted-foreground">
                            {event.coordinates.lat.toFixed(2)}°, {event.coordinates.lon.toFixed(2)}°
                          </span>
                        </td>
                        <td className="p-4">
                          <Badge className={severityConfig[event.severity].color}>
                            {severityConfig[event.severity].label}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-background-secondary rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary rounded-full"
                                style={{ width: `${event.confidence}%` }}
                              />
                            </div>
                            <span className="font-mono text-xs">{event.confidence}%</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant="outline" className={statusConfig[event.status].color}>
                            {statusConfig[event.status].label}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span className="text-xs">
                              {new Date(event.timestamp).toLocaleString()}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="gap-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/event/${event.id}`);
                            }}
                          >
                            <Eye className="w-3 h-3" />
                            View
                          </Button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between p-4 border-t border-border/30">
              <span className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredEvents.length)} of {filteredEvents.length}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <Button
                    key={i + 1}
                    variant={currentPage === i + 1 ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Disasters;
