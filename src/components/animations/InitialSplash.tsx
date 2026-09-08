'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import ForensicLoader from './ForensicLoader';

export default function InitialSplash() {
  const [showSplash, setShowSplash] = useState(true);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    // Shorter splash on mobile / reduced motion for faster perceived load
    const duration = prefersReducedMotion ? 1500 : 3500;
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, duration);

    return () => clearTimeout(timer);
  }, [prefersReducedMotion]);

  return (
    <AnimatePresence>
      {showSplash && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, filter: prefersReducedMotion ? 'none' : 'blur(10px)' }}
          transition={{ duration: prefersReducedMotion ? 0.3 : 0.8, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center"
          style={{
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
        >
          <motion.div
            initial={{ scale: prefersReducedMotion ? 1 : 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: prefersReducedMotion ? 0.2 : 0.5, ease: "easeOut" }}
          >
            <ForensicLoader />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
