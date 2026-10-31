import { NextResponse } from 'next/server';
import { analysisCache, analysisCacheKey } from '@/lib/analysis-cache';
import { analyzeAudio, AudioError } from '@/lib/services/audio-detection';
export const runtime = 'nodejs';
export const maxDuration = 180;
export async function POST(request: Request) {
  try {
    // Converted 30-second PCM mono WAV is under 1 MB.
    const length = Number(request.headers.get('content-length'));
    if (length > 2 * 1024 * 1024) return NextResponse.json({ error: 'Audio upload is too large. Choose a 2–30 second clip.' }, { status: 413 });
    const data = await request.formData();
    const file = data.get('file');
    if (!(file instanceof File) || file.size < 44 || file.size > 1_000_000) return NextResponse.json({ error: 'Choose a valid 2–30 second speech clip through the Audio tab.' }, { status: 400 });
    const originalName=String(data.get('originalName') || file.name);
    const key=await analysisCacheKey([file],{type:'audio',originalName,pipeline:4});
    return await analysisCache.run(key,async()=>NextResponse.json(await analyzeAudio(file,originalName)));
  } catch (error) {
    return NextResponse.json({ error: error instanceof AudioError ? error.message : 'Audio upload could not be processed. Please retry.' }, { status: error instanceof AudioError ? error.status : 400 });
  }
}
