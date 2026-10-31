# Sightengine + Hive V3 image checks

Set `HIVE_API_KEY` in `.env.local` to the **Secret Key** from Deploy/Hive Service API Keys (not the Access Key ID). `HIVE_API_VERSION=v3` documents the configured version; this adapter supports V3 only. Existing Sightengine variables remain unchanged. No credentials are exposed in client bundles or reports.

Official API reference: https://docs.thehive.ai/docs/ai-generated-and-deepfake-content-detection-playground

Backend request: `POST https://api.thehive.ai/api/v3/hive/ai-generated-and-deepfake-content-detection`, Bearer secret, JSON `{ media_metadata: true, input: [{ media_base64: "data:<mime>;base64,..." }] }`. One image or extracted frame is sent per call; V3 class scores are read from `output[0].classes[].value`, selecting only `ai_generated` and `deepfake`. Source-attribution classes, absent classes, invalid scores and duplicate classes never become zero or detection scores.

Each uploaded image gets Sightengine and Hive checks in parallel. Each sampled video frame gets the same pair. AI-generation scores are averaged with AI-generation scores; face-manipulation scores are averaged separately. Individual scores and provider request IDs remain in the report. The headline is the strongest available task-specific signal across samples; its caption identifies the task and whether it is a two-provider average. A difference of at least 0.4 between providers makes that task inconclusive. The headline task must not have provider disagreement; disagreement on AI-generation does not cancel independently agreed face-manipulation evidence (and vice versa). Thresholds and the disagreement rule are uncalibrated prototype display rules, not measured accuracy or authenticity probabilities.

If one provider returns no score for a task, the available score is explicitly single-provider, not a two-provider average. If both hosted providers fail, the existing local AI-generation fallback remains available and face-swap checking stays unavailable. Audio, OCR, source finding, PDF exports, camera capture and cybercrime portal behavior retain their existing flows. Each video runs three sampled frames, not full-video temporal/audio analysis. API charges and rate limits apply; no automatic plan purchase or upgrade is performed.

Run `node scripts/verify-dual-detection.cjs` for deterministic averaging/failure checks, plus the existing verification scripts for regression coverage. Live tests are execution checks, not accuracy validation. Rotate secrets that have appeared in screenshots and update `.env.local` accordingly.
