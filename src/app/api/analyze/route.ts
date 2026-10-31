import { NextResponse } from 'next/server';
import dns from 'dns';
import { additionalReview } from '@/lib/services/ai-review';
import { analysisCache, analysisCacheKey } from '@/lib/analysis-cache';
import { analyzeSample, summarizeEvidence, type SampleEvidence } from '@/lib/services/detection';

// Fix local Windows IPv6 timeout issues during development without breaking Render Linux deployment
if (process.env.NODE_ENV === 'development') {
  dns.setDefaultResultOrder('ipv4first');
}

// Retry transient transport failures once; keep provider errors and results intact.
async function fetchWithRetry(url: string, init: RequestInit = {}): Promise<Response> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(20000),
      });
    } catch (error) {
      if (attempt === 0) {
        await new Promise(resolve => setTimeout(resolve, 600));
        continue;
      }
      const cause = error as Error & { cause?: { code?: string } };
      const host = new URL(url).hostname;
      const timedOut = cause.name === 'TimeoutError' || cause.name === 'AbortError';
      throw new Error(timedOut
        ? `Connection to ${host} timed out after retrying. Please try again.`
        : `Could not connect to ${host} after retrying. Check your internet connection and try again.`,
        { cause: error });
    }
  }
  throw new Error('Request could not complete.');
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('file').filter((value): value is File => value instanceof File);
    if (!files.length || files.length > 3 || files.some(f => !f.size || f.size > 10 * 1024 * 1024)) {
      return NextResponse.json({ error: 'Choose one image, or up to three sampled video frames, each under 10 MB.' }, { status: 400 });
    }
    const isVideo = formData.get('type') === 'video';
    if (!isVideo && files.length !== 1) return NextResponse.json({ error: 'Analyse one image at a time.' }, { status: 400 });
    let timestamps: number[] = [];
    try {
      timestamps = JSON.parse(String(formData.get('timestamps') || '[]'));
      if (!Array.isArray(timestamps) || timestamps.some(t => typeof t !== 'number' || !Number.isFinite(t) || t < 0 || t > 86400) || (isVideo && timestamps.length !== files.length)) throw new Error();
    } catch { return NextResponse.json({ error: 'Video frame timestamps are invalid. Upload the video again.' }, { status: 400 }); }
    const file = files[Math.floor(files.length / 2)];
    const originalName = String(formData.get('originalName') || file.name).slice(0, 255);
    const cacheKey = await analysisCacheKey(files, { originalName, isVideo, timestamps });
    return await analysisCache.run(cacheKey, async () => {
    let samples: SampleEvidence[];
    try {
      samples = await Promise.all(files.map((sample, index) => analyzeSample(sample, index + 1, isVideo ? timestamps[index] : null, fetchWithRetry)));
    } catch { return NextResponse.json({ error: 'Image could not be decoded safely. Choose JPG, PNG, or WebP, below 25 million pixels.' }, { status: 400 }); }

    // Attempt to guess source from filename
    let source = "Unknown (No provenance data)";
    const lowerName = originalName.toLowerCase();
    if (lowerName.includes('whatsapp')) source = "WhatsApp";
    else if (lowerName.includes('instagram') || lowerName.includes('ig_')) source = "Instagram";
    else if (lowerName.includes('twitter') || lowerName.includes('tw_')) source = "Twitter / X";
    else if (lowerName.includes('img_') || lowerName.includes('dsc_')) source = "Camera Capture";
    else if (lowerName.includes('screenshot')) source = "Screen Capture";

    const fileExt = file.name.split('.').pop()?.toUpperCase() || 'UNKNOWN';
    const metadata: Record<string, string> = {
      format: fileExt,
      size: `${(file.size / 1024).toFixed(2)} KB`,
      type: file.type || 'Unknown',
      source: source
    };

    // ==========================================
    // AUDIO ANALYSIS: Hugging Face API
    // ==========================================
    if (file.type.startsWith('audio/')) {
      return NextResponse.json({ error: 'Audio verification is temporarily disabled.' }, { status: 400 });
    }

    // ==========================================
    // IMAGE ANALYSIS: Sightengine API (Also handles extracted video frames)
    // ==========================================
    // Start compatible detectors together; OCR/source finding continue as before.
    // Both task-specific scores have been collected for each sample above.

    // 2. Perform OCR using OCR.Space API to extract text from the image
    let extractedText = "";
    try {
      const ocrForm = new FormData();
      ocrForm.append('apikey', 'K84502294088957');
      ocrForm.append('file', file);
      ocrForm.append('OCREngine', '2'); // Engine 2 is better for numbers/special characters
      
      const ocrResponse = await fetchWithRetry('https://api.ocr.space/parse/image', {
        method: 'POST',
        body: ocrForm
      });
      const ocrData = await ocrResponse.json();
      
      if (ocrData.ParsedResults && ocrData.ParsedResults.length > 0) {
        extractedText = ocrData.ParsedResults[0].ParsedText.replace(/\n+/g, ' ').trim();
      }
    } catch (ocrError) {
      console.error("OCR API Error:", ocrError);
      // OCR failure should not crash the main pipeline
    }

    // 3. REVERSE IMAGE SEARCH via SerpApi (Google Lens)
    let sources: any[] = [];
    const serpApiKey = process.env.SERPAPI_KEY;
    if (serpApiKey) {
      try {
        console.log("Uploading to catbox for reverse image search...");
        const catboxForm = new FormData();
        catboxForm.append('reqtype', 'fileupload');
        catboxForm.append('fileToUpload', file);
        
        const catboxRes = await fetchWithRetry('https://catbox.moe/user/api.php', {
          method: 'POST',
          body: catboxForm
        });
        const catboxUrl = await catboxRes.text();
        
        if (catboxUrl && catboxUrl.startsWith('http')) {
          console.log("Catbox URL:", catboxUrl);
          console.log("Searching SerpApi...");
          const serpRes = await fetchWithRetry(`https://serpapi.com/search.json?engine=google_lens&url=${encodeURIComponent(catboxUrl)}&api_key=${serpApiKey}`);
          const serpData = await serpRes.json();
          
          if (serpData.visual_matches && serpData.visual_matches.length > 0) {
            // Take top 3 sources
            sources = serpData.visual_matches.slice(0, 3).map((match: any) => ({
              sourceName: match.source,
              type: "Visual Match",
              snippet: match.title,
              url: match.link
            }));
          }
        }
      } catch (serpError) {
        console.error("SerpApi / Catbox Error:", serpError);
      }
    }

    const summary = summarizeEvidence(samples, isVideo);
    const evidence = samples.flatMap(sample => {
      const suffix = isVideo ? ` @ ${sample.timestamp?.toFixed(2)}s` : '';
      const combined = sample.signals.map(model => ({
        name: `${sample.consensus ? (model.provider === 'Combined' ? 'Average ' : 'Available ') : ''}${model.name}${suffix}`,
        val: model.score === null ? null : Math.round(model.score * 1000) / 10,
        status: model.detail, icon: 'Activity',
      }));
      if (!sample.providerChecks) return combined;
      const individual = [sample.providerChecks.sightengine,sample.providerChecks.hive].flatMap(provider => (['genai','deepfake'] as const).map(task=>({
        name: `${provider.provider}: ${task === 'genai' ? 'AI-generation' : 'Face-manipulation'}${suffix}`,
        val: provider[task] === null ? null : Math.round(provider[task]! * 1000) / 10,
        status: `${provider.detail} Request: ${provider.requestId || 'unavailable'}.`, icon:'Activity',
      })));
      return [...combined,...individual];
    });
    const contextLimitations = ['OCR and visual matches are context, not manipulation proof. Reverse-image search may return similar or reposted media; it does not verify the original publisher.'];
    const finalResponse = {
      id: crypto.randomUUID(), timestamp: new Date().toISOString(),
      filename: originalName, mediaType: isVideo ? 'video' : 'image', detectionSchemaVersion: 3,
      score: summary.score, status: summary.status, color: summary.color,
      desc: `${summary.completedChecks}/${summary.requestedChecks} model checks completed. ${summary.strongestModel ? `Strongest signal: ${summary.strongestModel}.` : 'No valid detection score available.'} Low signals do not prove authenticity.`,
      assessment: summary, samples,
      signals: [...evidence, { name: 'Source Verification', val: null, status: `${source} (filename hint only; origin not verified)`, icon: 'LinkIcon' }],
      supporting: samples.flatMap(sample => sample.signals.filter(m => m.status === 'ok').map(m => `Sample ${sample.index}${isVideo ? ` at ${sample.timestamp?.toFixed(2)}s` : ''}: ${m.name} ${Math.round(m.score! * 1000) / 10}/100; ${sample.localDetector ? 'local model ' + sample.localDetector.model : 'provider request ' + (sample.requestId || 'not provided')}.`)),
      caution: [...summary.limitations, ...samples.flatMap(s => s.qualityWarnings), ...contextLimitations],
      metadata: { ...metadata, sourceHint: source, analysedSamples: String(samples.length), contextSample: isVideo ? `Middle sampled frame at ${file === files[0] ? timestamps[0] : timestamps[Math.floor(files.length / 2)]}s` : 'Uploaded image' },
      extractedText: extractedText || undefined,
      sources: sources.length > 0 ? sources : undefined,
    };

    const aiReview = await additionalReview(finalResponse);
    return NextResponse.json({ ...finalResponse, ...(aiReview ? { aiReview } : {}) });
    });

  } catch (error: any) {
    console.error('Analysis error:', error);
    const errorMessage = error?.message || 'Internal server error during analysis';
    return NextResponse.json({ error: `Server Error: ${errorMessage}` }, { status: 500 });
  }
}
