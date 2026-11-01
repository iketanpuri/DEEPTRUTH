'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FileVideo, FileImage, FileAudio, FileText, Link as LinkIcon, Lock, X, PlayCircle, ShieldCheck, Camera, ChevronRight, Activity, Search, AlertTriangle, FileCheck } from 'lucide-react';
import clsx from 'clsx';
import CameraCapture from '@/components/CameraCapture';
import { prepareAudio } from '@/lib/prepare-audio';

const CONTENT_TYPES = [
  { id: 'image', label: 'Image', icon: FileImage, accept: 'image/jpeg,image/png,image/webp' },
  { id: 'video', label: 'Video', icon: FileVideo, accept: 'video/*' },
  { id: 'audio', label: 'Audio', icon: FileAudio, accept: 'audio/*,.wav,.mp3,.m4a,.ogg,.flac,.webm' },
];

// Investigation sequence steps based on user's hackathon prompt
const MEDIA_STEPS = [
  { id: 1, label: 'Preparing media', icon: FileCheck },
  { id: 2, label: 'Sampling visual evidence', icon: FileVideo },
  { id: 3, label: 'Running models and source checks', icon: Activity },
  { id: 4, label: 'Reviewing returned evidence', icon: Search },
  { id: 5, label: 'Recording limitations', icon: AlertTriangle },
  { id: 6, label: 'Report ready', icon: ShieldCheck },
];

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
  const [activeTab, setActiveTab] = useState('image');
  const [uploadState, setUploadState] = useState<'idle' | 'ready' | 'analyzing'>('idle');
  const [progress, setProgress] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  
  const [textContent, setTextContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  useEffect(() => {
    if (!selectedFile?.type.startsWith('image/')) { setImagePreview(''); return; }
    const url = URL.createObjectURL(selectedFile); setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);
  
  const [audioPreview, setAudioPreview] = useState('');
  useEffect(() => {
    if (activeTab !== 'audio' || !selectedFile) { setAudioPreview(''); return; }
    const url = URL.createObjectURL(selectedFile); setAudioPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile, activeTab]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const requestRunning = useRef(false);

  const activeType = CONTENT_TYPES.find(t => t.id === activeTab);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (uploadState === 'analyzing') return;
      const valid = activeTab === 'audio' ? (file.type.startsWith('audio/') || /\.(wav|mp3|m4a|ogg|flac|webm)$/i.test(file.name)) : activeTab === 'video' ? file.type.startsWith('video/') : ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
      const limit = activeTab === 'audio' ? 20 : activeTab === 'video' ? 50 : 10;
      if (!valid || !file.size || file.size > limit * 1024 * 1024) {
        alert(`Choose a supported ${activeTab} file up to ${limit} MB. Audio must contain 2–30 seconds of speech.`); return;
      }
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

  // Three representative visual samples; this is not full-video temporal analysis.
  const extractVideoFrames = async (file: File): Promise<{ files: File[]; timestamps: number[] }> => {
    const video = document.createElement('video');
    video.muted = true; video.playsInline = true; video.preload = 'auto';
    const url = URL.createObjectURL(file);
    const wait = (event: 'loadeddata' | 'seeked') => new Promise<void>((resolve, reject) => {
      const cleanup = () => { clearTimeout(timer); video.removeEventListener(event, done); video.removeEventListener('error', fail); };
      const done = () => { cleanup(); resolve(); };
      const fail = () => { cleanup(); reject(new Error('Video could not be decoded. Try a browser-playable MP4.')); };
      const timer = setTimeout(fail, 15000);
      video.addEventListener(event, done, { once: true }); video.addEventListener('error', fail, { once: true });
    });
    try {
      const ready = wait('loadeddata'); video.src = url; await ready;
      if (!Number.isFinite(video.duration) || video.duration < 0.5 || video.duration > 86400) throw new Error('Choose a video between 0.5 seconds and 24 hours.');
      const timestamps = [0.15, 0.5, 0.85].map(f => f * video.duration);
      const files: File[] = [];
      for (let i = 0; i < timestamps.length; i++) {
        const seeked = wait('seeked'); video.currentTime = timestamps[i]; await seeked;
        const canvas = document.createElement('canvas');
        const scale = Math.min(1, 1920 / Math.max(video.videoWidth, video.videoHeight));
        canvas.width = Math.round(video.videoWidth * scale); canvas.height = Math.round(video.videoHeight * scale);
        const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('Could not extract frame.');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
        if (!blob) throw new Error('Could not encode frame.');
        files.push(new File([blob], `frame-${i + 1}.jpg`, { type: 'image/jpeg' }));
      }
      return { files, timestamps };
    } finally { video.removeAttribute('src'); video.load(); URL.revokeObjectURL(url); }
  };

  const startAnalysis = async () => {
    if (requestRunning.current) return;
    requestRunning.current = true;
    setUploadState('analyzing');
    setProgress(0);
    setActiveStep(1);

    // Milestones, not fabricated percentages of provider execution.
    setProgress(10);
    try {
      let finalResultData;

      if (activeTab === 'text' || activeTab === 'url') {
        // Call the new Evidence-Driven Verification Pipeline
        const response = await fetch('/api/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: textContent, type: activeTab })
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.error || 'Verification pipeline failed');
        }
        finalResultData = await response.json();

      } else {
        // Media Upload Flow
        const formData = new FormData();
        if (!selectedFile) throw new Error('Choose a file first.');
        setActiveStep(2);
        const video = activeTab === 'video';
        const audio = activeTab === 'audio';
        const batch = audio ? { files: [await prepareAudio(selectedFile)], timestamps: [] } : video ? await extractVideoFrames(selectedFile) : { files: [selectedFile], timestamps: [] };
        batch.files.forEach(file => formData.append('file', file));
        formData.append('type', video ? 'video' : 'image');
        formData.append('timestamps', JSON.stringify(batch.timestamps));
        formData.append('originalName', selectedFile.name);
        setProgress(35); setActiveStep(3);
        const response = await fetch(audio ? '/api/analyze-audio' : '/api/analyze', { method: 'POST', body: formData, signal: AbortSignal.timeout(180000) });
        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.error || 'Media analysis failed. The API might be blocked by your ISP.');
        }
        finalResultData = await response.json();
      }

      setProgress(100);
      setActiveStep(6);

      sessionStorage.setItem('analysisResult', JSON.stringify(finalResultData));

      // Redirect to results page after short delay
      setTimeout(() => {
        router.push(`/results?id=${finalResultData.id}`);
      }, 800);

    } catch (err: any) {
      console.error(err);
      setUploadState('idle');
      alert(err.message || 'Verification failed. Please try again.');
    } finally { requestRunning.current = false; }
  };

  const cancelUpload = () => {
    setUploadState('idle');
    setSelectedFile(null);
    setTextContent('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 pt-24 pb-12 min-h-[90vh] flex flex-col">
      <div className="mb-8 text-center sm:text-left">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent mb-3">DeepTruth / Media verification</p>
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-3 tracking-tight font-['Chakra_Petch',sans-serif]">Check before you trust.</h1>
        <p className="text-foreground/60 max-w-2xl text-lg">
          Upload an image, video or speech clip. Review the detection signals, supporting evidence and what needs a closer look.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-grow">
        
        {/* LEFT PANE: Input Section */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="glass-panel p-5 sm:p-7 rounded-2xl border border-border shadow-2xl flex-grow flex flex-col">
            <h2 className="text-xl font-bold mb-6 font-['Chakra_Petch',sans-serif] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
              Choose your media
            </h2>
            
            <p className="text-sm leading-relaxed text-foreground/55 mb-5">{activeTab === 'audio' ? 'Use clear talking without music. Local analysis checks for synthetic-voice signals.' : activeTab === 'video' ? 'Three sampled frames are checked for visual manipulation. Soundtrack and motion are not analysed.' : 'Check for AI-generated imagery and facial manipulation, with supporting source context when available.'}</p>
            {/* Tabs */}
            <div className="grid grid-cols-3 gap-1.5 p-1.5 mb-5 rounded-xl bg-black/20 border border-border/70">
              {CONTENT_TYPES.map((type) => (
                <button
                  key={type.id}
                  aria-pressed={activeTab === type.id}
                  disabled={uploadState === 'analyzing'}
                  onClick={() => { setActiveTab(type.id); cancelUpload(); }}
                  className={clsx(
                    "flex items-center justify-center gap-2 px-2 py-3 rounded-lg text-sm font-semibold transition-colors border focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-50",
                    activeTab === type.id 
                      ? "bg-accent/15 border-accent/50 text-white shadow-sm"
                      : "bg-surface/50 border-transparent text-foreground/60 hover:bg-surface hover:text-white"
                  )}
                >
                  <type.icon className="w-4 h-4" />
                  {type.label}
                </button>
              ))}
            </div>

            {activeTab === 'image' && <CameraCapture disabled={uploadState === 'analyzing'} onCapture={file => { setSelectedFile(file); setTextContent(''); setUploadState('ready'); }}/>}
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
                        role="button"
                        tabIndex={0}
                        aria-label={`Choose ${activeType?.label?.toLowerCase()} file`}
                        onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); fileInputRef.current?.click(); } }}
                        className="w-full min-h-64 border-2 border-dashed border-accent/25 rounded-2xl focus-visible:outline-2 focus-visible:outline-accent flex flex-col items-center justify-center p-6 cursor-pointer hover:border-accent/50 hover:bg-accent/5 transition-all group relative overflow-hidden bg-[#0B0A10]"
                      >
                        <div className="bg-accent/10 border border-accent/20 p-4 rounded-2xl mb-4 group-hover:scale-110 transition-transform shadow-lg">
                          <UploadCloud className="w-8 h-8 text-accent" />
                        </div>
                        <h3 className="text-lg font-bold mb-2">Choose {activeType?.label?.toLowerCase()} file</h3>
                        <p className="text-foreground/50 text-sm mb-4 text-center">{activeTab === 'audio' ? '2–30 seconds · up to 20 MB · WAV, MP3 or M4A' : activeTab === 'video' ? 'Video file · up to 50 MB' : 'JPG, PNG or WebP · up to 10 MB'}</p>
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
                  <button onClick={cancelUpload} disabled={uploadState === 'analyzing'} aria-label="Remove selected media" className="absolute top-4 right-4 text-foreground/50 hover:text-white z-10 disabled:opacity-50">
                    <X className="w-5 h-5" />
                  </button>
                  <div className="flex flex-col items-center text-center gap-4">
                    {audioPreview && <audio controls preload="metadata" src={audioPreview} className="w-full" aria-label="Selected speech clip"/>}
                    {imagePreview && <img src={imagePreview} alt="Photo selected for verification" className="w-full max-h-48 object-contain rounded-lg"/>}
                    <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center border border-accent/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                      <ShieldCheck className="w-8 h-8 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-white mb-1 break-all">
                        {activeTab === 'text' ? 'Text Claim Ready' : activeTab === 'url' ? 'URL Ready' : selectedFile?.name}
                      </h3>
                      <p className="text-sm text-foreground/50 mb-6 line-clamp-2 px-4">
                        {textContent || `${((selectedFile?.size || 0) / 1024 / 1024).toFixed(2)} MB · Ready to analyse`}
                      </p>
                    </div>
                    {uploadState !== 'analyzing' && (
                      <button 
                        onClick={startAnalysis}
                        className="w-full bg-accent text-white font-bold py-3.5 rounded-xl hover:bg-accent/90 transition-colors shadow-[0_0_20px_rgba(59,130,246,0.3)]"
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
              <span>Only upload media you have permission to analyse.</span>
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
                  <div className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-[#60A5FA]"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-[#22C55E]"></div>
                </div>
                <span className="ml-2 uppercase tracking-widest text-[#60A5FA]">Analysis workspace</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className={clsx("w-3.5 h-3.5", uploadState === 'analyzing' ? "text-[#60A5FA] animate-pulse" : "text-foreground/30")} />
                <span>{uploadState === 'analyzing' ? 'ANALYSING' : 'READY'}</span>
              </div>
            </div>

            <div className="p-6 sm:p-10 flex-grow flex flex-col justify-center min-h-[360px]">
              {uploadState === 'idle' || uploadState === 'ready' ? (
                <div className="flex flex-col items-center justify-center text-center h-full py-6">
                  <div className="w-20 h-20 rounded-3xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-6"><ShieldCheck className="w-10 h-10 text-accent" /></div>
                  <h2 className="text-2xl font-bold tracking-tight mb-3">{uploadState === 'ready' ? 'Ready when you are.' : 'Your analysis starts here.'}</h2>
                  <p className="text-sm text-foreground/50 leading-relaxed max-w-sm">{uploadState === 'ready' ? 'Review your selected file, then begin verification to see the returned signals and evidence.' : 'Choose your media on the left. Results will show the detected signals and any uncertainty.'}</p>
                  <div className="grid grid-cols-3 gap-3 w-full mt-8 max-w-md">
                    {[{icon: Activity, label: 'Model signals'}, {icon: Search, label: 'Evidence'}, {icon: FileCheck, label: 'PDF report'}].map(item => <div key={item.label} className="rounded-xl border border-border bg-white/[0.02] px-2 py-4"><item.icon className="w-5 h-5 text-accent mx-auto mb-2"/><span className="text-xs text-foreground/60">{item.label}</span></div>)}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col h-full w-full max-w-md mx-auto">
                  {/* Progress Header */}
                  <div className="flex justify-between items-end mb-4 font-['JetBrains_Mono',monospace] text-xs">
                    <span className="text-[#60A5FA] uppercase tracking-widest font-bold">Investigation Running</span>
                    <span className="text-white text-lg">{Math.floor(progress)}%</span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full h-1.5 bg-[#1A1824] rounded-full overflow-hidden mb-12">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-[#3B82F6] to-[#60A5FA]"
                      animate={{ width: `${progress}%` }}
                      transition={{ ease: "linear" }}
                    />
                  </div>

                  {/* Verification Steps Sequence */}
                  <div className="flex flex-col gap-6 relative">
                    <div className="absolute left-[15px] top-4 bottom-4 w-px bg-[#2B2639] z-0"></div>
                    
                    {(activeTab === 'audio' ? [
                      { id: 1, label: 'Preparing speech clip', icon: FileAudio },
                      { id: 2, label: 'Decoding and resampling audio', icon: Activity },
                      { id: 3, label: 'Running local voice detector', icon: Activity },
                      { id: 4, label: 'Reviewing window scores', icon: Search },
                      { id: 5, label: 'Checking recording quality', icon: AlertTriangle },
                      { id: 6, label: 'Report ready', icon: ShieldCheck },
                    ] : VERIFICATION_STEPS).map((step, index) => {
                      const isActive = activeStep === step.id;
                      const isComplete = activeStep > step.id || progress === 100;
                      const isPending = activeStep < step.id;

                      return (
                        <div key={step.id} className="relative z-10 flex items-center gap-6">
                          <div className={clsx(
                            "w-[30px] h-[30px] rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300",
                            isComplete ? "bg-[#60A5FA] text-white shadow-[0_0_10px_rgba(59,130,246,0.4)]" :
                            isActive ? "bg-[#252134] border-2 border-[#60A5FA] text-[#60A5FA]" :
                            "bg-[#1A1824] border border-[#2B2639] text-foreground/30"
                          )}>
                            {isComplete ? <ShieldCheck className="w-4 h-4" /> : <step.icon className="w-4 h-4" />}
                          </div>
                          
                          <div className="flex flex-col">
                            <span className={clsx(
                              "font-['Chakra_Petch',sans-serif] font-bold text-lg tracking-wide transition-colors",
                              isComplete ? "text-white" : isActive ? "text-[#60A5FA]" : "text-foreground/30"
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
                                <span className="w-1.5 h-1.5 bg-[#60A5FA] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                <span className="w-1.5 h-1.5 bg-[#60A5FA] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                <span className="w-1.5 h-1.5 bg-[#60A5FA] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
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
