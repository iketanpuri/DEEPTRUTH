"""CPU inference. Spectra-AASIST3 quantization (Apache-2.0); see AUDIO_SETUP.md."""
import sys, json, wave, hashlib
from pathlib import Path
import numpy as np
import onnxruntime as ort

WINDOW = 64600
VAD_SHA256 = '1a153a22f4509e292a94e67d6f9b85e8deb25b4988682b7e174c65279d8788e3'

def speech_presence(x, model):
    # Silero ONNX wrapper convention: 512 samples + 64 context, recurrent state.
    vad_path = Path(model).with_name('silero_vad.onnx')
    if not vad_path.exists(): raise ValueError('Speech-quality model missing. Run npm run setup:audio.')
    if hashlib.sha256(vad_path.read_bytes()).hexdigest() != VAD_SHA256:
        raise ValueError('Speech-quality model integrity check failed. Run npm run setup:audio.')
    options = ort.SessionOptions(); options.intra_op_num_threads = 1; options.inter_op_num_threads = 1
    session = ort.InferenceSession(str(vad_path), sess_options=options, providers=['CPUExecutionProvider'])
    state = np.zeros((2,1,128), dtype=np.float32)
    context = np.zeros((1,64), dtype=np.float32)
    speech = []
    for start in range(0, len(x), 512):
        chunk = x[start:start+512]
        chunk = np.pad(chunk, (0, 512-len(chunk))).reshape(1,512)
        batch = np.concatenate((context, chunk), axis=1)
        out, state = session.run(None, {'input': batch, 'state': state, 'sr': np.array(16000, dtype=np.int64)})
        probability = float(out[0][0])
        if not np.isfinite(probability) or not 0 <= probability <= 1: raise ValueError('Invalid speech detector output.')
        speech.append(probability >= .5)
        context = batch[:, -64:]
    # Sample mask preserves timestamps; do not splice or denoise model input.
    mask = np.repeat(np.asarray(speech, dtype=bool), 512)[:len(x)]
    return mask


def analyse(filename, model, session=None):
    with wave.open(filename, 'rb') as f:
        if (f.getnchannels(), f.getsampwidth(), f.getframerate(), f.getcomptype()) != (1, 2, 16000, 'NONE'):
            raise ValueError('Use mono 16 kHz PCM16 WAV. Upload through the Audio tab to convert automatically.')
        if not 32000 <= f.getnframes() <= 480000:
            raise ValueError('Choose a speech clip between 2 and 30 seconds.')
        raw = f.readframes(f.getnframes())
        if len(raw) != f.getnframes() * 2:
            raise ValueError('Incomplete WAV data.')
    x = np.frombuffer(raw, dtype='<i2').astype(np.float32) / 32768.0
    warnings = []
    processing_notes = []
    rms = float(np.sqrt(np.mean(x*x)))
    if rms < .005: warnings.append('Very quiet or silent recording; upload clearer speech.')
    if float(np.mean(np.abs(x) >= .999)) > .01: warnings.append('Clipped recording; distortion can affect detection.')
    if len(x) < WINDOW: processing_notes.append('Short clip: repeated to the model-required 4.04-second input using its documented preprocessing. Repetition adds no independent speech evidence; a longer original recording is preferable.')
    # Author preprocessing: pre-emphasis BEFORE repetition/windowing.
    y = np.empty_like(x); y[0] = x[0]; y[1:] = x[1:] - .97*x[:-1]
    starts = list(range(0, max(1, len(y)-WINDOW+1), WINDOW))
    if len(y) > WINDOW and starts[-1] != len(y)-WINDOW: starts.append(len(y)-WINDOW)
    segments = []
    speech_mask = speech_presence(x, model)
    speech_seconds = float(np.sum(speech_mask)) / 16000
    speech_fraction = float(np.mean(speech_mask))
    enough_speech = speech_seconds >= 2.0
    if not enough_speech:
        warnings.append(f'Insufficient detected speech ({speech_seconds:.2f}s). Need at least 2 seconds of detected speech; use 4–30 seconds of clear talking. Music, singing or unfamiliar synthetic voices may affect speech detection. No real/AI conclusion is available.')
    excluded = []
    # Silence/non-speech cannot produce a real/fake verdict.
    if rms >= .005 and enough_speech:
        options = ort.SessionOptions(); options.intra_op_num_threads = 2; options.inter_op_num_threads = 1
        if session is None:
            session = ort.InferenceSession(model, sess_options=options, providers=['CPUExecutionProvider'])
        for start in starts:
            window_speech = float(np.sum(speech_mask[start:start+WINDOW])) / 16000
            original_window = x[start:start+WINDOW]
            window_rms = float(np.sqrt(np.mean(original_window * original_window)))
            clipped_fraction = float(np.mean(np.abs(original_window) >= .999))
            reason = None
            if window_speech < 2.0 or window_speech / (len(original_window) / 16000) < .5:
                reason = 'Insufficient speech coverage: need 2 seconds and at least half of this window to contain detected speech.'
            elif window_rms < .005:
                reason = 'Very quiet window; insufficient usable signal.'
            elif clipped_fraction > .01:
                reason = 'Clipped window; distortion can affect detection.'
            if reason:
                excluded.append({'start': round(start/16000,3), 'end': round(min(start+WINDOW,len(x))/16000,3), 'reason': reason})
                continue
            chunk = y[start:start+WINDOW]
            if len(chunk) < WINDOW: chunk = np.tile(chunk, int(np.ceil(WINDOW/len(chunk))))[:WINDOW]
            logits = session.run(['logits'], {'wav': chunk.reshape(1, WINDOW)})[0][0].astype(np.float64)
            if logits.shape != (2,) or not np.all(np.isfinite(logits)): raise ValueError('Invalid model output.')
            probabilities = np.exp(logits - np.max(logits)); probabilities /= probabilities.sum()
            segments.append({'start': round(start/16000, 3), 'end': round(min(start+WINDOW,len(x))/16000,3), 'score': float(probabilities[0]), 'detectedSpeechSeconds': round(window_speech,3)})
    if excluded:
        warnings.append(f'{len(excluded)} window(s) excluded by speech coverage or recording-quality checks; the whole clip was not classified.')
    warnings.extend(dict.fromkeys(window['reason'] for window in excluded))
    return {'processingNotes': processing_notes, 'speechDetection': {'model': 'Silero VAD', 'sha256': VAD_SHA256, 'threshold': .5, 'detectedSeconds': round(speech_seconds,3), 'fraction': round(speech_fraction,4), 'minimumSeconds': 2.0, 'passed': enough_speech}, 'excludedWindows': excluded, 'duration': len(x)/16000, 'segments': segments, 'qualityWarnings': warnings, 'rms': rms,
            'sha256': hashlib.sha256(Path(filename).read_bytes()).hexdigest()}

if __name__ == '__main__':
    try: print(json.dumps(analyse(sys.argv[1], sys.argv[2]), allow_nan=False))
    except Exception as error:
        print(json.dumps({'error': str(error)})); sys.exit(1)
