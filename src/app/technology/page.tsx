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
            {['MEDIA PREPROCESSING', 'FRAME EXTRACTION', 'AUDIO SEPARATION', 'METADATA PARSING'].map((step, i) => (
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
              <div className="text-[9px] sm:text-[10px] text-foreground/50 leading-relaxed">Rule-based metadata checks, C2PA validation, and compression analysis.</div>
            </div>
            <div className="p-3 sm:p-4 rounded-lg border border-border bg-surface/30">
              <div className="text-[10px] sm:text-xs font-bold mb-1 sm:mb-2">ML INFERENCE ENGINE</div>
              <div className="text-[9px] sm:text-[10px] text-foreground/50 leading-relaxed">Spectral classifiers, temporal consistency models, and audio/video sync networks.</div>
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
          { title: "FFmpeg", desc: "For robust media preprocessing and frame extraction.", icon: Code2 },
          { title: "Stateless APIs", desc: "Ensuring no data persistence during inference.", icon: Server },
          { title: "C2PA Validation", desc: "Checking hardware-signed provenance manifests.", icon: ShieldAlert },
          { title: "Transformers", desc: "For text and multimodal consistency analysis.", icon: Layers },
          { title: "Audio Forensics", desc: "Detecting vocoder artifacts in synthetic speech.", icon: Workflow },
          { title: "Spatial Analysis", desc: "Detecting edge blending and cloning artifacts.", icon: Search },
          { title: "Temporal Modeling", desc: "Using RNNs to find unnatural motion patterns.", icon: Cpu },
          { title: "Explainable AI", desc: "Mapping model activations to human-readable evidence.", icon: Braces },
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
