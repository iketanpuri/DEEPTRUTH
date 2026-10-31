# DeepTruth / DeepTruth — current setup

## Run

Keep your existing SIGHTENGINE_USER and SIGHTENGINE_SECRET in .env.local, then run npm run dev. No Hive key, additional account, or local model download is required. The app calls Sightengine with models=genai,deepfake. Your account must allow both models and have sufficient quota. Combining models consumes additional provider operations; each video checks three frames.

## Implemented scope

- Images: fully AI-generated imagery and identity-level face swaps/modifications, using separate Sightengine model confidences.
- Videos: browser extracts JPEG frames at 15%, 50%, and 85% of duration, limited to a maximum dimension of 1920px. Both models classify each frame. This is not full-video temporal or audio analysis.
- Supporting evidence: actual sample thumbnails, timestamps, dimensions, sample SHA-256 hashes, model outputs, provider request IDs, and source context.
- Limitations: visible on the result page. Failed/missing checks or low-quality samples are inconclusive. No unsupported heatmap or face-box claim.
- OCR and reverse-image lookup remain. OCR.Space receives the representative image. Source lookup uses Catbox (public image host) and SerpApi. External provider retention applies.
- JSON evidence downloads work for actual results. Preset text demos are explicitly labelled illustrative.

## Meaning of the score

The headline is the strongest completed task-specific model signal, not an average of different tasks or a calibrated probability of authenticity. Individual genai and deepfake confidences remain visible. Display thresholds are 20/80 and have not been calibrated against an independent held-out dataset. Low signals do not establish authenticity.

## Functional checks

node node_modules/typescript/bin/tsc --noEmit
node scripts/verify-deeptruth.cjs

The second command uses mocked provider outputs, with real image decoding, to test score polarity, missing and invalid scores, outages, low resolution, video timestamps, hashing, OCR, and preserved source lookup. It is not an accuracy benchmark and makes no live external calls.

Live checks were also performed using this account: both Sightengine model outputs, original/deepfake examples from provider documentation, an intentionally low-resolution example, browser upload and source matches, OCR text extraction, three-frame video extraction with six successful model checks, and JSON downloads.

## Boundaries

No audio detector, motion model, lip-sync model, provenance certification, or pixel-level explanation has been implemented. The problem statement allows images, audio, OR video; this prototype covers images and sampled video. Large independent accuracy evaluation and threshold calibration remain future validation work. No claim of 100% detection accuracy is made.

## Sources

https://sightengine.com/docs/deepfake-detection
https://sightengine.com/docs/ai-generated-image-detection
