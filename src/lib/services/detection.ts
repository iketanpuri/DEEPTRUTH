import sharp from 'sharp';
import { createHash } from 'node:crypto';
import { analyzeHive, type HiveEvidence } from './hive';
import { analyzeLocalImage, type LocalImageResult } from './local-image';
let quotaCooldown: { until: number; fingerprint: string; reason: string } | null = null;

type Requester = (url: string, init?: RequestInit) => Promise<Response>;
export type ModelSignal = { model: 'genai' | 'deepfake'; name: string; score: number | null; status: 'ok' | 'unavailable'; detail: string; provider?: 'Sightengine' | 'CommunityForensics' | 'Combined' | 'Hive' };
export type SampleEvidence = {
  index: number; timestamp: number | null; sha256: string; preview: string;
  width: number; height: number; qualityWarnings: string[]; signals: ModelSignal[]; requestId: string | null; localDetector?: LocalImageResult; fallbackReason?: string; providerChecks?: { sightengine: { provider: 'Sightengine'; requestId: string | null; genai: number | null; deepfake: number | null; detail: string }; hive: HiveEvidence }; consensus?: { genai: { providers: string[]; score: number | null; disagreement: boolean }; deepfake: { providers: string[]; score: number | null; disagreement: boolean }; method: string };
};
export const DETECTION_LIMITATIONS = [
  'AI-generation detection checks fully synthetic imagery; deepfake detection checks identity-level facial swaps/modifications. These scores measure different tasks.',
  'Model confidence is not measured application accuracy or a calibrated authenticity probability. Low scores do not establish authenticity or provenance.',
  'The face-manipulation model focuses on the most prominent photographic faces. Small/obscured faces, drawings, retouching, and unfamiliar manipulation methods may be missed.',
  'Compression, resizing, blur, lighting, and distribution shifts can change results. Image-quality checks are heuristics, not proof of manipulation.',
  'No pixel-level localization or heatmap is returned by this integration. Thumbnails identify the actual samples checked, not manipulated regions.',
  'OCR and reverse-image matches provide context only. A visual match does not establish the first publisher, truth, or manipulation.',
];
function signal(model: 'genai' | 'deepfake', score: unknown, detail?: string): ModelSignal {
  const valid = typeof score === 'number' && Number.isFinite(score) && score >= 0 && score <= 1;
  return { model, name: model === 'genai' ? 'AI-generation confidence' : 'Face-manipulation confidence', score: valid ? score as number : null, status: valid ? 'ok' : 'unavailable', detail: detail || (valid ? 'Sightengine model output; higher means stronger signal for this specific task.' : 'No valid score returned for this model.') };
}
export async function analyzeSample(file: File, index: number, timestamp: number | null, request: Requester): Promise<SampleEvidence> {
  const bytes = Buffer.from(await file.arrayBuffer());
  const image = sharp(bytes, { limitInputPixels: 25_000_000, animated: false });
  const meta = await image.metadata();
  if (!['jpeg', 'png', 'webp'].includes(meta.format || '') || !meta.width || !meta.height) throw new Error('Unsupported or unreadable image. Choose JPG, PNG, or WebP.');
  const qualityWarnings: string[] = [];
  if (Math.min(meta.width, meta.height) < 224) qualityWarnings.push('Low resolution: the shortest side is below 224 pixels. Upload a larger original.');
  const { data, info } = await image.clone().rotate().resize(64, 64, { fit: 'fill' }).greyscale().raw().toBuffer({ resolveWithObject: true });
  let edges = 0;
  for (let y = 1; y < info.height; y++) for (let x = 1; x < info.width; x++) {
    const i = y * info.width + x;
    edges += Math.abs(data[i] - data[i - 1]) + Math.abs(data[i] - data[i - info.width]);
  }
  if (edges / ((info.width - 1) * (info.height - 1) * 2) < 2) qualityWarnings.push('Very low visual detail: the image may be blurred or naturally smooth. A reliable assessment may not be possible.');
  const previewBytes = await image.clone().rotate().resize({ width: 400, height: 300, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 65 }).toBuffer();
  const base = { index, timestamp, sha256: createHash('sha256').update(bytes).digest('hex'), preview: `data:image/jpeg;base64,${previewBytes.toString('base64')}`, width: meta.width, height: meta.height, qualityWarnings };
  const fallback = async (detail: string): Promise<SampleEvidence> => {
    try {
      const localDetector = await analyzeLocalImage(bytes);
      return { ...base, requestId: null, localDetector, fallbackReason: detail, signals: [
        { ...signal('genai', localDetector.score, 'Community Forensics local CPU model; AI-generation signal only. Sightengine unavailable: ' + detail), provider: 'CommunityForensics' },
        { ...signal('deepfake', null, 'Not checked: Sightengine is unavailable. The local fallback does not detect identity-level face swaps.'), provider: 'Sightengine' },
      ] };
    } catch (error) {
      const reason = `${detail} Local fallback: ${error instanceof Error ? error.message : 'unavailable'}`;
      return { ...base, requestId: null, fallbackReason: reason, signals: [signal('genai', null, reason), signal('deepfake', null, reason)] };
    }
  };
  const runSightengine = async (): Promise<SampleEvidence> => {
  if (!process.env.SIGHTENGINE_USER || !process.env.SIGHTENGINE_SECRET) return fallback('Sightengine credentials are missing.');
  const fingerprint = createHash('sha256').update(process.env.SIGHTENGINE_USER + ':' + process.env.SIGHTENGINE_SECRET).digest('hex');
  if (quotaCooldown && quotaCooldown.fingerprint === fingerprint && quotaCooldown.until > Date.now()) return fallback(quotaCooldown.reason);
  try {
    const form = new FormData(); form.append('models', 'genai,deepfake'); form.append('api_user', process.env.SIGHTENGINE_USER); form.append('api_secret', process.env.SIGHTENGINE_SECRET); form.append('media', file);
    const response = await request('https://api.sightengine.com/1.0/check.json', { method: 'POST', body: form });
    const result = await response.json().catch(() => null);
    if (!response.ok || result?.status !== 'success') {
      const limited = result?.error?.type === 'usage_limit' || response.status === 429;
      const reason = limited ? 'Sightengine usage limit reached.' : `Sightengine check unavailable (HTTP ${response.status}).`;
      if (limited) quotaCooldown = { until: Date.now() + 5 * 60 * 1000, fingerprint, reason };
      return fallback(reason);
    }
    return { ...base, requestId: result.request?.id || null, signals: [signal('genai', result.type?.ai_generated), signal('deepfake', result.type?.deepfake)].map(m => ({ ...m, provider: 'Sightengine' as const })) };
  } catch (error) { return fallback(error instanceof Error ? error.message : 'Detector connection failed.'); }
  };
  if (!process.env.HIVE_API_KEY?.trim()) return runSightengine();
  const [sightengine, hive] = await Promise.all([runSightengine(), analyzeHive(file, request)]);
  const se = (model: 'genai' | 'deepfake') => sightengine.signals.find(s => s.model === model && s.provider === 'Sightengine' && s.status === 'ok')?.score ?? null;
  const checks = { sightengine: { provider: 'Sightengine' as const, requestId:sightengine.requestId,genai:se('genai'),deepfake:se('deepfake'),detail:sightengine.fallbackReason || 'Sightengine task-specific outputs.' }, hive };
  const average = (task: 'genai' | 'deepfake') => {
    const values = [{ provider:'Sightengine',value:checks.sightengine[task] },{provider:'Hive',value:hive[task]}].filter((x): x is {provider:string;value:number} => typeof x.value === 'number' && Number.isFinite(x.value));
    return {providers:values.map(x=>x.provider), score:values.length ? values.reduce((sum,x)=>sum+x.value,0)/values.length : null, disagreement:values.length===2 && Math.abs(values[0].value-values[1].value)>=.4};
  };
  const genai=average('genai'), deepfake=average('deepfake');
  // If both hosted providers fail, keep the existing local fallback without inventing an API average.
  if(genai.score===null && deepfake.score===null) return {...sightengine,providerChecks:checks};
  return { ...base, requestId:sightengine.requestId, providerChecks:checks,
    consensus:{genai,deepfake,method:'Arithmetic mean of successful Sightengine and Hive scores for the SAME task on the SAME sample. One returned score is a single-provider result, not a two-provider average. AI-generation and face-manipulation are never averaged together.'},
    signals: [(['genai',genai] as const),(['deepfake',deepfake] as const)].map(([task,result]) => ({...signal(task,result.score, result.providers.length===2 ? 'Arithmetic mean of Sightengine and Hive '+task+' signals; uncalibrated, not accuracy.' + (result.disagreement ? ' Providers disagree strongly on this task; review manually.' : '') : result.providers.length===1 ? 'Single-provider '+task+' result from '+result.providers[0]+'; the other provider did not return this score.' : 'No provider returned a valid score for this task.'),provider:result.providers.length===2?'Combined':result.providers[0] as 'Sightengine' | 'Hive' | undefined})),
  };

}

