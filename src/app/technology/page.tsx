'use client';

import { Server, ShieldAlert, Cpu, Code2, Layers, Search, Workflow, Braces } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TechnologyPage() {
  return (
    <div className="container mx-auto max-w-5xl px-4 sm:px-6 py-section">
      
      {/* Hero */}
      <div className="text-center mb-16 sm:mb-24 max-w-3xl mx-auto">
        <h1 className="text-fluid-display font-bold tracking-tight mb-4 sm:mb-6">
          Behind the verdict.
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-foreground/70 font-medium">
          A scalable, multi-model approach to digital forensics.
        </p>
      </div>

      {/* Visual Architecture — Fully responsive, no min-width */}
      <div className="glass-panel p-4 sm:p-8 md:p-12 mb-16 sm:mb-24 text-center overflow-hidden relative">
        <div className="text-[10px] sm:text-xs font-bold tracking-widest text-foreground/50 mb-8 sm:mb-12">SYSTEM ARCHITECTURE</div>
        
        <div className="flex flex-col items-center gap-3 sm:gap-4 relative">
          
          {/* Animated Traveling Signal — Hidden on very small screens for performance */}
          <motion.div 
            className="hidden sm:block absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-accent shadow-[0_0_10px_rgba(59,130,246,0.8)] z-10"
            animate={{ top: ["0%", "100%"], opacity: [0, 1, 1, 1, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          />
          
          {/* CONTENT */}
          <div className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg border border-border bg-surface text-xs sm:text-sm font-bold tracking-widest w-full max-w-[16rem]">
            CONTENT
          </div>
          
          <div className="w-[1px] h-6 sm:h-8 bg-border"></div>
          
          {/* Preprocessing steps — Responsive grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 w-full">
            {['MEDIA PREPROCESSING', 'FRAME EXTRACTION', 'QUALITY CHECKS', 'METADATA PARSING'].map((step, i) => (
              <div key={i} className="px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg border border-border/50 bg-surface/50 text-[8px] sm:text-[10px] font-mono text-foreground/60 flex items-center justify-center text-center leading-tight">
                {step}
              </div>
            ))}
          </div>
          
          <div className="w-[1px] h-6 sm:h-8 bg-border"></div>
          
          {/* MULTI-SIGNAL ANALYSIS */}
          <div className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg border border-accent/50 bg-accent/10 text-accent text-xs sm:text-sm font-bold tracking-widest w-full max-w-[16rem] shadow-[0_0_15px_rgba(59,130,246,0.15)]">
            MULTI-SIGNAL ANALYSIS
          </div>
          
          {/* Branch connectors — Simplified for mobile */}
          <div className="flex gap-8 sm:gap-16 mt-1 sm:mt-2 mb-1 sm:mb-2">
            <div className="w-[1px] h-6 sm:h-8 bg-border/50 -rotate-45 translate-x-2 sm:translate-x-4"></div>
            <div className="w-[1px] h-6 sm:h-8 bg-border/50 rotate-45 -translate-x-2 sm:-translate-x-4"></div>
          </div>
          
          {/* Engine cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-8 w-full max-w-2xl">
            <div className="p-3 sm:p-4 rounded-lg border border-border bg-surface/30">
              <div className="text-[10px] sm:text-xs font-bold mb-1 sm:mb-2">HEURISTIC ENGINE</div>
              <div className="text-[9px] sm:text-[10px] text-foreground/50 leading-relaxed">Resolution and low-detail heuristics, plus SHA-256 fingerprints of the analysed samples.</div>
            </div>
            <div className="p-3 sm:p-4 rounded-lg border border-border bg-surface/30">
              <div className="text-[10px] sm:text-xs font-bold mb-1 sm:mb-2">ML INFERENCE ENGINE</div>
              <div className="text-[9px] sm:text-[10px] text-foreground/50 leading-relaxed">AI-generation and face-manipulation classifiers; visual sample and quality checks.</div>
            </div>
          </div>
          
          {/* Branch connectors */}
          <div className="flex gap-8 sm:gap-16 mt-1 sm:mt-2 mb-1 sm:mb-2">
            <div className="w-[1px] h-6 sm:h-8 bg-border/50 rotate-45 translate-x-2 sm:translate-x-4"></div>
            <div className="w-[1px] h-6 sm:h-8 bg-border/50 -rotate-45 -translate-x-2 sm:-translate-x-4"></div>
          </div>
          
          {/* SIGNAL AGGREGATION */}
          <div className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg border border-border bg-surface text-xs sm:text-sm font-bold tracking-widest w-full max-w-[16rem]">
            SIGNAL AGGREGATION
          </div>
          
          <div className="w-[1px] h-6 sm:h-8 bg-border"></div>
          
          {/* EXPLAINABLE VERDICT */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 rounded-lg border-2 border-border bg-background text-sm sm:text-base md:text-lg font-bold tracking-widest w-full max-w-[16rem] shadow-xl">
            EXPLAINABLE VERDICT
          </div>
          
        </div>
      </div>

      {/* Tech Stack Cards */}
      <div className="text-center mb-10 sm:mb-16">
        <h2 className="text-fluid-heading font-bold tracking-tight mb-4">Core Technologies</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { title: "Browser Canvas", desc: "Extracts three visual samples from browser-playable videos.", icon: Code2 },
          { title: "Provider APIs", desc: "Server-side calls to Sightengine, OCR.Space, and SerpApi; provider policies apply.", icon: Server },
          { title: "Sample Fingerprints", desc: "SHA-256 identifies analysed bytes; it does not certify origin.", icon: ShieldAlert },
          { title: "OCR & Search", desc: "Extracts image text and retrieves visual source matches.", icon: Layers },
          { title: "Image Quality", desc: "Resolution and low-detail warnings; audio is not analysed.", icon: Workflow },
          { title: "Face Manipulation", desc: "Provider confidence for identity-level face swaps; no localized heatmap.", icon: Search },
          { title: "Video Sampling", desc: "Three timestamped visual samples; no temporal or lip-sync model.", icon: Cpu },
          { title: "Inspectable Report", desc: "Task-specific model outputs, checked samples, fingerprints, and limitations.", icon: Braces },
        ].map((tech, i) => (
          <div key={i} className="glass-card p-4 sm:p-5">
            <tech.icon className="w-5 h-5 text-accent mb-2 sm:mb-3" />
            <h3 className="text-xs sm:text-sm font-bold mb-1 sm:mb-2">{tech.title}</h3>
            <p className="text-[10px] sm:text-xs text-foreground/60 leading-relaxed">{tech.desc}</p>
          </div>
        ))}
      </div>

    </div>
  );
}
