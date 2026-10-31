'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, X } from 'lucide-react';

export default function CameraCapture({ disabled, onCapture }: { disabled: boolean; onCapture: (file: File) => void }) {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const nativeInput = useRef<HTMLInputElement>(null);
  const activeStream = useRef<MediaStream | null>(null);
  const captureVersion = useRef(0);

  const close = useCallback(() => {
    captureVersion.current++;
    activeStream.current?.getTracks().forEach(track => track.stop());
    activeStream.current = null;
    setOpen(false); setReady(false); setSaving(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    let ownedStream: MediaStream | null = null;
    setError(''); setReady(false);
    async function start() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('Camera preview needs HTTPS or localhost. On a phone, try “Take photo on phone” below.');
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false });
        ownedStream = stream;
        if (cancelled) { stream.getTracks().forEach(track => track.stop()); return; }
        activeStream.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (reason) {
        if (cancelled) return;
        ownedStream?.getTracks().forEach(track => track.stop());
        activeStream.current = null;
        const name = reason instanceof DOMException ? reason.name : '';
        setError(name === 'NotAllowedError' ? 'Camera access was denied. Allow camera access in your browser, or upload a photo.'
          : name === 'NotFoundError' ? 'No camera was found. Upload a photo or use a phone camera.'
          : name === 'NotReadableError' ? 'Camera is busy or unavailable. Close other camera apps and retry.'
          : reason instanceof Error ? reason.message : 'Camera could not start. Try uploading a photo.');
      }
    }
    void start();
    return () => {
      cancelled = true; captureVersion.current++;
      ownedStream?.getTracks().forEach(track => track.stop());
      if (activeStream.current === ownedStream) activeStream.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [open]);

  useEffect(() => { if (disabled) close(); }, [disabled, close]);
  useEffect(() => {
    const hide = () => { if (document.hidden) close(); };
    document.addEventListener('visibilitychange', hide);
    return () => document.removeEventListener('visibilitychange', hide);
  }, [close]);

  async function capture() {
    const video = videoRef.current;
    if (!ready || !video?.videoWidth || saving || disabled) return;
    const version = ++captureVersion.current;
    setSaving(true); setError('');
    try {
      const canvas = document.createElement('canvas');
      const scale = Math.min(1, 1920 / Math.max(video.videoWidth, video.videoHeight));
      canvas.width = Math.round(video.videoWidth * scale); canvas.height = Math.round(video.videoHeight * scale);
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Photo capture is unavailable. Try uploading a photo.');
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
      if (version !== captureVersion.current) return;
      if (!blob || !blob.size || blob.size > 10 * 1024 * 1024) throw new Error('Photo could not be captured within the 10 MB limit. Please retry.');
      const file = new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' });
      close(); onCapture(file);
    } catch (reason) {
      if (version === captureVersion.current) { setSaving(false); setError(reason instanceof Error ? reason.message : 'Photo capture failed. Please retry.'); }
    }
  }

  return <div className="mb-5">
    <div className="flex flex-wrap gap-2">
      <button type="button" disabled={disabled} onClick={() => setOpen(true)} className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border border-border bg-surface/50 hover:bg-accent/10 disabled:opacity-50"><Camera className="w-4 h-4"/>Open camera</button>
      <button type="button" disabled={disabled} onClick={() => nativeInput.current?.click()} className="px-4 py-2.5 rounded-lg text-sm font-medium border border-border bg-surface/50 hover:bg-accent/10 disabled:opacity-50">Take photo on phone</button>
      <input ref={nativeInput} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="hidden" onChange={event => {
        const file = event.target.files?.[0]; event.target.value = '';
        if (!file || disabled) return;
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || !file.size || file.size > 10 * 1024 * 1024) { setError('Choose a JPG, PNG, or WebP photo up to 10 MB.'); return; }
        close(); setError(''); onCapture(file);
      }}/>
    </div>
    <p className="text-xs text-foreground/50 mt-2">Capture a still photo, review it, then press Begin Verification. Capturing does not upload it automatically.</p>
    {open && <div className="mt-4 p-4 rounded-xl border border-border bg-[#0B0A10]">
      <div className="flex justify-between items-center mb-3"><h3 className="font-bold text-sm">Camera preview</h3><button type="button" onClick={close} aria-label="Close camera" className="p-1 text-foreground/60 hover:text-white"><X className="w-5 h-5"/></button></div>
      <video ref={videoRef} autoPlay muted playsInline onLoadedData={() => setReady(true)} className="w-full rounded-lg max-h-72 bg-black" aria-label="Live camera preview"/>
      {!ready && !error && <p role="status" className="text-xs mt-3 text-foreground/60">Waiting for camera access…</p>}
      <button type="button" disabled={!ready || saving || disabled} onClick={capture} className="bg-accent text-[#1E1C28] font-bold py-2.5 px-4 rounded-lg mt-3 disabled:opacity-40">{saving ? 'Capturing…' : 'Capture photo'}</button>
    </div>}
    {error && <p role="alert" className="text-sm text-red-400 mt-3">{error}</p>}
    <p className="text-xs text-foreground/50 mt-2">A camera photo can still contain a screen or printed fake. Capture alone does not prove authenticity.</p>
  </div>;
}
