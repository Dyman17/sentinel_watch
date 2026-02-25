import { motion } from "framer-motion";
import { useState } from "react";
import { BarChart3, Clock, Camera, ChevronRight, Flame, Droplets, Wind, Activity } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

const timelineData = [
  { time: "00:00", fire: 2, flood: 1, smoke: 0, earthquake: 0 },
  { time: "04:00", fire: 3, flood: 2, smoke: 1, earthquake: 0 },
  { time: "08:00", fire: 5, flood: 3, smoke: 2, earthquake: 1 },
  { time: "12:00", fire: 8, flood: 4, smoke: 3, earthquake: 1 },
  { time: "16:00", fire: 6, flood: 5, smoke: 2, earthquake: 2 },
  { time: "20:00", fire: 4, flood: 3, smoke: 1, earthquake: 1 },
  { time: "24:00", fire: 3, flood: 2, smoke: 1, earthquake: 0 },
];

const timelineEvents = [
  { id: 1, time: "14:32", type: "fire", location: "Osaka, Japan", severity: "high" },
  { id: 2, time: "13:45", type: "flood", location: "Kolkata, India", severity: "medium" },
  { id: 3, time: "12:18", type: "fire", location: "Sydney, Australia", severity: "high" },
  { id: 4, time: "11:02", type: "earthquake", location: "Tokyo, Japan", severity: "low" },
  { id: 5, time: "10:45", type: "smoke", location: "London, UK", severity: "medium" },
  { id: 6, time: "09:30", type: "flood", location: "Singapore", severity: "medium" },
];

const satelliteFeeds = [
  { id: 1, time: "14:32:05", lat: 35.6762, lng: 139.6503, alt: 408 },
  { id: 2, time: "14:30:22", lat: 34.0522, lng: 118.2437, alt: 407 },
  { id: 3, time: "14:28:45", lat: 22.3193, lng: 114.1694, alt: 408 },
];

const typeColors = {
  fire: "#EF4444",
  flood: "#38BDF8",
  smoke: "#94A3B8",
  earthquake: "#F59E0B",
};

const typeIcons = {
  fire: Flame,
  flood: Droplets,
  smoke: Wind,
  earthquake: Activity,
};

type TabType = "timeline" | "statistics" | "feed";

