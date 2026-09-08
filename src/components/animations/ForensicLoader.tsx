'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Activity } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function ForensicLoader() {
  const [hexCode, setHexCode] = useState('0x00000000');
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) return;
    // Generate random memory addresses for a tech feel
    const interval = setInterval(() => {
      setHexCode('0x' + Math.floor(Math.random() * 4294967295).toString(16).toUpperCase().padStart(8, '0'));
    }, 60);
    return () => clearInterval(interval);
  }, [prefersReducedMotion]);

  // Simplified static loader for reduced motion
  if (prefersReducedMotion) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] w-full">
        <div className="relative w-16 h-16 bg-surface border border-accent/80 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.3)] mb-8">
          <Activity className="w-7 h-7 text-accent" />
        </div>
        <div className="text-sm text-white tracking-[0.4em] font-bold mb-2">SYSTEM_INIT</div>
        <div className="text-[11px] text-accent/80 tracking-widest font-semibold">LOADING...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full relative overflow-hidden">
      
      {/* Background Grid Overlay */}
      <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
        <div className="w-[120%] h-[120%] bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:20px_20px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_20%,transparent_100%)]"></div>
      </div>

      {/* Responsive ring container — Smaller on mobile */}
      <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 mb-8 sm:mb-10 flex items-center justify-center">
        
        {/* Core Radar Pulse */}
        <motion.div 
          className="absolute inset-0 border border-accent/50 rounded-full"
          animate={{ scale: [0.8, 1.8], opacity: [1, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
        />
        <motion.div 
          className="absolute inset-0 border border-accent/50 rounded-full"
          animate={{ scale: [0.8, 1.8], opacity: [1, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 1 }}
        />
        
        {/* Outer Complex Tech Ring */}
        <motion.svg 
          className="absolute inset-1 sm:inset-2 w-[calc(100%-8px)] sm:w-[calc(100%-16px)] h-[calc(100%-8px)] sm:h-[calc(100%-16px)] opacity-80" 
          viewBox="0 0 100 100"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-accent/30" />
          <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="12 6 2 6" className="text-accent" />
          <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="4 20" className="text-accent/80" />
        </motion.svg>

        {/* Inner Counter-rotating Ring */}
        <motion.svg 
          className="absolute inset-4 sm:inset-6 w-[calc(100%-32px)] sm:w-[calc(100%-48px)] h-[calc(100%-32px)] sm:h-[calc(100%-48px)] opacity-60" 
          viewBox="0 0 100 100"
          animate={{ rotate: -360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        >
          <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="25 40" className="text-white" />
          <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2 8" className="text-accent/50" />
        </motion.svg>

        {/* Center Node */}
        <motion.div 
          className="relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-surface border border-accent/80 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.3)] z-10 backdrop-blur-sm"
          animate={{ boxShadow: ["0 0 15px rgba(59,130,246,0.2)", "0 0 40px rgba(59,130,246,0.7)", "0 0 15px rgba(59,130,246,0.2)"] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Activity className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-accent" />
        </motion.div>
      </div>
      
      {/* Loading Readout */}
      <div className="text-center font-mono relative z-10 flex flex-col items-center">
        <motion.div 
          className="text-xs sm:text-sm text-white tracking-[0.3em] sm:tracking-[0.4em] font-bold mb-2 flex items-center gap-3"
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <span>SYSTEM_INIT</span>
        </motion.div>
        
        {/* Dynamic Hex Readout */}
        <div className="text-[10px] sm:text-[11px] text-accent/80 tracking-widest mb-4 sm:mb-6 h-4 font-semibold">
          MEM_ADDR: {hexCode}
        </div>
        
        {/* Segmented Progress Bar */}
        <div className="flex gap-1 sm:gap-1.5 justify-center">
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.div
              key={i}
              className="w-3 sm:w-4 h-1 sm:h-1.5 rounded-sm bg-accent/20"
            >
              <motion.div 
                className="w-full h-full rounded-sm bg-accent shadow-[0_0_8px_rgba(59,130,246,0.8)]"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity, 
                  delay: i * 0.15,
                  ease: "linear"
                }}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
