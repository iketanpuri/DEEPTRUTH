'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FileVideo, FileImage, FileAudio, FileText, Link as LinkIcon, Lock, X, PlayCircle, ShieldCheck, Camera, ChevronRight, Activity, Search, AlertTriangle, FileCheck } from 'lucide-react';
import clsx from 'clsx';

const CONTENT_TYPES = [
  { id: 'text', label: 'Text/Claim', icon: FileText, accept: undefined },
  { id: 'url', label: 'URL', icon: LinkIcon, accept: undefined },
  { id: 'image', label: 'Image', icon: FileImage, accept: 'image/*' },
  { id: 'video', label: 'Video', icon: FileVideo, accept: 'video/*' },
  { id: 'audio', label: 'Audio', icon: FileAudio, accept: 'audio/*' },
];

// Investigation sequence steps based on user's hackathon prompt
const VERIFICATION_STEPS = [
  { id: 1, label: "Extracting claims", icon: FileText },
  { id: 2, label: "Finding relevant sources", icon: Search },
  { id: 3, label: "Comparing evidence", icon: Activity },
  { id: 4, label: "Checking contradictions", icon: AlertTriangle },
  { id: 5, label: "Evaluating context", icon: FileCheck },
  { id: 6, label: "Building verdict", icon: ShieldCheck }
];