export function AnalyticsPanel() {
  const [activeTab, setActiveTab] = useState<TabType>("timeline");

  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: "timeline", label: "Timeline", icon: Clock },
    { id: "statistics", label: "Statistics", icon: BarChart3 },
    { id: "feed", label: "Satellite Feed", icon: Camera },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
      className="h-56 bg-background-secondary/80 backdrop-blur-xl border-t border-border/50 flex flex-col"
    >
      {/* Tabs */}
      <div className="flex items-center gap-1 px-4 pt-3">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-md text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-background-panel text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-background-panel/50"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 bg-background-panel/40 overflow-hidden">
        {activeTab === "timeline" && (
          <div className="h-full flex">
            {/* Timeline events */}
            <div className="flex-1 p-4 overflow-x-auto custom-scrollbar">
              <div className="flex items-stretch gap-2 h-full min-w-max">
                {timelineEvents.map((event, index) => {
                  const Icon = typeIcons[event.type as keyof typeof typeIcons];
                  return (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + index * 0.05 }}
                      className="relative flex flex-col items-center"
                    >
                      {/* Connection line */}
                      {index < timelineEvents.length - 1 && (
                        <div className="absolute top-6 left-full w-2 h-0.5 bg-border" />
                      )}

                      {/* Event card */}
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="glass-panel p-3 cursor-pointer w-36 group"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className="p-1.5 rounded"
                            style={{ backgroundColor: `${typeColors[event.type as keyof typeof typeColors]}20` }}
                          >
                            <Icon
                              className="w-3.5 h-3.5"
                              style={{ color: typeColors[event.type as keyof typeof typeColors] }}
                            />
                          </div>
                          <span className="font-mono text-xs text-muted-foreground">{event.time}</span>
                        </div>
                        <p className="text-xs text-foreground truncate">{event.location}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span
                            className={`text-2xs uppercase font-medium ${
                              event.severity === "high"
                                ? "text-destructive"
                                : event.severity === "medium"
                                ? "text-warning"
                                : "text-success"
                            }`}
                          >
                            {event.severity}
                          </span>
                          <ChevronRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </motion.div>

                      {/* Time marker */}
                      <div className="mt-2 flex flex-col items-center">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: typeColors[event.type as keyof typeof typeColors] }}
                        />
                        <div className="w-0.5 h-4 bg-border" />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === "statistics" && (
          <div className="h-full p-4 flex gap-4">
            {/* Chart */}
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData}>
                  <defs>
                    <linearGradient id="fireGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="floodGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#38BDF8" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="earthquakeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(220 26% 12%)",
                      border: "1px solid hsl(220 20% 18%)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Area type="monotone" dataKey="fire" stroke="#EF4444" fill="url(#fireGrad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="flood" stroke="#38BDF8" fill="url(#floodGrad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="earthquake" stroke="#F59E0B" fill="url(#earthquakeGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Stats sidebar */}
            <div className="w-48 space-y-2">
              <div className="p-3 bg-background-panel/60 rounded-md">
                <div className="flex items-center gap-2 mb-1">
                  <Flame className="w-3.5 h-3.5 text-destructive" />
                  <span className="text-xs text-muted-foreground">Fires</span>
                </div>
                <span className="font-mono text-xl font-semibold text-destructive">28</span>
              </div>
              <div className="p-3 bg-background-panel/60 rounded-md">
                <div className="flex items-center gap-2 mb-1">
                  <Droplets className="w-3.5 h-3.5 text-info" />
                  <span className="text-xs text-muted-foreground">Floods</span>
                </div>
                <span className="font-mono text-xl font-semibold text-info">18</span>
              </div>
              <div className="p-3 bg-background-panel/60 rounded-md">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="w-3.5 h-3.5 text-warning" />
                  <span className="text-xs text-muted-foreground">Earthquakes</span>
                </div>
                <span className="font-mono text-xl font-semibold text-warning">5</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === "feed" && (
          <div className="h-full p-4">
            <div className="grid grid-cols-3 gap-4 h-full">
              {satelliteFeeds.map((feed, index) => (
                <motion.div
                  key={feed.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="relative bg-background-panel rounded-md overflow-hidden group cursor-pointer"
                >
                  {/* Fake satellite image */}
                  <div className="absolute inset-0 bg-gradient-to-br from-background-panel via-muted/5 to-background-panel" />
                  <div className="absolute inset-0 grid-pattern opacity-10" />

                  {/* Scan effect */}
                  <motion.div
                    className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent"
                    animate={{ top: ["0%", "100%"] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear", delay: index * 0.5 }}
                  />

                  {/* Telemetry */}
                  <div className="absolute inset-0 p-2 flex flex-col justify-between">
                    <div className="flex justify-between">
                      <span className="font-mono text-2xs text-primary/80">CAM-0{feed.id}</span>
                      <motion.span
                        className="font-mono text-2xs text-success"
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        ● REC
                      </motion.span>
                    </div>
                    <div className="space-y-0.5">
                      <p className="font-mono text-2xs text-muted-foreground">{feed.time} UTC</p>
                      <p className="font-mono text-2xs text-muted-foreground">
                        {feed.lat.toFixed(2)}° / {feed.lng.toFixed(2)}°
                      </p>
                      <p className="font-mono text-2xs text-info">ALT: {feed.alt}km</p>
                    </div>
                  </div>

                  {/* Noise overlay */}
                  <div className="absolute inset-0 noise-overlay opacity-30" />

                  {/* Hover effect */}
                  <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
