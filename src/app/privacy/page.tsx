'use client';

import { ShieldCheck, UserX, Database, Fingerprint, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PrivacyPage() {
  return (
    <div className="container mx-auto max-w-5xl px-4 sm:px-6 py-section">
      
      {/* Hero */}
      <div className="text-center mb-12 sm:mb-16 md:mb-24 max-w-3xl mx-auto">
        <h1 className="text-fluid-display font-bold tracking-tight mb-4 sm:mb-6">
          Verification without surveillance.
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-foreground/70 font-medium">
          Your content should help answer a question — not become someone else&apos;s dataset.
        </p>
      </div>

      {/* Visual Flow */}
      <div className="glass-panel p-4 sm:p-8 md:p-12 lg:p-16 mb-12 sm:mb-16 md:mb-24 text-center">
        <div className="text-[10px] sm:text-xs font-bold tracking-widest text-foreground/50 mb-8 sm:mb-12">THE CLARIFAKE PRIVACY ARCHITECTURE</div>
        
        <div className="flex flex-col md:flex-row items-center justify-center gap-3 sm:gap-4 md:gap-6 lg:gap-8 relative">
          
          {/* Animated Traveling Data Point (Desktop) */}
          <motion.div 
            className="hidden md:block absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-accent shadow-[0_0_10px_rgba(59,130,246,0.8)] z-10" 
            animate={{ left: ["0%", "100%"], opacity: [0, 1, 1, 1, 0] }} 
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }} 
          />
          
          {/* Animated Traveling Data Point (Mobile) */}
          <motion.div 
            className="md:hidden absolute left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-accent shadow-[0_0_10px_rgba(59,130,246,0.8)] z-10" 
            animate={{ top: ["0%", "100%"], opacity: [0, 1, 1, 1, 0] }} 
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }} 
          />

          <div className="flex flex-col items-center relative z-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-surface border border-border flex items-center justify-center mb-3 sm:mb-4 relative bg-background">
              <UserX className="w-5 sm:w-6 h-5 sm:h-6 text-accent" />
            </div>
            <div className="text-xs sm:text-sm font-bold tracking-wide">USER</div>
          </div>
          
          <div className="hidden md:block w-8 lg:w-12 h-[2px] bg-border relative z-0"></div>
          <div className="md:hidden h-6 sm:h-8 w-[2px] bg-border my-1 relative z-0"></div>
          
          <div className="flex flex-col items-center relative z-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-surface border border-border flex items-center justify-center mb-3 sm:mb-4 relative bg-background">
              <Eye className="w-5 sm:w-6 h-5 sm:h-6 text-foreground/60" />
            </div>
            <div className="text-[10px] sm:text-xs md:text-sm font-bold tracking-wide text-foreground/80">TEMPORARY PROCESSING</div>
          </div>
          
          <div className="hidden md:block w-8 lg:w-12 h-[2px] bg-border relative z-0"></div>
          <div className="md:hidden h-6 sm:h-8 w-[2px] bg-border my-1 relative z-0"></div>
          
          <div className="flex flex-col items-center relative z-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-surface border border-border flex items-center justify-center mb-3 sm:mb-4 relative bg-background">
              <ShieldCheck className="w-5 sm:w-6 h-5 sm:h-6 text-authentic" />
            </div>
            <div className="text-xs sm:text-sm font-bold tracking-wide">VERDICT</div>
          </div>
          
          <div className="hidden md:block w-8 lg:w-12 h-[2px] bg-border relative z-0"></div>
          <div className="md:hidden h-6 sm:h-8 w-[2px] bg-border my-1 relative z-0"></div>
          
          <div className="flex flex-col items-center relative z-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-surface border-red-500/20 border-dashed flex items-center justify-center mb-3 sm:mb-4 relative bg-background">
              <Database className="w-5 sm:w-6 h-5 sm:h-6 text-red-500/60" />
            </div>
            <div className="text-[10px] sm:text-xs md:text-sm font-bold tracking-wide text-red-500/80">CONTENT DISCARDED</div>
          </div>
        </div>
      </div>

      {/* Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
        {[
          { title: "No Account", desc: "Core verification works completely anonymously without requiring a login or email address.", icon: UserX },
          { title: "No Content Retention", desc: "Uploaded media is analyzed in memory and permanently deleted immediately after the session.", icon: Database },
          { title: "No User Profiling", desc: "We don't track what you verify or build profiles based on your verification history.", icon: Fingerprint },
          { title: "Transparent Analysis", desc: "You see exactly which checks were performed and what evidence led to the verdict.", icon: Eye },
        ].map((item, i) => (
          <div key={i} className="glass-card p-5 sm:p-6 md:p-8 flex flex-col gap-3 sm:gap-4">
            <item.icon className="w-6 sm:w-8 h-6 sm:h-8 text-accent" />
            <h3 className="text-base sm:text-lg md:text-xl font-bold tracking-wide">{item.title}</h3>
            <p className="text-sm sm:text-base text-foreground/60 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>
      
    </div>
  );
}
