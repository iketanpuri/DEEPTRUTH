'use client';

import { useEffect, useState } from 'react';
import { getHistory, VerificationResult } from '@/lib/storage';
import { ShieldCheck, AlertTriangle, AlertCircle, Activity, FileText, Database, Share2, Search } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [history, setHistory] = useState<VerificationResult[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    text: 0,
    media: 0,
    verified: 0,
    misleading: 0,
    unverified: 0,
    avgScore: 0
  });

  useEffect(() => {
    const data = getHistory();
    setHistory(data);
    
    if (data.length > 0) {
      setStats({
        total: data.length,
        text: data.filter(d => d.type === 'text').length,
        media: data.filter(d => d.type === 'media').length,
        verified: data.filter(d => d.verdict === 'VERIFIED' || d.verdict === 'LIKELY AUTHENTIC' || d.verdict === 'LOW MANIPULATION SIGNAL').length,
        misleading: data.filter(d => d.verdict === 'LIKELY MISLEADING' || d.verdict === 'LIKELY SYNTHETIC' || d.verdict === 'MANIPULATION SIGNAL DETECTED').length,
        unverified: data.filter(d => d.verdict === 'UNVERIFIED' || d.verdict === 'PARTIALLY VERIFIED' || d.verdict === 'INCONCLUSIVE' || d.verdict === 'ANALYSIS UNAVAILABLE').length,
        avgScore: Math.round(data.reduce((acc, curr) => acc + (curr.evidenceScore || 0), 0) / data.length)
      });
    }
  }, []);

  return (
    <div className="container mx-auto max-w-6xl px-4 pt-24 pb-12 min-h-screen">
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold tracking-tight mb-2 font-['Chakra_Petch',sans-serif]">System Dashboard</h1>
        <p className="text-foreground/60 text-sm">Real-time metrics for your verification investigations.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <div className="glass-card p-5 border-l-2 border-l-white">
          <div className="text-foreground/50 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2"><Database className="w-3 h-3"/> Total Scans</div>
          <div className="text-3xl font-bold">{stats.total}</div>
        </div>
        <div className="glass-card p-5 border-l-2 border-l-[#10b981] bg-[#10b981]/5">
          <div className="text-[#10b981] text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2"><ShieldCheck className="w-3 h-3"/> Low signal / verified claims</div>
          <div className="text-3xl font-bold text-[#10b981]">{stats.verified}</div>
        </div>
        <div className="glass-card p-5 border-l-2 border-l-[#ef4444] bg-[#ef4444]/5">
          <div className="text-[#ef4444] text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2"><AlertTriangle className="w-3 h-3"/> Flagged signals / claims</div>
          <div className="text-3xl font-bold text-[#ef4444]">{stats.misleading}</div>
        </div>
        <div className="glass-card p-5 border-l-2 border-l-accent bg-accent/5">
          <div className="text-accent text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2"><Activity className="w-3 h-3"/> Avg Score</div>
          <div className="text-3xl font-bold text-accent font-mono">{stats.avgScore}/100</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Source Stats */}
        <div className="glass-panel p-6 border border-border/50">
          <h2 className="text-lg font-bold font-['Chakra_Petch',sans-serif] mb-6 flex items-center gap-2">
            <Search className="w-4 h-4 text-accent" /> Scan Types
          </h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Text / Claims</span>
                <span className="font-mono">{stats.text}</span>
              </div>
              <div className="w-full h-2 bg-surface rounded overflow-hidden"><div className="h-full bg-accent" style={{width: `${stats.total > 0 ? (stats.text/stats.total)*100 : 0}%`}}></div></div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Media Forensics</span>
                <span className="font-mono">{stats.media}</span>
              </div>
              <div className="w-full h-2 bg-surface rounded overflow-hidden"><div className="h-full bg-white" style={{width: `${stats.total > 0 ? (stats.media/stats.total)*100 : 0}%`}}></div></div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="glass-panel p-6 border border-border/50">
          <h2 className="text-lg font-bold font-['Chakra_Petch',sans-serif] mb-6 flex items-center gap-2">
            <Activity className="w-4 h-4 text-accent" /> Quick Actions
          </h2>
          <div className="grid grid-cols-1 gap-3">
            <Link href="/verify" className="bg-white text-black p-4 rounded-xl font-bold flex justify-between items-center hover:bg-gray-200 transition-colors">
              <span>Start New Verification</span>
              <span>→</span>
            </Link>
            <Link href="/history" className="bg-surface border border-border p-4 rounded-xl font-bold flex justify-between items-center hover:bg-surface-hover transition-colors">
              <span>View Full History</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
