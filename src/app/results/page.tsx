'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import {
  ShieldCheck, AlertTriangle, AlertCircle,
  Download, Share2, CheckCircle2, ChevronDown, Activity,
  Maximize, Eye, Link as LinkIcon, FileText, Search, Database, Globe
} from 'lucide-react';
import clsx from 'clsx';
import ForensicLoader from '@/components/animations/ForensicLoader';
import { saveToHistory } from '@/lib/storage';
import { resultLabel } from '@/lib/result-label';

function ResultsContent() {
  const searchParams = useSearchParams();
  const idParam = searchParams.get('id');

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');

  useEffect(() => {
    if (idParam) {
      const stored = sessionStorage.getItem('analysisResult');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.id === idParam) {
            setData(parsed);
            saveToHistory(parsed);
          }
        } catch (e) {
          console.error('Failed to parse analysis result', e);
        }
      }
    }
    setLoading(false);
  }, [idParam]);

  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));

  useEffect(() => {
    if (data?.evidenceScore !== undefined) {
      const controls = animate(count, data.evidenceScore, { duration: 1.5, ease: "easeOut", delay: 0.2 });
      return controls.stop;
    }
    if (typeof data?.score === 'number') {
      const controls = animate(count, data.score, { duration: 1.5, ease: "easeOut", delay: 0.2 });
      return controls.stop;
    }
  }, [data, count]);

  const downloadReport = async () => {
    if (!data || exporting) return;
    setExporting(true); setExportError('');
    try {
      const response = await fetch('/api/report', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), signal: AbortSignal.timeout(60000) });
      if (!response.ok) { const error = await response.json().catch(() => null); throw new Error(error?.error || 'PDF download failed. Please retry.'); }
      if (!response.headers.get('content-type')?.includes('application/pdf')) throw new Error('The server did not return a PDF. Please retry.');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a'); link.href = url;
      link.download = `deeptruth-evidence-${String(data.id).replace(/[^a-zA-Z0-9_-]/g, '').slice(0,80)}.pdf`;
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (error) { setExportError(error instanceof Error ? error.message : 'PDF download failed. Please retry.'); }
    finally { setExporting(false); }
  };

  if (loading) return <ForensicLoader />;

  if (!data) {
    return (
      <div className="container mx-auto px-4 pt-32 text-center min-h-[80vh]">
        <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Result Not Found</h1>
        <p className="text-foreground/60 mb-8">The verification result you are looking for may have expired or does not exist.</p>
        <a href="/verify" className="bg-white text-black px-6 py-3 rounded-xl font-bold hover:bg-gray-200">Start New Verification</a>
      </div>
    );
  }

  const isTextVerification = !!data.claimsAnalyzed;

  // VERDICT COLOR MAPPING FOR TEXT PIPELINE
  const verdictMap: Record<string, { color: string, bg: string, ring: string, icon: any }> = {
    "VERIFIED": { color: "text-[#10b981]", bg: "bg-[#10b981]/10", ring: "#10b981", icon: ShieldCheck },
    "PARTIALLY VERIFIED": { color: "text-[#f59e0b]", bg: "bg-[#f59e0b]/10", ring: "#f59e0b", icon: Activity },
    "UNVERIFIED": { color: "text-[#8b5cf6]", bg: "bg-[#8b5cf6]/10", ring: "#8b5cf6", icon: AlertCircle },
    "LIKELY MISLEADING": { color: "text-[#ef4444]", bg: "bg-[#ef4444]/10", ring: "#ef4444", icon: AlertTriangle },
  };

  if (isTextVerification) {
    const verdictInfo = verdictMap[data.verdict] || verdictMap["UNVERIFIED"];
    const VerdictIcon = verdictInfo.icon;

    return (
      <div className="container mx-auto max-w-6xl px-4 pt-24 pb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent mb-3">DeepTruth / Analysis results</p>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2 font-['Chakra_Petch',sans-serif]">Verification Report</h1>
            {data.isDemo && <p className="text-sm text-amber-400 mb-2">Illustrative preset — no live analysis or source retrieval was performed.</p>}
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-foreground/50">
              <span className="break-all">ID: {data.id}</span>
              <span className="hidden sm:inline">•</span>
              <span>{new Date(data.timestamp).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN: Verdict & Original Content */}
          <div className="lg:col-span-5 flex flex-col gap-8">

            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className={clsx("glass-panel p-8 flex flex-col items-center text-center border", verdictInfo.bg, `border-${verdictInfo.ring}/20`)}
            >
              <h2 className="text-xs font-bold tracking-widest text-foreground/70 mb-8 uppercase">Evidence Score</h2>

              <div className="relative w-48 h-48 mb-6 flex items-center justify-center">
                <motion.svg aria-hidden="true" className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="4" className="text-border/40 opacity-30" />
                  <motion.circle
                    cx="50" cy="50" r="45" fill="none" stroke={verdictInfo.ring} strokeWidth="4" strokeLinecap="round" strokeDasharray="283"
                    initial={{ strokeDashoffset: 283 }} animate={{ strokeDashoffset: 283 - (283 * data.evidenceScore) / 100 }}
                    transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                  />
                </motion.svg>
                <div className="flex items-start">
                  <motion.span className="text-7xl font-bold">{rounded}</motion.span>
                </div>
              </div>

              <div className={clsx("flex items-center justify-center gap-2 mb-3", verdictInfo.color)}>
                <VerdictIcon className="w-6 h-6" />
                <h3 className="text-2xl font-bold tracking-wide">{data.verdict}</h3>
              </div>

              <div className="bg-black/40 rounded-xl p-4 mt-2 border border-white/5 w-full text-left">
                <h4 className="text-[10px] uppercase tracking-wider text-foreground/50 mb-1">Explain Simply</h4>
                <p className="text-sm font-medium">{data.explainSimply}</p>
              </div>
            </motion.div>

            <div className="glass-panel p-6">
              <h3 className="text-xs uppercase tracking-widest text-foreground/50 mb-4 font-bold flex items-center gap-2">
                <FileText className="w-4 h-4" /> Original Content
              </h3>
              <p className="text-sm italic border-l-2 border-accent pl-4 text-foreground/80 leading-relaxed">
                "{data.originalContent}"
              </p>
            </div>

            {exportError && <p role="alert" className="text-sm text-red-400">{exportError}</p>}
            {/* VERIFICATION RECEIPT */}
            <div className="glass-panel p-6 relative overflow-hidden group border-dashed border-2 border-border/60">
              <div className="absolute top-0 right-0 bg-accent text-black text-[9px] font-bold px-2 py-1 uppercase tracking-widest">Shareable Receipt</div>
              <h3 className="text-lg font-bold font-['Chakra_Petch',sans-serif] mb-4 mt-2">DEEPTRUTH RECEIPT</h3>
              <ul className="text-xs font-mono space-y-2 text-foreground/60 mb-6">
                <li className="flex justify-between"><span>ID</span><span className="text-white">{data.id.split('-')[0]}</span></li>
                <li className="flex justify-between"><span>Date</span><span className="text-white">{new Date(data.timestamp).toLocaleDateString()}</span></li>
                <li className="flex justify-between"><span>Verdict</span><span className={clsx("font-bold", verdictInfo.color)}>{data.verdict}</span></li>
                <li className="flex justify-between"><span>Claims</span><span className="text-white">{data.claimsAnalyzed.length} Extracted</span></li>
                <li className="flex justify-between"><span>Sources</span><span className="text-white">{data.sources?.length || 0} Checked</span></li>
              </ul>
              <div className="flex gap-2">
                {data.cache?.reused && <p className="text-xs text-foreground/50 mb-4">Saved analysis reused from {new Date(data.cache.analysedAt).toLocaleString()}. No new provider requests were needed for this upload.</p>}
      <button onClick={downloadReport} disabled={exporting} aria-busy={exporting} className="flex-1 bg-white text-black py-2 rounded font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 text-sm"><Download className="w-4 h-4" /> {exporting ? 'Generating PDF...' : 'Download PDF'}</button>
                <button className="flex-1 bg-surface border border-border py-2 rounded hover:bg-surface-hover transition-colors flex items-center justify-center gap-2 text-sm"><Share2 className="w-4 h-4" /> Share</button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Evidence & Analysis */}
          <div className="lg:col-span-7 flex flex-col gap-8">

            <section>
              <h3 className="text-xl font-bold mb-6 font-['Chakra_Petch',sans-serif]">Evidence Breakdown</h3>
              <div className="glass-card p-6 border-l-4 border-l-accent">
                <h4 className="text-sm font-bold uppercase tracking-wider text-foreground/50 mb-3">Key Reasoning</h4>
                <p className="text-base text-foreground/90">{data.keyReasoning}</p>
              </div>
            </section>

            <section>
              <h3 className="text-xl font-bold mb-4 font-['Chakra_Petch',sans-serif] flex items-center gap-2">
                <Database className="w-5 h-5 text-accent" /> Source Comparison
              </h3>
              <div className="space-y-4">
                {data.sources?.map((source: any, i: number) => (
                  <div key={i} className="bg-surface/40 border border-border/60 rounded-xl p-5 hover:bg-surface/60 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-accent" />
                        <span className="font-bold text-sm">{source.sourceName}</span>
                      </div>
                      <span className="text-[10px] uppercase bg-surface border border-border px-2 py-1 rounded text-foreground/60">{source.type}</span>
                    </div>
                    <p className="text-xs text-foreground/70 leading-relaxed mb-3">"...{source.snippet}..."</p>
                    <a href={source.url} target="_blank" rel="noreferrer" className="text-[10px] text-accent hover:underline flex items-center gap-1">View original source <LinkIcon className="w-3 h-3" /></a>
                  </div>
                ))}
                {(!data.sources || data.sources.length === 0) && (
                  <div className="text-sm text-foreground/50 p-4 text-center border border-dashed border-border rounded-xl">No external sources were successfully retrieved for comparison.</div>
                )}
              </div>
            </section>

            <section>
              <h3 className="text-xl font-bold mb-4 font-['Chakra_Petch',sans-serif] flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-accent" /> Claim-by-Claim Extraction
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {data.claimsAnalyzed.map((claim: string, i: number) => (
                  <div key={i} className="glass-card p-5 border border-border">
                    <div className="text-[10px] text-foreground/40 font-mono mb-2 uppercase tracking-widest">Extracted Claim {String(i + 1).padStart(2, '0')}</div>
                    <p className="text-sm font-medium">"{claim}"</p>
                  </div>
                ))}
              </div>
            </section>

            {data.manipulationSignals && data.manipulationSignals.length > 0 && (
              <section>
                <h3 className="text-xl font-bold mb-4 font-['Chakra_Petch',sans-serif]">Manipulation Signals Detected</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {data.manipulationSignals.map((sig: any, i: number) => (
                    <div key={i} className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex gap-3 items-start">
                      <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                      <div>
                        <h4 className="text-sm font-bold text-red-400">{sig.name}</h4>
                        <p className="text-xs text-foreground/60 mt-1">{sig.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

          </div>
        </div>
      </div>
    );
  }

  // FALLBACK FOR OLD MEDIA PIPELINE RESULTS
  const colorMap: Record<string, string> = {
    authentic: 'text-authentic bg-authentic-bg border-authentic/20 glow-authentic',
    synthetic: 'text-synthetic bg-synthetic-bg border-synthetic/20 glow-synthetic',
    inconclusive: 'text-inconclusive bg-inconclusive-bg border-inconclusive/20'
  };
  const ringColorMap: Record<string, string> = {
    authentic: '#10b981', synthetic: '#ef4444', inconclusive: '#f59e0b',
  };

  const canReportCyberCrime = data.status === 'MANIPULATION SIGNAL DETECTED' || (data.detectionSchemaVersion !== 3 && data.color === 'synthetic');
  const StatusIcon = data.color === 'authentic' ? ShieldCheck : AlertTriangle;
  const simpleResult = data.detectionSchemaVersion === 3 ? resultLabel(data.status, data.assessment?.strongestModel, data.mediaType, data.samples?.length || 1, data.assessment?.scope) : null;

  return (
    <div className="container mx-auto max-w-6xl px-4 pt-24 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent mb-3">DeepTruth / Analysis results</p>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2 font-['Chakra_Petch',sans-serif]">Your detection report</h1>
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-foreground/50">
            <span className="break-all">ID: {data.id}</span>
            <span className="hidden sm:inline">•</span>
            <span className="break-all">{data.filename}</span>
          </div>
        </div>
      </div>

      {data.cache?.reused && <p className="text-xs text-foreground/50 mb-4">Saved analysis reused from {new Date(data.cache.analysedAt).toLocaleString()}. No new provider requests were needed for this upload.</p>}
      <button onClick={downloadReport} disabled={exporting} aria-busy={exporting} className="bg-white text-black px-5 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors flex items-center gap-2 text-sm mb-6"><Download className="w-4 h-4"/> {exporting ? 'Generating PDF...' : 'Download evidence report'}</button>
      {canReportCyberCrime && (
        <div className="mb-6">
          <a
            href="https://cybercrime.gov.in/login"
            onClick={(event) => {
              if (exporting) { event.preventDefault(); return; }
              void downloadReport();
            }}
            aria-disabled={exporting}
            aria-busy={exporting}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border border-red-500/40 bg-red-500/10 text-red-400 px-5 py-3 rounded-xl font-bold hover:bg-red-500/20 transition-colors text-sm"
          >
            <AlertTriangle className="w-4 h-4" aria-hidden="true" /> Report to Cyber Crime
          </a>
          <p className="text-xs text-foreground/50 mt-2">Opens the cybercrime portal login and downloads your PDF evidence report. You review and submit the complaint yourself.</p>
        </div>
      )}
      {exportError && <p role="alert" className="text-sm text-red-400 mb-4">{exportError}</p>}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 flex flex-col gap-8">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={clsx("glass-panel p-6 sm:p-8 rounded-2xl flex flex-col items-center text-center", colorMap[data.color])}>
            <h2 className="text-xs font-bold tracking-widest text-foreground/70 mb-4 uppercase">{simpleResult ? 'AI or real?' : data.detectionSchemaVersion === 2 ? 'Combined AI-generation score' : 'Synthetic Probability'}</h2>
            {simpleResult && <div className="flex items-center justify-center gap-2 mb-5"><StatusIcon className="w-6 h-6 shrink-0"/><h3 className="text-xl sm:text-2xl font-bold tracking-tight leading-snug">{simpleResult.title}</h3></div>}
            {simpleResult && <p className="text-xs opacity-60 mb-4">{data.mediaType === 'audio' ? 'Synthetic voice score · lower means fewer signs' : data.assessment?.dualProvider ? (data.assessment.headlineProviders?.length === 2 ? `${data.assessment.strongestModel === 'Face-manipulation confidence' ? 'Face-manipulation' : 'AI-generation'} average · Sightengine + Hive · not accuracy` : 'Single-detector signal · two-provider average unavailable') : 'AI / manipulation score · lower means fewer signs'}</p>}
            <div className="relative w-48 h-48 mb-6 flex items-center justify-center">
              <motion.svg aria-hidden="true" className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="4" className="text-border/40 opacity-30" />
                <motion.circle cx="50" cy="50" r="45" fill="none" stroke={ringColorMap[data.color]} strokeWidth="4" strokeLinecap="round" strokeDasharray="283" initial={{ strokeDashoffset: 283 }} animate={{ strokeDashoffset: 283 - (283 * (data.score ?? 0)) / 100 }} transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }} />
              </motion.svg>
              <div className="flex items-start">
                <motion.span className="text-7xl font-bold">{data.score === null ? "—" : rounded}</motion.span>
                <span className="text-xl font-mono opacity-50 mt-2">{data.score === null ? "" : "/100"}</span>
              </div>
            </div>
            {!simpleResult && <div className="flex items-center justify-center gap-2 mb-3">
              <StatusIcon className="w-6 h-6" />
              <h3 className="text-2xl font-bold tracking-wide">{data.status}</h3>
            </div>}
            {data.assessment && <div className="flex flex-wrap items-center justify-center gap-2 mb-5 text-[11px] text-foreground/60">
              <span className="rounded-full border border-current/15 px-3 py-1.5">{data.assessment.completedChecks}/{data.assessment.requestedChecks} checks completed</span>
              <span className="rounded-full border border-current/15 px-3 py-1.5">{data.mediaType === 'audio' ? 'Speech analysis' : data.mediaType === 'video' ? 'Sampled-frame analysis' : 'Image analysis'}</span>
            </div>}
            <p className="text-sm leading-relaxed opacity-80 mb-4 font-medium">{(data.status === 'INCONCLUSIVE' || data.status === 'ANALYSIS UNAVAILABLE') && data.assessment?.reasons?.length ? data.assessment.reasons.join(' ') : simpleResult?.explanation || data.desc}</p>
            {simpleResult && <p className="text-xs opacity-60">{simpleResult.caveat}</p>}
            {data.ensemble && <p className="text-xs opacity-60">{data.ensemble.method} {data.ensemble.limitations}</p>}
          </motion.div>
        </div>

        <div className="lg:col-span-7 flex flex-col gap-8">
          {data.audioEvidence && <section className="glass-card p-6">
            <h3 className="text-xl font-bold mb-4">Analysed audio evidence</h3>
            <p className="text-sm mb-2">{data.audioEvidence.duration.toFixed(2)} seconds · {data.audioEvidence.segments.length} checked windows · local CPU inference</p>
            <p className="text-xs text-foreground/60 mb-3">{data.audioEvidence.model.name}. Highest window signal shown; this is not an accuracy percentage. Speech only: music, identity and spoken claims are not verified.</p>
            {data.audioEvidence.qualityWarnings.map((warning: string, i: number) => <p key={i} className="text-xs text-amber-400 mb-2">{warning}</p>)}
            {data.caution?.some((item: string) => item.startsWith('Windows disagree')) && <p className="text-xs text-amber-400">Windows disagree strongly; review the recording manually.</p>}
            <p className="text-[10px] opacity-50 break-all">Converted WAV SHA-256: {data.audioEvidence.sha256}</p>
          </section>}
          {data.samples && <section>
            <h3 className="text-xl font-bold mb-4 font-['Chakra_Petch',sans-serif]">Analysed visual evidence</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">{data.samples.map((sample: any) => <div key={sample.index} className="glass-card p-4">
              <img src={sample.preview} alt={`Actual analysed sample ${sample.index}`} className="w-full rounded-lg mb-3 object-contain"/>
              <p className="text-sm font-bold">{sample.timestamp === null ? 'Uploaded image' : `Frame at ${sample.timestamp.toFixed(2)}s`}</p>
              <p className="text-xs opacity-60 mt-2">{sample.width} × {sample.height} pixels</p>
              <p className="text-[10px] opacity-50 mt-2 break-all">{sample.providerChecks ? `Sightengine request: ${sample.providerChecks.sightengine.requestId || 'unavailable'} · Hive request: ${sample.providerChecks.hive.requestId || 'unavailable'}` : sample.localDetector ? `Local detector: ${sample.localDetector.model}` : `Provider request: ${sample.requestId || 'Unavailable'}`}</p>
              {sample.qualityWarnings.map((warning: string, i: number) => <p key={i} className="text-xs text-amber-400 mt-2">{warning}</p>)}
            </div>)}</div>
            <p className="text-xs text-foreground/50 mt-3">These are display thumbnails of the samples classified, not heatmaps or localized proof of manipulation. OCR and reverse-image lookup use {data.metadata?.contextSample || 'the uploaded image'}.</p>
          </section>}
          <section>
            <h3 className="text-xl font-bold mb-6 font-['Chakra_Petch',sans-serif]">Forensic Signals</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data.signals?.map((signal: any, i: number) => (
                <div key={i} className="glass-card p-5">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-bold text-sm">{signal.name}</h4>
                    <span className="text-xs font-mono opacity-50">{signal.val === null ? "—" : `${signal.val}/100`}</span>
                  </div>
                  <div className="w-full h-1.5 bg-surface rounded overflow-hidden mb-2"><div className="h-full bg-accent" style={{ width: `${signal.val ?? 0}%` }}></div></div>
                  <div className="text-xs opacity-60">Status: {signal.status}</div>
                </div>
              ))}
            </div>
          </section>

          {data.aiReview && <section className="glass-card p-6">
            <h3 className="text-xl font-bold mb-3">AI-assisted review — unverified</h3>
            <p className="text-xs text-amber-400 mb-4">Additional context only. This does not verify authenticity or change the detection score.</p>
            <p className="text-sm text-foreground/70 whitespace-pre-line">{data.aiReview.status === 'ok' ? data.aiReview.text : data.aiReview.detail}</p>
            {data.aiReview.sources?.length > 0 && <ul className="mt-4 space-y-2 text-sm">{data.aiReview.sources.filter((source: any) => /^https:\/\//i.test(source.url)).map((source: any, i: number) => <li key={i}><a className="text-accent underline" href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a></li>)}</ul>}
            {data.aiReview.searchSuggestions && <iframe title="Google Search suggestions" className="w-full border-0 mt-4 bg-white rounded-lg" sandbox="allow-popups allow-popups-to-escape-sandbox" referrerPolicy="no-referrer" srcDoc={'<meta http-equiv="Content-Security-Policy" content="default-src &#39;none&#39;; style-src &#39;unsafe-inline&#39;; img-src https: data:">' + data.aiReview.searchSuggestions} />}
          </section>}

          {data.supporting?.length > 0 && <section className="glass-card p-6">
            <h3 className="text-xl font-bold mb-4 font-['Chakra_Petch',sans-serif]">Supporting model evidence</h3>
            <ul className="space-y-3 text-xs text-foreground/60">{data.supporting.map((item: string, i: number) => <li key={i}>{item}</li>)}</ul>
          </section>}
          {data.extractedText && (
            <section>
              <h3 className="text-xl font-bold mb-4 font-['Chakra_Petch',sans-serif] flex items-center gap-2">
                <FileText className="w-5 h-5 text-accent" /> Extracted Text (OCR)
              </h3>
              <div className="glass-card p-6 border-l-4 border-l-accent">
                <h4 className="text-sm font-bold uppercase tracking-wider text-foreground/50 mb-3">Found in Media</h4>
                <p className="text-base font-medium font-mono text-foreground/90 whitespace-pre-wrap">"{data.extractedText}"</p>
              </div>
            </section>
          )}

          {data.sources && data.sources.length > 0 && (
            <section>
              <h3 className="text-xl font-bold mb-4 font-['Chakra_Petch',sans-serif] flex items-center gap-2">
                <Database className="w-5 h-5 text-accent" /> Source Comparison (Reverse Search)
              </h3>
              <div className="space-y-4">
                {data.sources.map((source: any, i: number) => (
                  <div key={i} className="bg-surface/40 border border-border/60 rounded-xl p-5 hover:bg-surface/60 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-accent" />
                        <span className="font-bold text-sm">{source.sourceName}</span>
                      </div>
                      <span className="text-[10px] uppercase bg-surface border border-border px-2 py-1 rounded text-foreground/60">{source.type}</span>
                    </div>
                    <p className="text-xs text-foreground/70 leading-relaxed mb-3">"...{source.snippet}..."</p>
                    <a href={source.url} target="_blank" rel="noreferrer" className="text-[10px] text-accent hover:underline flex items-center gap-1">View original source <LinkIcon className="w-3 h-3" /></a>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<ForensicLoader />}>
      <ResultsContent />
    </Suspense>
  );
}
