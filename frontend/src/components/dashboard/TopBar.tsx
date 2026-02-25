import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Satellite, Clock, AlertTriangle, Radio, Globe, Menu } from "lucide-react";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function TopBar() {
  const [time, setTime] = useState(new Date());
  const [isTransmitting, setIsTransmitting] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const transmitTimer = setInterval(() => {
      setIsTransmitting((prev) => !prev);
    }, 3000);
    return () => clearInterval(transmitTimer);
  }, []);

  const formatUTC = (date: Date) => {
    return date.toISOString().slice(11, 19);
  };

  const formatDate = (date: Date) => {
    return date.toISOString().slice(0, 10);
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 h-14 bg-background-secondary/90 backdrop-blur-xl border-b border-border/50"
    >
      <div className="h-full px-6 flex items-center justify-between">
        {/* Logo & System Name */}
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="relative">
              <Globe className="w-6 h-6 text-primary" />
              <motion.div
                className="absolute inset-0 rounded-full bg-primary/20"
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
            <span className="font-display font-semibold text-lg tracking-wide">
              SENTINEL<span className="text-primary">.</span>SAT
            </span>
          </Link>
          <div className="hidden md:block h-6 w-px bg-border" />
          <span className="hidden md:block text-2xs text-muted-foreground uppercase tracking-widest">
            Disaster Monitoring System
          </span>
          
          {/* Navigation Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="ml-4 gap-2">
                <Menu className="w-4 h-4" />
                <span className="hidden sm:inline">Menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem asChild>
                <Link to="/" className="w-full cursor-pointer">Dashboard</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/disasters" className="w-full cursor-pointer">Disaster Events</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/about" className="w-full cursor-pointer">About System</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Center - Status Indicators */}
        <div className="hidden lg:flex items-center gap-8">
          {/* Satellite Status */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Satellite className="w-4 h-4 text-success" />
              <motion.div
                className="absolute -inset-1 rounded-full bg-success/30"
                animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
            <div className="flex flex-col">
              <span className="text-3xs text-muted-foreground uppercase tracking-wider">
                Satellite
              </span>
              <span className="font-mono text-xs text-success">SAT-001 ONLINE</span>
            </div>
          </div>

          {/* Transmission Status */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Radio
                className={`w-4 h-4 transition-colors duration-300 ${
                  isTransmitting ? "text-info" : "text-muted-foreground"
                }`}
              />
              {isTransmitting && (
                <motion.div
                  className="absolute -inset-1 rounded-full bg-info/30"
                  initial={{ scale: 1, opacity: 0.6 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-3xs text-muted-foreground uppercase tracking-wider">
                Link
              </span>
              <span
                className={`font-mono text-xs transition-colors duration-300 ${
                  isTransmitting ? "text-info" : "text-muted-foreground"
                }`}
              >
                {isTransmitting ? "TRANSMITTING" : "STANDBY"}
              </span>
            </div>
          </div>

          {/* Alert Status */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <AlertTriangle className="w-4 h-4 text-warning" />
              <motion.div
                className="absolute -inset-1 rounded-full bg-warning/20"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
            <div className="flex flex-col">
              <span className="text-3xs text-muted-foreground uppercase tracking-wider">
                Alerts
              </span>
              <span className="font-mono text-xs text-warning">3 ACTIVE</span>
            </div>
          </div>
        </div>

        {/* Right - Time */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-background-panel/80 px-3 py-1.5 rounded-md border border-border/30">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            <div className="flex flex-col items-end">
              <span className="font-mono text-sm text-foreground tabular-nums">
                {formatUTC(time)}
              </span>
              <span className="font-mono text-3xs text-muted-foreground">
                {formatDate(time)} UTC
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
