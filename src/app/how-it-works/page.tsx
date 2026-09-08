import { Maximize, Activity, Eye, Link as LinkIcon, ArrowDown } from 'lucide-react';
import Link from 'next/link';

export default function HowItWorksPage() {
  return (
    <div className="container mx-auto max-w-5xl px-4 sm:px-6 py-section">
      
      {/* Hero */}
      <div className="text-center mb-12 sm:mb-16 md:mb-24 max-w-3xl mx-auto">
        <h1 className="text-fluid-display font-bold tracking-tight mb-4 sm:mb-6">
          From content to evidence.
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-foreground/70 font-medium">
          A transparent look into the Clarifake verification pipeline.
        </p>
      </div>

      {/* 3 Step Flow */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-16 sm:mb-24 md:mb-32 relative">
        {/* Vertical connector on mobile */}
        <div className="md:hidden absolute top-0 bottom-0 left-1/2 w-[1px] bg-border/30 -translate-x-1/2 z-0"></div>

        <div className="glass-panel p-5 sm:p-6 md:p-8 text-center flex flex-col items-center relative z-10">
          <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-surface border-2 border-border flex items-center justify-center text-base sm:text-lg md:text-xl font-bold mb-4 sm:mb-6">01</div>
          <h3 className="text-base sm:text-lg font-bold mb-2 sm:mb-3 tracking-wide">UPLOAD</h3>
          <p className="text-xs sm:text-sm text-foreground/60">Select an image, video, audio file, text excerpt, or URL for analysis. Content is processed in a secure, ephemeral session.</p>
        </div>
        
        <div className="glass-panel p-5 sm:p-6 md:p-8 text-center flex flex-col items-center border-accent/30 shadow-[0_0_30px_rgba(59,130,246,0.1)] relative z-10">
          {/* Desktop arrows */}
          <div className="hidden md:block absolute -left-4 top-1/2 -translate-y-1/2 text-accent animate-pulse"><ArrowDown className="w-5 sm:w-6 h-5 sm:h-6 -rotate-90" /></div>
          <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-accent/10 border-2 border-accent flex items-center justify-center text-base sm:text-lg md:text-xl font-bold text-accent mb-4 sm:mb-6 shadow-[0_0_15px_rgba(59,130,246,0.3)]">02</div>
          <h3 className="text-base sm:text-lg font-bold mb-2 sm:mb-3 tracking-wide">ANALYZE</h3>
          <p className="text-xs sm:text-sm text-foreground/60">Independent forensic signals run in parallel, extracting metadata, pixel arrays, temporal consistency, and spectral data.</p>
          <div className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 text-accent animate-pulse"><ArrowDown className="w-5 sm:w-6 h-5 sm:h-6 -rotate-90" /></div>
        </div>
        
        <div className="glass-panel p-5 sm:p-6 md:p-8 text-center flex flex-col items-center relative z-10">
          <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-surface border-2 border-border flex items-center justify-center text-base sm:text-lg md:text-xl font-bold mb-4 sm:mb-6">03</div>
          <h3 className="text-base sm:text-lg font-bold mb-2 sm:mb-3 tracking-wide">UNDERSTAND</h3>
          <p className="text-xs sm:text-sm text-foreground/60">Receive a probabilistic confidence score, a breakdown of individual signal evaluations, and an explainable evidence summary.</p>
        </div>
      </div>

      {/* Signal Checks */}
      <div className="text-center mb-10 sm:mb-16">
        <h2 className="text-fluid-heading font-bold tracking-tight mb-3 sm:mb-4">The Four Pillars of Verification</h2>
        <p className="text-foreground/60 text-sm sm:text-base">We don&apos;t rely on a single black-box AI model.</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div className="glass-card p-4 sm:p-5 md:p-6 flex items-start gap-3 sm:gap-4">
          <div className="p-2.5 sm:p-3 bg-surface rounded-xl border border-border flex-shrink-0"><Maximize className="w-5 sm:w-6 h-5 sm:h-6 text-accent" /></div>
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-bold tracking-wide mb-1 sm:mb-2">Spectral &amp; Pixel Analysis</h3>
            <p className="text-xs sm:text-sm text-foreground/60 leading-relaxed">Examines image and video frames at the pixel level to detect blending boundaries, GAN artifacts, and unnatural frequency distributions common in generative models.</p>
          </div>
        </div>
        
        <div className="glass-card p-4 sm:p-5 md:p-6 flex items-start gap-3 sm:gap-4">
          <div className="p-2.5 sm:p-3 bg-surface rounded-xl border border-border flex-shrink-0"><Activity className="w-5 sm:w-6 h-5 sm:h-6 text-accent" /></div>
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-bold tracking-wide mb-1 sm:mb-2">Temporal Analysis</h3>
            <p className="text-xs sm:text-sm text-foreground/60 leading-relaxed">Analyzes video frames across time to identify unnatural motion, inconsistent lighting changes, or sudden shifts in facial micro-expressions typical of deepfakes.</p>
          </div>
        </div>
        
        <div className="glass-card p-4 sm:p-5 md:p-6 flex items-start gap-3 sm:gap-4">
          <div className="p-2.5 sm:p-3 bg-surface rounded-xl border border-border flex-shrink-0"><Eye className="w-5 sm:w-6 h-5 sm:h-6 text-accent" /></div>
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-bold tracking-wide mb-1 sm:mb-2">Audio-Visual Sync</h3>
            <p className="text-xs sm:text-sm text-foreground/60 leading-relaxed">Measures the synchronization between spoken phonemes and lip movements, a common failure point in current lip-syncing and face-swapping algorithms.</p>
          </div>
        </div>
        
        <div className="glass-card p-4 sm:p-5 md:p-6 flex items-start gap-3 sm:gap-4">
          <div className="p-2.5 sm:p-3 bg-surface rounded-xl border border-border flex-shrink-0"><LinkIcon className="w-5 sm:w-6 h-5 sm:h-6 text-accent" /></div>
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-bold tracking-wide mb-1 sm:mb-2">Source &amp; Metadata</h3>
            <p className="text-xs sm:text-sm text-foreground/60 leading-relaxed">Inspects file headers, compression history, EXIF data, and C2PA provenance credentials to establish a chain of custody for the digital asset.</p>
          </div>
        </div>
      </div>
      
      <div className="mt-12 sm:mt-16 md:mt-20 text-center">
        <Link href="/verify" className="inline-flex items-center justify-center px-6 sm:px-8 py-3.5 sm:py-4 text-base font-bold bg-white text-black rounded-xl hover:bg-gray-200 transition-colors touch-target">
          Try it with your content
        </Link>
      </div>

    </div>
  );
}
