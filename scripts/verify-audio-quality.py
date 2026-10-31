"""Real speech-quality runtime checks. No hosted APIs or private recordings required."""
import importlib.util
from pathlib import Path
import tempfile, unittest, wave
from unittest.mock import patch
import numpy as np
ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('worker', ROOT/'scripts/detect_audio.py')
worker = importlib.util.module_from_spec(spec); spec.loader.exec_module(worker)
MODEL = str(ROOT/'.audio-models/spectra-aasist3-int8-dynamic.onnx')

class SpeechQualityChecks(unittest.TestCase):
    def check_non_speech(self, samples):
        with tempfile.TemporaryDirectory(prefix='deeptruth-audio-test-') as directory:
            filename = str(Path(directory)/'input.wav')
            with wave.open(filename, 'wb') as f:
                f.setparams((1,2,16000,0,'NONE','not compressed'))
                f.writeframes((np.clip(samples,-1,1)*32767).astype('<i2').tobytes())
            result = worker.analyse(filename, MODEL)
            self.assertFalse(result['speechDetection']['passed'])
            self.assertEqual(result['segments'], [])
            self.assertTrue(result['qualityWarnings'])
    def test_silence_has_no_voice_verdict(self): self.check_non_speech(np.zeros(80000))
    def test_tone_has_no_voice_verdict(self): self.check_non_speech(.15*np.sin(2*np.pi*440*np.arange(80000)/16000))
    def test_noise_has_no_voice_verdict(self): self.check_non_speech(np.random.default_rng(17).normal(0,.03,80000))
    def test_local_clipping_cannot_hide_in_global_average(self):
        samples = np.full(worker.WINDOW * 2, .04, dtype=np.float32)
        samples[:1000] = 1.0
        class FixedModel:
            def run(self, *_): return [np.array([[0., 8.]])]
        with tempfile.TemporaryDirectory() as directory:
            filename = str(Path(directory)/'input.wav')
            with wave.open(filename, 'wb') as f:
                f.setparams((1,2,16000,0,'NONE','not compressed'))
                f.writeframes((samples*32767).astype('<i2').tobytes())
            with patch.object(worker, 'speech_presence', return_value=np.ones(len(samples), dtype=bool)):
                result = worker.analyse(filename, MODEL, FixedModel())
            self.assertEqual(len(result['segments']), 1)
            self.assertEqual(len(result['excludedWindows']), 1)
            self.assertIn('Clipped window', result['excludedWindows'][0]['reason'])
    def test_sparse_speech_never_reaches_classifier(self):
        samples = np.full(worker.WINDOW * 2, .04, dtype=np.float32)
        mask = np.zeros(len(samples), dtype=bool)
        mask[:24000] = True; mask[worker.WINDOW:worker.WINDOW+24000] = True
        class MustNotRun:
            def run(self, *_): raise AssertionError('Sparse windows must not be classified')
        with tempfile.TemporaryDirectory() as directory:
            filename = str(Path(directory)/'input.wav')
            with wave.open(filename, 'wb') as f:
                f.setparams((1,2,16000,0,'NONE','not compressed'))
                f.writeframes((samples*32767).astype('<i2').tobytes())
            with patch.object(worker, 'speech_presence', return_value=mask):
                result = worker.analyse(filename, MODEL, MustNotRun())
            self.assertTrue(result['speechDetection']['passed'])
            self.assertEqual(result['segments'], [])
            self.assertEqual(len(result['excludedWindows']), 2)
    def test_supported_short_clip_keeps_repetition_note_separate(self):
        samples = np.full(54000, .04, dtype=np.float32)
        class FixedModel:
            def run(self, *_): return [np.array([[8., 0.]])]
        with tempfile.TemporaryDirectory() as directory:
            filename = str(Path(directory)/'input.wav')
            with wave.open(filename, 'wb') as f:
                f.setparams((1,2,16000,0,'NONE','not compressed'))
                f.writeframes((samples*32767).astype('<i2').tobytes())
            with patch.object(worker, 'speech_presence', return_value=np.ones(len(samples), dtype=bool)):
                result = worker.analyse(filename, MODEL, FixedModel())
            self.assertEqual(result['qualityWarnings'], [])
            self.assertEqual(len(result['processingNotes']), 1)
            self.assertEqual(len(result['segments']), 1)
            self.assertGreater(result['segments'][0]['score'], .8)
    def test_invalid_wav_is_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            filename=Path(directory)/'bad.wav';filename.write_bytes(b'not a wave file')
            with self.assertRaises((ValueError,wave.Error,EOFError)): worker.analyse(str(filename),MODEL)

if __name__=='__main__': unittest.main()
