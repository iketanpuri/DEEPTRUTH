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

export const STORAGE_KEY = 'deeptruth_history';

// Preserve same-origin history across an application rename without retaining old branding.
function readStoredHistory(): VerificationResult[] {
  const current = localStorage.getItem(STORAGE_KEY);
  if (current) return JSON.parse(current);
  for (let index = 0; index < localStorage.length; index++) {
    const key = localStorage.key(index);
    if (!key || key === STORAGE_KEY || !key.endsWith('_history')) continue;
    try {
      const records: unknown = JSON.parse(localStorage.getItem(key) || 'null');
      if (!Array.isArray(records) || !records.every(item => item && typeof item.id === 'string' && typeof item.verdict === 'string' && typeof item.timestamp === 'string' && (item.type === 'text' || item.type === 'media'))) continue;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
      localStorage.removeItem(key);
      return records;
    } catch { /* Leave unrelated or invalid storage untouched. */ }
  }
  return [];
}


export function saveToHistory(result: any) {
  if (typeof window === 'undefined') return;
  
  try {
    const existing = readStoredHistory();
    
    // Don't save duplicates
    if (existing.find(item => item.id === result.id)) return;

    const summary: VerificationResult = {
      id: result.id,
      timestamp: result.timestamp || new Date().toISOString(),
      verdict: result.verdict || result.status,
      evidenceScore: result.evidenceScore ?? result.score,
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
    return readStoredHistory();
  } catch {
    return [];
  }
}

export function clearHistory() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}
