'use client';

import { useRouter } from 'next/navigation';
import { ShieldCheck, AlertTriangle, AlertCircle, Play } from 'lucide-react';
import { saveToHistory } from '@/lib/storage';

const DEMOS = [
  {
    title: "Likely True (Verified)",
    description: "A factually accurate news claim with strong supporting evidence.",
    icon: ShieldCheck,
    color: "text-[#10b981]",
    bg: "bg-[#10b981]/10",
    border: "border-[#10b981]/30",
    data: {
      id: "demo-verified-01",
      timestamp: new Date().toISOString(),
      type: "text",
      originalContent: "The Nobel Prize in Physics 2024 was awarded to John Hopfield and Geoffrey Hinton for foundational discoveries in machine learning.",
      claimsAnalyzed: ["The Nobel Prize in Physics 2024 was awarded to John Hopfield and Geoffrey Hinton.", "The award was for foundational discoveries in machine learning."],
      sources: [
        { sourceName: "NobelPrize.org", type: "Official", url: "#", snippet: "The Royal Swedish Academy of Sciences has decided to award the 2024 Nobel Prize in Physics to John J. Hopfield and Geoffrey E. Hinton." },
        { sourceName: "BBC News", type: "News", url: "#", snippet: "Geoffrey Hinton and John Hopfield have been awarded the Nobel Prize in Physics for their work on artificial neural networks." }
      ],
      verdict: "VERIFIED",
      evidenceScore: 98,
      keyReasoning: "Multiple highly authoritative official and news sources confirm both the recipients and the reason for the award.",
      explainSimply: "This claim is true. Official sources confirm Hopfield and Hinton won the 2024 Nobel Prize in Physics.",
      manipulationSignals: []
    }
  },
  {
    title: "Misleading Context",
    description: "A partially true statement stripped of crucial context to incite fear.",
    icon: AlertTriangle,
    color: "text-[#ef4444]",
    bg: "bg-[#ef4444]/10",
    border: "border-[#ef4444]/30",
    data: {
      id: "demo-misleading-02",
      timestamp: new Date().toISOString(),
      type: "text",
      originalContent: "The government has secretly passed a law to monitor all WhatsApp messages starting tomorrow to catch tax evaders.",
      claimsAnalyzed: ["The government passed a law to monitor WhatsApp messages.", "The monitoring starts tomorrow.", "The purpose is to catch tax evaders."],
      sources: [
        { sourceName: "Reuters Fact Check", type: "News", url: "#", snippet: "A viral message claiming the government will monitor WhatsApp messages is false. WhatsApp remains end-to-end encrypted." },
        { sourceName: "Ministry of Electronics & IT", type: "Official", url: "#", snippet: "No such order has been issued. End-to-end encryption cannot be broken by the government." }
      ],
      verdict: "LIKELY MISLEADING",
      evidenceScore: 12,
      keyReasoning: "Authoritative government sources and independent fact-checkers explicitly deny the claim. WhatsApp's encryption architecture makes the claimed mass monitoring technically impossible.",
      explainSimply: "This is false. The government is not monitoring WhatsApp, and the app remains encrypted.",
      manipulationSignals: [
        { name: "Fear-mongering", detected: true, description: "Language designed to create panic." },
        { name: "False Urgency", detected: true, description: "Claims something drastic will happen 'tomorrow'." }
      ]
    }
  },
  {
    title: "Insufficient Evidence",
    description: "A highly specific rumor that lacks any credible corroboration.",
    icon: AlertCircle,
    color: "text-[#8b5cf6]",
    bg: "bg-[#8b5cf6]/10",
    border: "border-[#8b5cf6]/30",
    data: {
      id: "demo-unverified-03",
      timestamp: new Date().toISOString(),
      type: "text",
      originalContent: "A secret meeting between Elon Musk and aliens took place in Antarctica last month.",
      claimsAnalyzed: ["Elon Musk had a secret meeting.", "The meeting was with aliens.", "It took place in Antarctica last month."],
      sources: [
        { sourceName: "Web Crawler", type: "Unknown", url: "#", snippet: "No highly authoritative sources directly confirm or deny this exact phrasing in recent indexes." }
      ],
      verdict: "UNVERIFIED",
      evidenceScore: 40,
      keyReasoning: "No credible news outlets, official logs, or primary sources mention this event. Extraordinary claims require extraordinary evidence.",
      explainSimply: "We don't have any reliable evidence to prove or disprove this, but it is highly unlikely to be true.",
      manipulationSignals: [
        { name: "Conspiracy Tone", detected: true, description: "Claims involving 'secret meetings' without verifiable participants." }
      ]
    }
  }
];

export default function DemoPage() {
  const router = useRouter();

  const runDemo = (demoData: any) => {
    // 1. Save to session storage so the results page can read it
    sessionStorage.setItem('analysisResult', JSON.stringify(demoData));
    
    // 2. Save to persistent history so judges see it in the dashboard
    saveToHistory(demoData);

    // 3. Navigate
    router.push(`/results?id=${demoData.id}`);
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 pt-24 pb-12 min-h-screen">
      <div className="mb-12 text-center">
        <div className="inline-block px-3 py-1 bg-accent text-black text-[10px] font-bold uppercase tracking-widest rounded mb-4">Hackathon Demo Mode</div>
        <h1 className="text-4xl font-extrabold tracking-tight mb-4 font-['Chakra_Petch',sans-serif]">Interactive Verification Demos</h1>
        <p className="text-foreground/60 max-w-2xl mx-auto">
          These deterministic demos are pre-processed to guarantee a flawless live presentation. 
          They showcase the full evidence pipeline without risking live API rate limits or timeouts.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {DEMOS.map((demo, i) => (
          <div key={i} className={`glass-panel border ${demo.border} p-6 flex flex-col items-start relative overflow-hidden group hover:-translate-y-1 transition-all duration-300`}>
            <div className={`absolute -right-12 -top-12 w-40 h-40 ${demo.bg} rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity`}></div>
            
            <div className={`w-12 h-12 rounded-xl ${demo.bg} flex items-center justify-center mb-6 relative z-10 border border-white/5`}>
              <demo.icon className={`w-6 h-6 ${demo.color}`} />
            </div>
            
            <h2 className="text-xl font-bold mb-2 font-['Chakra_Petch',sans-serif] relative z-10">{demo.title}</h2>
            <p className="text-sm text-foreground/70 mb-8 flex-grow relative z-10">{demo.description}</p>
            
            <button 
              onClick={() => runDemo(demo.data)}
              className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 ${demo.bg} ${demo.color} border border-transparent hover:${demo.border} transition-colors relative z-10`}
            >
              <Play className="w-4 h-4 fill-current" /> Run Demo Analysis
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
