/** Decode locally; send only mono 16-kHz PCM16 WAV to the local detector. */
export async function prepareAudio(file: File): Promise<File> {
  const url = URL.createObjectURL(file);
  const audio = new Audio();
  try {
    const duration = await new Promise<number>((resolve, reject) => {
      const timer = setTimeout(() => { cleanup(); reject(new Error('Audio could not be opened. Try a WAV or MP3 speech clip.')); }, 15000);
      const cleanup = () => { clearTimeout(timer); audio.onloadedmetadata = null; audio.onerror = null; };
      audio.onloadedmetadata = () => { cleanup(); resolve(audio.duration); };
      audio.onerror = () => { cleanup(); reject(new Error('Browser cannot decode this audio format. Try WAV or MP3.')); };
      audio.preload = 'metadata'; audio.src = url;
    });
    if (!Number.isFinite(duration) || duration < 2 || duration > 30) throw new Error('Choose a speech clip between 2 and 30 seconds.');
    const context = new OfflineAudioContext(1, 16000, 16000);
    let decoded: AudioBuffer;
    try { decoded = await context.decodeAudioData(await file.arrayBuffer()); }
    catch { throw new Error('Audio could not be decoded. Try a WAV or MP3 speech clip.'); }
    if (decoded.duration < 2 || decoded.duration > 30) throw new Error('Choose a speech clip between 2 and 30 seconds.');
    const renderer = new OfflineAudioContext(1, Math.round(decoded.duration * 16000), 16000);
    const source = renderer.createBufferSource(); source.buffer = decoded; source.connect(renderer.destination); source.start();
    const pcm = (await renderer.startRendering()).getChannelData(0);
    const bytes = new ArrayBuffer(44 + pcm.length * 2); const view = new DataView(bytes);
    const ascii = (offset: number, text: string) => { for (let i=0; i<text.length; i++) view.setUint8(offset+i, text.charCodeAt(i)); };
    ascii(0, 'RIFF'); view.setUint32(4, 36 + pcm.length*2, true); ascii(8, 'WAVE'); ascii(12, 'fmt ');
    view.setUint32(16,16,true); view.setUint16(20,1,true); view.setUint16(22,1,true); view.setUint32(24,16000,true); view.setUint32(28,32000,true); view.setUint16(32,2,true); view.setUint16(34,16,true); ascii(36,'data'); view.setUint32(40,pcm.length*2,true);
    for (let i=0; i<pcm.length; i++) { const value=Math.max(-1,Math.min(1,pcm[i])); view.setInt16(44+i*2, Math.round(value*(value<0?32768:32767)),true); }
    return new File([bytes], 'speech-16000.wav', { type: 'audio/wav' });
  } finally { audio.removeAttribute('src'); audio.load(); URL.revokeObjectURL(url); }
}
