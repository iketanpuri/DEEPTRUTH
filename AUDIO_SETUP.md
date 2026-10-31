# Local speech deepfake detection

The Audio tab accepts browser-decodable speech clips (WAV/MP3/M4A/OGG/FLAC), 2–30 seconds, up to 20 MB. Prefer 4–30 seconds of clear speech without music. The browser downmixes/resamples to mono 16 kHz PCM16 WAV; the server invokes a Python CPU worker. Audio is not sent to the image APIs. Temporary server WAV files are deleted after processing.

## Setup on another machine

Install Python 3.12 or newer. Run `npm run setup:audio` from the app directory. Set `AUDIO_SETUP_PYTHON` if `python3` is older. Setup creates `.venv-audio312`, installs ONNX Runtime and NumPy, downloads ~364 MB weights and verifies SHA-256. Restart `npm run dev`. No paid audio API or key is required. `AUDIO_PYTHON` optionally overrides the runtime executable. Deployments require Python, the model weights, child-process support, sufficient CPU/RAM and a request timeout of at least 120 seconds; static hosting alone cannot run this detector.

## Model attribution and interpretation

Model: [Limitless-8/Spectra-AASIST3 INT8](https://huggingface.co/Limitless-8/spectra-aasist3-int8-audio-deepfake), derivative of [lab260/Spectra-AASIST3](https://huggingface.co/lab260/Spectra-AASIST3), Apache-2.0. Model SHA-256: `444f832d306a2be4f823119f84e698e8821db6a1aab248593d4b05b7a9a48108`. See model card and accompanying AUDIO_MODEL_LICENSE.txt. This app uses pretrained weights, not a model trained by the team.

Author preprocessing: 16 kHz mono waveform; pre-emphasis y[0]=x[0], y[n]=x[n]-0.97*x[n-1], repeat short clips, 64600-sample input named `wav`. Output `logits` class0=spoof, class1=bonafide; stable softmax. The application checks consecutive windows plus an end-aligned window to cover all audio, and displays the highest eligible-window spoof signal. Clear verdicts require all checked windows to be low (raw score ≤0.2) or all high (raw score ≥0.8), not merely a single peak; rounding is for display only. This multi-window extension has not been independently calibrated. Mixed high/low windows, poor quality and intermediate scores are inconclusive. Silence yields no score. Short clips carry a visible processing note when repeated using the documented preprocessing; repetition alone does not force abstention after speech and quality checks pass.

This is a speech synthesis/voice-cloning indicator, not a proof of authenticity, speaker verification, transcription, replay detector or claim fact-checker. Silero VAD screens for detected speech before classification; music/singing and other non-speech are still outside the supported manipulation task. The VAD can also miss unfamiliar synthetic speech. Prototype ≤20 and ≥80 display thresholds are not validated application accuracy. Do not quote model-card benchmarks as this application's accuracy. Converted WAV hashes do not identify the original encoded upload. Exported reports retain model identity, scores, timestamps and caveats.


## Speech-quality screening (audio pipeline v2)

[Silero VAD](https://github.com/snakers4/silero-vad), MIT, revision `066409f3d9db45a30d21dfcbf9147826ffdd7052`. Artifact `silero_vad.onnx` SHA-256 `1a153a22f4509e292a94e67d6f9b85e8deb25b4988682b7e174c65279d8788e3`; see SILERO_VAD_LICENSE.txt. Setup downloads and verifies both models. Its 512-sample recurrent inference uses 64 samples of context, 16 kHz raw waveform and default 0.5 speech threshold. At least 2 seconds of detected speech is required globally; windows with less than 1 second of detected speech are excluded and produce a coverage warning. These are conservative application quality heuristics, not calibrated accuracy improvements. Input samples are not spliced, denoised or altered after preprocessing. VAD fractions and excluded windows are retained in the report. A failed or missing quality model must not fall back to an unchecked real/AI verdict.

## Pipeline v3 safeguards

Each classified window must contain at least 2 seconds of detected speech and at least 50% speech coverage, with RMS ≥0.005 and at most 1% clipped samples. Excluded windows retain their specific reasons and force an inconclusive whole-recording verdict, even if a worker omits its warning list. Worker timestamps, speech durations, coverage consistency, hashes and result bounds are validated before using a score. Cache version 3 prevents reuse of earlier audio decisions. These conservative quality heuristics reduce unsupported verdicts; they are not evidence of improved model accuracy or music detection.

## Pipeline v4: supported short inputs

Documented tile-repetition of eligible short clips is a non-blocking `processingNotes` entry, preserved in supporting evidence and caution text. Actual quality warnings, excluded windows, insufficient detected speech and inconsistent scores still force abstention. The ≥2 seconds of detected speech, per-window coverage rules and raw decision thresholds are unchanged. No filename or sample-specific classification rule is used. This corrects an application gate; it does not establish calibrated accuracy for short recordings.
