import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { access, mkdtemp, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

const run = promisify(execFile);
let busy = false;
export class AudioError extends Error {
  constructor(message: string, public status = 503) { super(message); }
}
export async function analyzeAudio(file: File, originalName: string) {
  if (busy) throw new AudioError('An audio check is already running. Please retry after it finishes.', 429);
  busy = true;
  let folder: string | undefined;
  try {
    const root = process.cwd();
    let python = process.env.AUDIO_PYTHON || path.join(root, '.venv-audio312', 'bin', 'python');
    if (!process.env.AUDIO_PYTHON) { try { await access(python); } catch { python = path.join(root, '.venv-audio312', 'Scripts', 'python.exe'); } }
    const model = path.join(root, '.audio-models', 'spectra-aasist3-int8-dynamic.onnx');
    try { await Promise.all([access(python), access(model)]); }
    catch { throw new AudioError('Local audio model is not set up on this server. Run npm run setup:audio (Python 3.12+ required).'); }
    folder = await mkdtemp(path.join(os.tmpdir(), 'deeptruth-audio-'));
    const input = path.join(folder, 'input.wav');
    await writeFile(input, Buffer.from(await file.arrayBuffer()));
    let stdout: string;
    try {
      ({ stdout } = await run(python, [path.join(root, 'scripts/detect_audio.py'), input, model], { timeout: 120000, maxBuffer: 1024 * 1024, env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' } }));
    } catch (error) {
      const failure = error as { stdout?: string; killed?: boolean };
      let message = failure.killed ? 'Audio check timed out. Try a shorter speech clip.' : 'Local audio detector could not run. Check the Python audio setup.';
      try { message = JSON.parse(failure.stdout || '{}').error || message; } catch { /* bounded generic error */ }
      const badInput = /Use mono|Choose a speech clip|Incomplete WAV|file does not start|not a WAVE|unknown format|fmt chunk|data chunk/i.test(message);
      throw new AudioError(message, badInput ? 400 : 503);
    }
    const evidence = JSON.parse(stdout) as { duration: number; segments: { start: number; end: number; score: number; detectedSpeechSeconds: number }[]; speechDetection: { passed: boolean; detectedSeconds: number; fraction: number }; excludedWindows: { start: number; end: number; reason: string }[]; qualityWarnings: string[]; processingNotes?: string[]; rms: number; sha256: string };
    if (!Array.isArray(evidence.segments) || evidence.segments.some(s => !Number.isFinite(s.score) || s.score < 0 || s.score > 1)) throw new AudioError('Invalid audio detector response.');
    if (!Number.isFinite(evidence.duration) || evidence.duration < 2 || evidence.duration > 30 || !Number.isFinite(evidence.rms) || evidence.rms < 0 || evidence.rms > 1 || !/^[a-f0-9]{64}$/.test(evidence.sha256) || !Array.isArray(evidence.excludedWindows) || !Array.isArray(evidence.qualityWarnings) || evidence.qualityWarnings.some(w => typeof w !== 'string')) throw new AudioError('Invalid audio evidence metadata.');
    const validRange = (s: { start: number; end: number }) => Number.isFinite(s.start) && Number.isFinite(s.end) && s.start >= 0 && s.end > s.start && s.end <= evidence.duration + .002;
    if (evidence.segments.length + evidence.excludedWindows.length > 9 || evidence.segments.some(s => !validRange(s) || !Number.isFinite(s.detectedSpeechSeconds) || s.detectedSpeechSeconds < 2 || s.detectedSpeechSeconds > s.end - s.start + .002 || s.detectedSpeechSeconds / (s.end - s.start) < .499) || evidence.excludedWindows.some(s => !validRange(s) || typeof s.reason !== 'string' || !s.reason.trim())) throw new AudioError('Invalid audio window evidence.');
    if (!evidence.speechDetection || typeof evidence.speechDetection.passed !== 'boolean' || !Number.isFinite(evidence.speechDetection.detectedSeconds) || !Number.isFinite(evidence.speechDetection.fraction) || evidence.speechDetection.fraction < 0 || evidence.speechDetection.fraction > 1 || evidence.speechDetection.detectedSeconds < 0 || evidence.speechDetection.detectedSeconds > evidence.duration + .002 || Math.abs(evidence.speechDetection.detectedSeconds / evidence.duration - evidence.speechDetection.fraction) > .002 || (evidence.speechDetection.passed && evidence.speechDetection.detectedSeconds < 2) || !Array.isArray(evidence.qualityWarnings)) throw new AudioError('Invalid speech-quality detector response.');
    if (!evidence.speechDetection.passed && evidence.segments.length) throw new AudioError('Speech-quality check did not pass. No voice verdict is available.');
    if (evidence.processingNotes !== undefined && (!Array.isArray(evidence.processingNotes) || evidence.processingNotes.some(note => typeof note !== 'string'))) throw new AudioError('Invalid audio processing notes.');
    const processingNotes = evidence.processingNotes || [];
    const strongest = evidence.segments.length ? Math.max(...evidence.segments.map(s => s.score)) : null;
    const score = strongest === null ? null : Math.round(strongest * 100);
    // Compare raw values, not the rounded display score. Require consistent windows.
    const allLow = evidence.segments.length > 0 && evidence.segments.every(s => s.score <= .2);
    const allHigh = evidence.segments.length > 0 && evidence.segments.every(s => s.score >= .8);
    const mixed = evidence.segments.some(s => s.score <= .2) && evidence.segments.some(s => s.score >= .8);
    const uncertain = score === null || !evidence.speechDetection.passed || evidence.qualityWarnings.length > 0 || evidence.excludedWindows.length > 0 || (!allLow && !allHigh);
    const status = uncertain ? 'INCONCLUSIVE' : allHigh ? 'MANIPULATION SIGNAL DETECTED' : 'LOW MANIPULATION SIGNAL';
    const limitations = [
      'Speech-only detector: Silero VAD screens for detected speech; it is not a music detector and can miss synthetic or noisy speech. Music, singing, replay attacks, edits, speaker identity and spoken claims are not verified.',
      'Highest eligible-window spoof softmax is an uncalibrated model signal, not accuracy or whole-clip fake probability. Clear display verdicts require every checked window to be ≤0.2 or every window ≥0.8 using unrounded values; all other cases are inconclusive. These prototype thresholds are not independently calibrated.',
      'Compression, language, microphone, noise and unseen generators can affect results. Multi-window checking is an application extension of the fixed 64600-sample model.',
      ...processingNotes, ...evidence.qualityWarnings, ...(mixed ? ['Windows disagree strongly; review the recording manually.'] : []),
    ];
    const modelInfo = { name: 'Spectra-AASIST3 INT8', repository: 'https://huggingface.co/Limitless-8/spectra-aasist3-int8-audio-deepfake', license: 'Apache-2.0', sha256: '444f832d306a2be4f823119f84e698e8821db6a1aab248593d4b05b7a9a48108', input: 'Mono 16000 Hz; pre-emphasis 0.97; 64600-sample windows; repeat short inputs', labels: ['spoof', 'bonafide'] };
    return {
      id: crypto.randomUUID(), timestamp: new Date().toISOString(), filename: originalName.slice(0,255), mediaType: 'audio', detectionSchemaVersion: 3, audioDetectionVersion: 4,
      score, status, color: uncertain ? 'inconclusive' : allHigh ? 'synthetic' : 'authentic',
      desc: evidence.speechDetection.passed ? 'Speech-quality screened local detection. Highest eligible-window score shown; clear verdicts require consistent windows.' : 'Insufficient detected speech. No real/AI voice conclusion is available.',
      assessment: { score, status, reasons: [...new Set([...evidence.qualityWarnings, ...evidence.excludedWindows.map(s => s.reason)]), ...(!allLow && !allHigh && score !== null ? ['Audio window scores do not consistently support a low or high synthetic-voice signal.'] : [])], strongestModel: 'Synthetic speech confidence', completedChecks: evidence.segments.length, requestedChecks: evidence.segments.length + evidence.excludedWindows.length, method: 'Highest eligible-window synthetic-speech signal; verdict requires speech-quality checks and consistent unrounded window decisions.', limitations },
      audioEvidence: { ...evidence, model: modelInfo },
      signals: evidence.segments.map(s => ({ name: `Voice @ ${s.start.toFixed(2)}–${s.end.toFixed(2)}s`, val: Math.round(s.score*1000)/10, status: 'Local model synthetic-speech signal; higher means stronger signal.' })),
      supporting: [...processingNotes, `Speech-presence screening detected approximately ${evidence.speechDetection.detectedSeconds.toFixed(2)} seconds (${Math.round(evidence.speechDetection.fraction * 100)}% of the recording). This is not a manipulation score.`, ...evidence.segments.map(s => `Checked ${s.start.toFixed(2)}–${s.end.toFixed(2)}s: synthetic-speech signal ${Math.round(s.score*1000)/10}/100.`)],
      caution: limitations,
      metadata: { format: 'PCM16 WAV', type: 'audio/wav', duration: `${evidence.duration.toFixed(2)} seconds`, detectedSpeech: `${evidence.speechDetection.detectedSeconds.toFixed(2)} seconds`, source: 'Unknown; origin not verified', processing: 'Browser downmixed and resampled to 16 kHz. Hash identifies converted WAV, not original file.' },
    };
  } finally { if (folder) await rm(folder, { recursive: true, force: true }); busy = false; }
}
