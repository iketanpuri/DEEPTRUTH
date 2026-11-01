# Included pretrained models

This repository includes the exact model files used by the local DeepTruth audio and image workers, stored using Git Large File Storage (LFS). No model weights were retrained, recompressed or modified for this upload. Sources, licenses, file sizes and SHA-256 checksums are in `models-manifest.json`. Preserve `AUDIO_MODEL_LICENSE.txt`, `SILERO_VAD_LICENSE.txt` and `LOCAL_IMAGE_LICENSE.txt` when redistributing.

## Download the actual files

Install Git LFS from https://git-lfs.com/ before cloning, then run:

```sh
git lfs install
git clone https://github.com/iketanpuri/DEEPTRUTH.git
cd DEEPTRUTH
git lfs pull
```

If the checkout has small text files beginning with `version https://git-lfs.github.com/spec/v1`, it contains LFS pointers, not downloaded model weights. Run `git lfs pull`. A GitHub ZIP download may not include the actual LFS files; use Git with LFS for a reliable complete checkout.

## Runtime setup

Weights alone do not install the runtime. Follow `AUDIO_SETUP.md` and `LOCAL_IMAGE_SETUP.md` to install Python dependencies. The setup scripts verify existing weights and avoid downloading matching files again. API credentials must be configured separately and are not included. Virtual environments, node_modules, private recordings and credentials remain excluded.

## Scope

- Spectra-AASIST3 INT8: spoken synthetic-voice indicators.
- Silero VAD: speech presence, not authenticity detection.
- Community Forensics ONNX: AI-generated image indicators, not a substitute for face-swap or full temporal video detection.

These pretrained models are credited to their upstream authors. Including the files does not establish accuracy or verify cloud deployment.
