/** User-facing wording only; detection thresholds and scores are unchanged. */
export function resultLabel(status: string, strongestModel: string | null, mediaType: string, sampleCount: number, scope?: string) {
  if (mediaType === 'audio') {
    if (status === 'MANIPULATION SIGNAL DETECTED') return { title: 'LIKELY SYNTHETIC VOICE', explanation: 'The detector found strong synthetic-speech signals in the checked recording.', caveat: 'Model estimate, not proof. Review the window scores; detection can be wrong.' };
    if (status === 'LOW MANIPULATION SIGNAL') return { title: 'LOW SYNTHETIC-VOICE SIGNAL', explanation: 'The detector found no strong synthetic-speech signal in this clip.', caveat: 'For speech recordings only. A low score does not prove the voice is human or authentic.' };
    return { title: 'UNSURE — CHECK MANUALLY', explanation: 'The recording quality or model signals do not support a clear voice verdict.', caveat: 'Use 4–30 seconds of clear speech without music. This does not verify who is speaking.' };
  }
  if (scope === 'ai-generation-only') {
    if (status === 'LOW MANIPULATION SIGNAL') return { title: 'LOW AI-GENERATION SIGNAL', explanation: 'The available detector found no strong AI-generation signal in the checked image samples.', caveat: 'Face-swap checking is unavailable. A low score does not prove the image or video is real.' };
    if (status === 'MANIPULATION SIGNAL DETECTED') return { title: 'LIKELY AI-GENERATED', explanation: 'The available detector found a strong AI-generation signal in the checked image samples.', caveat: 'Model estimate, not proof. Face-swap checking is unavailable; video results concern sampled frames only.' };
  }
  if (scope === 'single-provider' && status === 'LOW MANIPULATION SIGNAL') return { title: 'LOW MANIPULATION SIGNAL', explanation: 'Only one provider returned a usable score for each task. The available signals are low; other checks did not complete.', caveat: 'A two-provider average is unavailable. Low signals do not prove authenticity.' };
  const video = mediaType === 'video';
  if (status === 'LOW MANIPULATION SIGNAL') return {
    title: 'LIKELY REAL',
    explanation: video ? `No strong AI-generation or face-swap signals were found in the ${sampleCount} checked frames.` : 'No strong AI-generation or face-swap signals were found in this image.',
    caveat: video ? 'Only these frames were checked. This does not confirm the whole video is real.' : 'This is an estimate, not proof that the image is real.',
  };
  if (status === 'MANIPULATION SIGNAL DETECTED') {
    const face = strongestModel === 'Face-manipulation confidence';
    return {
      title: face ? 'LIKELY FACE-MANIPULATED' : 'LIKELY AI-GENERATED',
      explanation: face ? 'The detector found strong signs of a face swap or facial identity alteration.' : 'The detector found strong signs of AI-generated imagery.',
      caveat: video ? 'This result concerns the sampled frames. Review the evidence below; detection can be wrong.' : 'Review the evidence below; detection can be wrong.',
    };
  }
  if (status === 'ANALYSIS UNAVAILABLE') return { title: 'COULD NOT CHECK', explanation: 'The detector did not return a usable result. Please retry.', caveat: 'No AI-or-real conclusion is available.' };
  return { title: 'UNSURE — CHECK MANUALLY', explanation: 'The signals, image quality, or incomplete checks do not support a clear answer.', caveat: 'Try a clearer original file and review the details below.' };
}
