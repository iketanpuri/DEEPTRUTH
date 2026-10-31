# Local image fallback

When Sightengine is unavailable, missing credentials, or quota-limited, image and sampled-video-frame analysis uses a local Community Forensics AI-image detector. Existing OCR, visual source lookup, camera uploads, speech detection and PDF export continue through their existing paths.

## Setup

Run `npm run setup:images`. Requires Python 3.12+ (`IMAGE_SETUP_PYTHON` can select it). The script reuses/creates `.venv-audio312`, installs ONNX Runtime/NumPy/Pillow and downloads an ~87 MB model with SHA-256 validation. `IMAGE_PYTHON` can override the serving interpreter. There is no API key or provider daily quota for local inference. CPU/RAM and server request time remain practical limits. Each local inference is serialized with a queue of at most six jobs, and temporary image files are deleted. No model downloads occur during an analysis request.

## Attribution and preprocessing

Original model: [Community Forensics](https://github.com/JeongsooP/Community-Forensics), Jeongsoo Park and Andrew Owens, CVPR 2025; MIT license (LOCAL_IMAGE_LICENSE.txt). CPU ONNX export: [Red-had1911/deepfake-detector-onnx](https://huggingface.co/Red-had1911/deepfake-detector-onnx), `generative_detector.onnx`, described as Community Forensics ViT-S/384; model artifact SHA-256 `d7bb021fc2622d1f746da29010ef02d07028a76ab8c7759b0406c1d6763d1e72`. The export is a community derivative, not an author-validated implementation of this application. No remote repository Python code is executed. Model inference uses the installed ONNX Runtime CPU backend.

Preprocessing follows the export model card: RGB, shortest-edge resize 440, center crop 384, CLIP mean/std; Pillow bicubic resize and EXIF orientation correction. One output logit is converted through sigmoid. Model signal is not a calibrated authenticity probability. Center cropping may miss manipulation elsewhere in an image. The integration is not independently accuracy-validated.

## Scope

The fallback checks fully AI-generated imagery; it is not an identity-level face-swap detector, edit detector, provenance checker or whole-video temporal detector. The face-manipulation signal remains explicitly unavailable; no zero/fabricated score replaces it. An available local score can yield a scoped AI-generation verdict while incomplete face checking is retained in the evidence. Low fallback scores are labelled LOW AI-GENERATION SIGNAL, never LIKELY REAL. Quality problems or intermediate scores remain inconclusive. Models/provider/fallback reason/hash/preprocessing are retained in the exported analysis record.

A quota error triggers a five-minute provider retry cooldown keyed to the current credentials. Once the cooldown expires (or credentials change), Sightengine is tried again. When Sightengine succeeds, its original two task-specific checks are used unchanged.
