import { motion } from "framer-motion";
import { TopBar } from "@/components/dashboard/TopBar";
import { Link } from "react-router-dom";
import { 
  Satellite, 
  Globe, 
  Shield, 
  Cpu, 
  Database, 
  Radio,
  Camera,
  AlertTriangle,
  Users,
  Zap,
  Clock,
  Target,
  Layers,
  Server
} from "lucide-react";

const techStack = [
  { name: "React", description: "UI Framework" },
  { name: "TypeScript", description: "Type Safety" },
  { name: "Tailwind CSS", description: "Styling" },
  { name: "FastAPI", description: "Backend API" },
  { name: "Leaflet", description: "Mapping" },
  { name: "HuggingFace", description: "AI Models" },
  { name: "ESP32", description: "Hardware" },
  { name: "OpenCV", description: "Image Processing" },
];

const features = [
  {
    icon: Camera,
    title: "ESP32-CAM Monitoring",
    description: "Real-time video streaming from ESP32 cameras with motion detection and event alerts."
  },
  {
    icon: Satellite,
    title: "NASA Satellite Imagery",
    description: "Access to high-quality satellite images for comprehensive area monitoring and analysis."
  },
  {
    icon: AlertTriangle,
    title: "AI-Powered Detection",
    description: "Machine learning models analyze images to detect fires, floods, smoke, and other hazards in real-time."
  },
  {
    icon: Globe,
    title: "Interactive Mapping",
    description: "Leaflet-based maps with real-time event markers and coverage visualization."
  },
  {
    icon: Radio,
    title: "HTTP API Communication",
    description: "Simple REST API for seamless integration and real-time data updates."
  },
  {
    icon: Shield,
    title: "Reliable Operations",
    description: "Minimal architecture with robust error handling and automatic recovery systems."
  },
];

const About = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopBar />

      <main className="flex-1 pt-14 overflow-auto">
        {/* Hero Section */}
        <section className="relative py-20 px-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center relative z-10"
          >
            <Link to="/" className="inline-block text-muted-foreground hover:text-foreground transition-colors mb-8">
              ← Back to Dashboard
            </Link>
            
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="w-24 h-24 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-6"
            >
              <Satellite className="w-12 h-12 text-primary" />
            </motion.div>
            
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
              <span className="text-primary">SENTINEL</span>
              <span className="text-muted-foreground">.SAT</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-6">
              ESP32 Camera & NASA Satellite Monitoring System
            </p>
            <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              A simple and robust monitoring platform for real-time disaster detection, 
              leveraging ESP32 cameras and NASA satellite imagery with AI-powered analysis.
            </p>
          </motion.div>
        </section>

        {/* Mission Section */}
        <section className="py-16 px-6">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="grid md:grid-cols-2 gap-12 items-center"
            >
              <div>
                <h2 className="text-2xl font-display font-bold mb-4 flex items-center gap-2">
                  <Target className="w-6 h-6 text-primary" />
                  Our Mission
                </h2>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  SENTINEL.SAT is designed to provide early warning and real-time monitoring of natural disasters 
                  using ESP32 cameras and AI-powered image analysis.
                </p>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  Our system processes camera imagery through machine learning models trained to detect 
                  wildfires, floods, smoke, and other disturbances, enabling rapid response and 
                  potentially saving lives.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  The platform integrates ESP32-CAM modules for cost-effective monitoring, 
                  demonstrating that effective disaster monitoring can be achieved with accessible technology.
                </p>
              </div>
              <div className="bg-background-panel/60 rounded-lg border border-border/30 p-6">
                <h3 className="text-lg font-display font-semibold mb-4 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-info" />
                  System Architecture
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-background-secondary/50 rounded-md">
                    <Camera className="w-5 h-5 text-primary" />
                    <div>
                      <div className="text-sm font-medium">Camera Layer</div>
                      <div className="text-2xs text-muted-foreground">ESP32-CAM modules & NASA imagery</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-background-secondary/50 rounded-md">
                    <Radio className="w-5 h-5 text-warning" />
                    <div>
                      <div className="text-sm font-medium">Communication Layer</div>
                      <div className="text-2xs text-muted-foreground">HTTP API & real-time polling</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-background-secondary/50 rounded-md">
                    <Server className="w-5 h-5 text-info" />
                    <div>
                      <div className="text-sm font-medium">Processing Layer</div>
                      <div className="text-2xs text-muted-foreground">HuggingFace AI analysis</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-background-secondary/50 rounded-md">
                    <Cpu className="w-5 h-5 text-success" />
                    <div>
                      <div className="text-sm font-medium">Application Layer</div>
                      <div className="text-2xs text-muted-foreground">React dashboard interface</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-16 px-6 bg-background-secondary/30">
          <div className="max-w-6xl mx-auto">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-display font-bold mb-8 text-center flex items-center justify-center gap-2"
            >
              <Zap className="w-6 h-6 text-primary" />
              Key Features
            </motion.h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.1 }}
                  className="bg-background-panel/60 rounded-lg border border-border/30 p-6 hover:border-primary/30 transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-display font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Tech Stack */}
        <section className="py-16 px-6">
          <div className="max-w-4xl mx-auto">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-display font-bold mb-8 text-center flex items-center justify-center gap-2"
            >
              <Database className="w-6 h-6 text-primary" />
              Technology Stack
            </motion.h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {techStack.map((tech, index) => (
                <motion.div
                  key={tech.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  className="bg-background-panel/60 rounded-lg border border-border/30 p-4 text-center hover:border-primary/30 transition-colors"
                >
                  <div className="font-mono text-sm text-primary mb-1">{tech.name}</div>
                  <div className="text-2xs text-muted-foreground">{tech.description}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        </main>
    </div>
  );
};

export default About;
