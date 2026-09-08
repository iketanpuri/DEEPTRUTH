'use client';

import { motion, useReducedMotion } from 'framer-motion';

export function BackgroundMotion() {
  const prefersReducedMotion = useReducedMotion();

  // Skip animation entirely if user prefers reduced motion
  if (prefersReducedMotion) {
    return (
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-accent/5 rounded-full blur-[80px] sm:blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[60px] sm:blur-[100px]" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
      {/* Subtle moving gradient — reduced blur on mobile for performance */}
      <motion.div
        className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-accent/5 rounded-full blur-[80px] sm:blur-[120px]"
        animate={{
          x: [0, 50, 0, -50, 0],
          y: [0, 30, 60, 30, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear"
        }}
      />
      <motion.div
        className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[60px] sm:blur-[100px]"
        animate={{
          x: [0, -40, 0, 40, 0],
          y: [0, -30, -60, -30, 0],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "linear"
        }}
      />
    </div>
  );
}
