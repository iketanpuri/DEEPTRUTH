// src/lib/storage.ts

export type VerificationResult = {
  id: string;
  timestamp: string;
  verdict: string;
  evidenceScore?: number;
  score?: number; // fallback for media
  originalContent?: string;
  filename?: string;
  type: 'text' | 'media';
};

export const STORAGE_KEY = 'clarifake_history';

export function saveToHistory(result: any) {
  if (typeof window === 'undefined') return;
  
  try {
    const existingStr = localStorage.getItem(STORAGE_KEY);
    const existing: VerificationResult[] = existingStr ? JSON.parse(existingStr) : [];
    
    // Don't save duplicates
    if (existing.find(item => item.id === result.id)) return;

    const summary: VerificationResult = {
      id: result.id,
      timestamp: result.timestamp || new Date().toISOString(),
      verdict: result.verdict || result.status,
      evidenceScore: result.evidenceScore || result.score,
      originalContent: result.originalContent,
      filename: result.filename,
      type: result.claimsAnalyzed ? 'text' : 'media'
    };

    const updated = [summary, ...existing];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Failed to save to history:", error);
  }
}

export function getHistory(): VerificationResult[] {
  if (typeof window === 'undefined') return [];
  try {
    const existingStr = localStorage.getItem(STORAGE_KEY);
    return existingStr ? JSON.parse(existingStr) : [];
  } catch {
    return [];
  }
}

export function clearHistory() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}