export function summarizeEvidence(samples: SampleEvidence[], isVideo: boolean) {
  const signals = samples.flatMap(s => s.signals);
  const valid = signals.filter(s => s.status === 'ok' && typeof s.score === 'number');
  const strongest = valid.reduce<ModelSignal | null>((best, s) => !best || s.score! > best.score! ? s : best, null);
  const dual = samples.some(s => s.providerChecks);
  const anyTaskDisagreement = samples.some(s => s.consensus?.genai.disagreement || s.consensus?.deepfake.disagreement);
  const singleProvider = dual && samples.every(s => s.consensus && Math.max(s.consensus.genai.providers.length,s.consensus.deepfake.providers.length) === 1);
  const score = strongest ? Math.round(strongest.score! * 100) : null;
  const headlineSample = strongest ? samples.find(s=>s.signals.includes(strongest)) : undefined;
  const disagreement = strongest ? samples.some(s=>s.consensus?.[strongest.model].disagreement) : anyTaskDisagreement;
  const headlineProviders = strongest && headlineSample?.consensus ? headlineSample.consensus[strongest.model].providers : strongest?.provider ? [strongest.provider] : [];
  const taskHeadline = (task: 'genai' | 'deepfake') => { const scores=samples.map(s=>s.consensus?.[task].score).filter((v):v is number=>typeof v==='number');return scores.length?Math.round(Math.max(...scores)*100):null; };
  const incomplete = valid.length < signals.length;
  const generationOnly = samples.length > 0 && samples.every(s => s.signals.some(m => m.model === 'genai' && m.status === 'ok' && (m.provider === 'CommunityForensics' || dual)) && s.signals.filter(m => m.model === 'deepfake').every(m => m.status === 'unavailable'));
  const qualityConcern = samples.some(s => s.qualityWarnings.length > 0);
  const uncertain = disagreement || score === null || (incomplete && !generationOnly) || qualityConcern || ((generationOnly || dual) ? strongest!.score! > .2 && strongest!.score! < .8 : score > 20 && score < 80);
  const status = score === null ? 'ANALYSIS UNAVAILABLE' : uncertain ? 'INCONCLUSIVE' : score >= 80 ? 'MANIPULATION SIGNAL DETECTED' : 'LOW MANIPULATION SIGNAL';
  const reasons: string[] = [];
  if (score === null) reasons.push('No detector returned a usable score. Check the provider status in Forensic Signals.');
  if (disagreement) reasons.push(`Sightengine and Hive disagree on the ${strongest?.model === 'deepfake' ? 'face-manipulation' : 'AI-generation'} result.`);
  reasons.push(...new Set(samples.flatMap(s=>s.qualityWarnings)));
  if (incomplete || singleProvider) {
    const failures = [...new Set(samples.flatMap(s=>s.providerChecks ? [s.providerChecks.sightengine,s.providerChecks.hive].filter(p=>p.genai===null && p.deepfake===null).map(p=>p.detail) : s.signals.filter(m=>m.status==='unavailable').map(m=>m.detail)))];
    reasons.push(failures.length ? failures.slice(0,2).map(detail=>detail.slice(0,220)).join(' ') : 'Some model checks were unavailable; see their status below.');
  }
  if (strongest && strongest.score! > .2 && strongest.score! < .8) reasons.push(`The strongest signal (${score}/100) is in the uncertain range, so a clear verdict is not supported.`);

  return {
    reasons,
    scope: generationOnly ? 'ai-generation-only' : singleProvider ? 'single-provider' : 'full',
    dualProvider: dual, disagreement, anyTaskDisagreement, headlineProviders, generationScore: taskHeadline('genai'),
    faceManipulationScore: taskHeadline('deepfake'),
    score, status, color: uncertain ? 'inconclusive' as const : score! >= 80 ? 'synthetic' as const : 'authentic' as const,
    completedChecks: dual ? samples.reduce((n,s)=>n + (s.providerChecks ? [s.providerChecks.sightengine.genai,s.providerChecks.sightengine.deepfake,s.providerChecks.hive.genai,s.providerChecks.hive.deepfake].filter(v=>typeof v==='number').length + (s.localDetector && !s.consensus ? 1 : 0) : s.signals.filter(v=>v.status==='ok').length),0) : valid.length, requestedChecks: dual ? samples.length*4 + samples.filter(s=>s.localDetector && !s.consensus).length : signals.length,
    strongestModel: strongest?.name || null,
    method: dual ? 'For each sample, matching task scores from Sightengine and Hive are averaged. The headline is the strongest available task-specific signal across samples. Single-provider scores are labelled and are not two-provider averages. This is not calibrated probability or accuracy.' : 'The headline is the strongest completed model signal across analysed samples, not an average, joint probability, or accuracy estimate. Inspect each task-specific confidence separately.',
    thresholds: dual ? 'Prototype task-wise display thresholds: unrounded scores ≤0.2 low, ≥0.8 high; intermediate scores, quality warnings or headline-task provider disagreement (difference ≥0.4) are inconclusive. A missing provider yields a labelled single-provider result when possible. Not independently calibrated.' : generationOnly ? 'AI-generation-only fallback: unrounded scores ≤0.2 are low and ≥0.8 high; intermediate scores or quality warnings are inconclusive. Face-swap checking remains unavailable. These thresholds are not independently calibrated.' : 'Prototype display thresholds: ≤20 low signal, ≥80 high signal; intermediate scores, missing checks, or quality warnings are inconclusive. Thresholds have not been calibrated on a held-out dataset.',
    limitations: [...DETECTION_LIMITATIONS, ...(dual ? ['Two-provider arithmetic means are heuristic, not calibrated probabilities. Provider outputs may be correlated. A task-score difference of 0.4 or more makes that task inconclusive. An independently supported high signal on the other task may still establish a manipulation signal.'] : []), ...(singleProvider ? ['Only one hosted provider returned scores; a two-provider average is unavailable.'] : []), ...(isVideo ? [`Only ${samples.length} sampled JPEG frames were analysed. Unsampled frames, audio, lip-sync, and motion consistency were not analysed. Frame resizing/re-encoding can affect detection.`] : []), ...(generationOnly ? ['Local fallback checks AI-generated imagery only. Face swaps, edits, authenticity and provenance are not verified. Low generation scores do not mean the image is real.'] : []), ...(incomplete ? ['Some checks failed. Available scores do not represent a complete analysis.'] : [])],
  };
}