export default function VerifyPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('text');
  const [uploadState, setUploadState] = useState<'idle' | 'ready' | 'analyzing'>('idle');
  const [progress, setProgress] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  
  const [textContent, setTextContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeType = CONTENT_TYPES.find(t => t.id === activeTab);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setTextContent('');
      setUploadState('ready');
    }
  };

  const handleTextSubmit = () => {
    if (textContent.trim().length < 5) {
      alert("Please enter a valid claim or text content.");
      return;
    }
    setUploadState('ready');
  };

  // Video frame extraction logic retained to ensure media forensics works
  const extractVideoFrame = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.playsInline = true;
      video.muted = true;
      const url = URL.createObjectURL(file);
      video.src = url;

      video.onloadedmetadata = () => {
        video.currentTime = Math.min(1, video.duration / 2);
      };

      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Failed to get canvas context'));
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) resolve(new File([blob], `frame_${file.name}.jpg`, { type: 'image/jpeg' }));
          else reject(new Error('Failed to extract frame blob'));
        }, 'image/jpeg', 0.9);
      };
      video.onerror = () => reject(new Error('Error loading video file'));
    });
  };

  const startAnalysis = async () => {
    setUploadState('analyzing');
    setProgress(0);
    setActiveStep(1);

    // Simulated progress logic for the animated right pane
    const totalDuration = 12000; // 12 seconds for full verification
    const intervalTime = 200;
    const increment = (100 / (totalDuration / intervalTime));

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const next = prev + increment;
        if (next < 100) return next;
        return 100;
      });
    }, intervalTime);

    const stepInterval = setInterval(() => {
      setActiveStep(prev => prev < 6 ? prev + 1 : prev);
    }, totalDuration / 6);

    try {
      let finalResultData;

      if (activeTab === 'text' || activeTab === 'url') {
        // Call the new Evidence-Driven Verification Pipeline
        const response = await fetch('/api/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: textContent, type: activeTab })
        });
        
        if (!response.ok) throw new Error('Verification pipeline failed');
        finalResultData = await response.json();

      } else {
        // Media Upload Flow
        const formData = new FormData();
        let fileToSend = selectedFile;
        if (selectedFile && selectedFile.type.startsWith('video/')) {
           fileToSend = await extractVideoFrame(selectedFile);
        }
        if (fileToSend) formData.append('file', fileToSend);
        formData.append('type', activeTab);

        const response = await fetch('/api/analyze', { method: 'POST', body: formData });
        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.error || 'Media analysis failed. The API might be blocked by your ISP.');
        }
        finalResultData = await response.json();
      }

      clearInterval(progressInterval);
      clearInterval(stepInterval);
      setProgress(100);
      setActiveStep(6);

      sessionStorage.setItem('analysisResult', JSON.stringify(finalResultData));

      // Redirect to results page after short delay
      setTimeout(() => {
        router.push(`/results?id=${finalResultData.id}`);
      }, 800);

    } catch (err: any) {
      console.error(err);
      clearInterval(progressInterval);
      clearInterval(stepInterval);
      setUploadState('idle');
      alert(err.message || 'Verification failed. Please try again.');
    }
  };

  const cancelUpload = () => {
    setUploadState('idle');
    setSelectedFile(null);
    setTextContent('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 pt-24 pb-12 min-h-[90vh] flex flex-col">
      <div className="mb-10 text-center sm:text-left">
        <h1 className="text-4xl font-extrabold mb-3 tracking-tight font-['Chakra_Petch',sans-serif]">Live Verification Engine</h1>
        <p className="text-foreground/60 max-w-2xl text-lg">
          Upload media or paste a claim. Clarifake will extract context, cross-reference sources, and build an explainable evidence timeline.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-grow">
        
        {/* LEFT PANE: Input Section */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="glass-panel p-6 rounded-2xl border border-border shadow-2xl flex-grow flex flex-col">
            <h2 className="text-xl font-bold mb-6 font-['Chakra_Petch',sans-serif] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
              Input Source
            </h2>
            
            {/* Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
              {CONTENT_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => { setActiveTab(type.id); cancelUpload(); }}
                  className={clsx(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border",
                    activeTab === type.id 
                      ? "bg-accent/10 border-accent text-white" 
                      : "bg-surface/50 border-transparent text-foreground/60 hover:bg-surface hover:text-white"
                  )}
                >
                  <type.icon className="w-4 h-4" />
                  {type.label}
                </button>
              ))}
            </div>

            {/* Input Area */}
            <div className="flex-grow flex flex-col justify-center">
              {uploadState === 'idle' ? (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="w-full"
                  >
                    {activeTab === 'text' || activeTab === 'url' ? (
                      <div className="flex flex-col gap-4">
                        <textarea 
                          value={textContent}
                          onChange={(e) => setTextContent(e.target.value)}
                          placeholder={activeTab === 'text' ? "Paste a factual claim, news snippet, or social media post here..." : "https://..."}
                          className="w-full h-48 bg-[#0B0A10] border border-border rounded-xl p-4 resize-none focus:outline-none focus:border-accent text-white placeholder-foreground/30 font-['Inter',sans-serif]"
                        />
                        <button 
                          onClick={handleTextSubmit}
                          className="w-full bg-white text-black font-bold py-3.5 rounded-xl hover:bg-gray-200 transition-colors shadow-lg"
                        >
                          Submit for Verification
                        </button>
                      </div>
                    ) : (
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full aspect-square max-h-64 border-2 border-dashed border-border/60 rounded-xl flex flex-col items-center justify-center p-6 cursor-pointer hover:border-accent/50 hover:bg-accent/5 transition-all group relative overflow-hidden bg-[#0B0A10]"
                      >
                        <div className="bg-surface p-4 rounded-full mb-4 group-hover:scale-110 transition-transform shadow-lg">
                          <UploadCloud className="w-8 h-8 text-accent" />
                        </div>
                        <h3 className="text-lg font-bold mb-1">Upload {activeType?.label}</h3>
                        <p className="text-foreground/50 text-sm mb-4 text-center">Drag and drop or click to browse</p>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept={activeType?.accept}
                          className="hidden"
                          onChange={handleFileSelect}
                        />
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full bg-[#0B0A10] border border-border rounded-xl p-6 relative overflow-hidden"
                >
                  <button onClick={cancelUpload} disabled={uploadState === 'analyzing'} className="absolute top-4 right-4 text-foreground/50 hover:text-white z-10 disabled:opacity-50">
                    <X className="w-5 h-5" />
                  </button>
                  <div className="flex flex-col items-center text-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center border border-accent/30 shadow-[0_0_15px_rgba(244,183,64,0.2)]">
                      <ShieldCheck className="w-8 h-8 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-white mb-1">
                        {activeTab === 'text' ? 'Text Claim Ready' : activeTab === 'url' ? 'URL Ready' : selectedFile?.name}
                      </h3>
                      <p className="text-sm text-foreground/50 mb-6 line-clamp-2 px-4">
                        {textContent || `${(selectedFile?.size || 0) / 1024} KB`}
                      </p>
                    </div>
                    {uploadState !== 'analyzing' && (
                      <button 
                        onClick={startAnalysis}
                        className="w-full bg-accent text-[#1E1C28] font-bold py-3.5 rounded-xl hover:bg-accent/90 transition-colors shadow-[0_0_20px_rgba(244,183,64,0.3)]"
                      >
                        Begin Verification
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-foreground/50">
              <Lock className="w-3.5 h-3.5" />
              <span>End-to-end encrypted investigation pipeline.</span>
            </div>
          </div>
        </div>

        {/* RIGHT PANE: Live Animated Verification Sequence */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="glass-panel p-0 rounded-2xl border border-border shadow-2xl flex-grow overflow-hidden relative flex flex-col bg-[#120F1B]">
            {/* Terminal Header */}
            <div className="bg-[#1A1824] px-6 py-4 border-b border-border flex items-center justify-between font-['JetBrains_Mono',monospace] text-xs text-foreground/60">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FF5470]"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-[#F4B740]"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-[#22C55E]"></div>
                </div>
                <span className="ml-2 uppercase tracking-widest text-[#F4B740]">/dev/pipeline_monitor</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className={clsx("w-3.5 h-3.5", uploadState === 'analyzing' ? "text-[#F4B740] animate-pulse" : "text-foreground/30")} />
                <span>{uploadState === 'analyzing' ? 'ACTIVE' : 'STANDBY'}</span>
              </div>
            </div>

            <div className="p-8 sm:p-12 flex-grow flex flex-col justify-center">
              {uploadState === 'idle' || uploadState === 'ready' ? (
                <div className="flex flex-col items-center justify-center text-center h-full opacity-40">
                  <Activity className="w-16 h-16 mb-4 text-foreground/30" />
                  <p className="font-['JetBrains_Mono',monospace] text-sm tracking-widest uppercase">Waiting for input stream...</p>
                </div>
              ) : (
                <div className="flex flex-col h-full w-full max-w-md mx-auto">
                  {/* Progress Header */}
                  <div className="flex justify-between items-end mb-4 font-['JetBrains_Mono',monospace] text-xs">
                    <span className="text-[#F4B740] uppercase tracking-widest font-bold">Investigation Running</span>
                    <span className="text-white text-lg">{Math.floor(progress)}%</span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full h-1.5 bg-[#1A1824] rounded-full overflow-hidden mb-12">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-[#FF5470] to-[#F4B740]"
                      animate={{ width: `${progress}%` }}
                      transition={{ ease: "linear" }}
                    />
                  </div>

                  {/* Verification Steps Sequence */}
                  <div className="flex flex-col gap-6 relative">
                    <div className="absolute left-[15px] top-4 bottom-4 w-px bg-[#2B2639] z-0"></div>
                    
                    {VERIFICATION_STEPS.map((step, index) => {
                      const isActive = activeStep === step.id;
                      const isComplete = activeStep > step.id || progress === 100;
                      const isPending = activeStep < step.id;

                      return (
                        <div key={step.id} className="relative z-10 flex items-center gap-6">
                          <div className={clsx(
                            "w-[30px] h-[30px] rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300",
                            isComplete ? "bg-[#F4B740] text-[#1E1C28] shadow-[0_0_10px_rgba(244,183,64,0.4)]" : 
                            isActive ? "bg-[#252134] border-2 border-[#F4B740] text-[#F4B740]" : 
                            "bg-[#1A1824] border border-[#2B2639] text-foreground/30"
                          )}>
                            {isComplete ? <ShieldCheck className="w-4 h-4" /> : <step.icon className="w-4 h-4" />}
                          </div>
                          
                          <div className="flex flex-col">
                            <span className={clsx(
                              "font-['Chakra_Petch',sans-serif] font-bold text-lg tracking-wide transition-colors",
                              isComplete ? "text-white" : isActive ? "text-[#F4B740]" : "text-foreground/30"
                            )}>
                              {step.label}
                            </span>
                            {isActive && (
                              <motion.span 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="font-['JetBrains_Mono',monospace] text-xs text-foreground/50 uppercase tracking-wider"
                              >
                                Processing signals...
                              </motion.span>
                            )}
                          </div>

                          {isActive && (
                            <motion.div 
                              className="ml-auto"
                              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            >
                              <div className="flex gap-1">
                                <span className="w-1.5 h-1.5 bg-[#F4B740] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                <span className="w-1.5 h-1.5 bg-[#F4B740] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                <span className="w-1.5 h-1.5 bg-[#F4B740] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
