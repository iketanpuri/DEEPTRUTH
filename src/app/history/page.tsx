'use client';

import { useEffect, useState } from 'react';
import { getHistory, VerificationResult, clearHistory } from '@/lib/storage';
import { FileText, ShieldCheck, AlertTriangle, AlertCircle, Trash2, Clock, Activity, FileVideo } from 'lucide-react';
import Link from 'next/link';

export default function HistoryPage() {
  const [history, setHistory] = useState<VerificationResult[]>([]);

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const handleClear = () => {
    if (confirm("Are you sure you want to clear all verification history?")) {
      clearHistory();
      setHistory([]);
    }
  };

  const getVerdictStyle = (verdict: string) => {
    switch (verdict) {
      case 'VERIFIED':
      case 'LIKELY AUTHENTIC':
      case 'LOW MANIPULATION SIGNAL':
        return 'text-[#10b981] bg-[#10b981]/10 border-[#10b981]/20';
      case 'PARTIALLY VERIFIED':
        return 'text-[#f59e0b] bg-[#f59e0b]/10 border-[#f59e0b]/20';
      case 'LIKELY MISLEADING':
      case 'LIKELY SYNTHETIC':
      case 'MANIPULATION SIGNAL DETECTED':
        return 'text-[#ef4444] bg-[#ef4444]/10 border-[#ef4444]/20';
      default:
        return 'text-[#8b5cf6] bg-[#8b5cf6]/10 border-[#8b5cf6]/20';
    }
  };

  const getVerdictIcon = (verdict: string) => {
    switch (verdict) {
      case 'VERIFIED':
      case 'LIKELY AUTHENTIC':
      case 'LOW MANIPULATION SIGNAL':
        return <ShieldCheck className="w-4 h-4" />;
      case 'PARTIALLY VERIFIED':
        return <Activity className="w-4 h-4" />;
      case 'LIKELY MISLEADING':
      case 'LIKELY SYNTHETIC':
      case 'MANIPULATION SIGNAL DETECTED':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 pt-24 pb-12 min-h-screen">
      <div className="flex justify-between items-end mb-8 border-b border-border pb-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2 font-['Chakra_Petch',sans-serif]">Verification History</h1>
          <p className="text-foreground/60 text-sm">Your previously analyzed claims and media.</p>
        </div>
        {history.length > 0 && (
          <button onClick={handleClear} className="flex items-center gap-2 text-xs text-red-500 hover:bg-red-500/10 px-3 py-2 rounded-lg transition-colors">
            <Trash2 className="w-4 h-4" /> Clear History
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="text-center py-20 opacity-50 border border-dashed border-border rounded-xl">
          <Clock className="w-12 h-12 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">No verifications yet</h2>
          <p className="text-sm">Start analyzing claims to see your history here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {history.map((item, i) => (
            <Link key={i} href={`/results?id=${item.id}`} className="glass-card p-5 hover:-translate-y-1 transition-transform group relative overflow-hidden">
              <div className="flex justify-between items-start mb-4">
                <div className={`flex items-center gap-2 px-2.5 py-1 rounded text-xs font-bold border ${getVerdictStyle(item.verdict)}`}>
                  {getVerdictIcon(item.verdict)}
                  {item.verdict}
                </div>
                <div className="text-xs font-mono text-foreground/40">{new Date(item.timestamp).toLocaleDateString()}</div>
              </div>
              
              {item.type === 'text' ? (
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground/50 uppercase tracking-widest mb-2">
                    <FileText className="w-3 h-3" /> Text Claim
                  </div>
                  <p className="text-sm line-clamp-3 text-foreground/80">"{item.originalContent}"</p>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground/50 uppercase tracking-widest mb-2">
                    <FileVideo className="w-3 h-3" /> Media Analysis
                  </div>
                  <p className="text-sm text-foreground/80">{item.filename}</p>
                </div>
              )}
              
              <div className="mt-4 pt-4 border-t border-border flex justify-between items-center text-xs">
                <span className="text-foreground/50">Score: <span className="text-white font-mono">{typeof item.evidenceScore === 'number' ? `${item.evidenceScore}/100` : 'Unavailable'}</span></span>
                <span className="text-accent group-hover:underline">View Report →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
