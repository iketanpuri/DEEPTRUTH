// Functional checks with deterministic mocked provider outputs; not an accuracy benchmark.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const ts = require('typescript');
const sharp = require('sharp');
function compile(path, loader = require) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
  new Function('exports', 'require', code)(exports, loader);
  return exports;
}
(async () => {
  delete process.env.HIVE_API_KEY;
  const hive = compile('src/lib/services/hive.ts');
  let localScore = null;
  const models = compile('src/lib/services/detection.ts', name => name === './hive' ? hive : name === './local-image' ? { analyzeLocalImage: async () => { if(localScore === null) throw new Error('Test local detector unavailable'); return {score:localScore,model:'Community Forensics test',sha256:'test',scope:'AI-generation only'}; } } : require(name));
  Object.assign(process.env, { SIGHTENGINE_USER: 'test', SIGHTENGINE_SECRET: 'test', SERPAPI_KEY: 'test' });
  const width = 320; const pixels = Buffer.alloc(width * width * 3);
  for (let y = 0; y < width; y++) for (let x = 0; x < width; x++) for (let c = 0; c < 3; c++) pixels[(y * width + x) * 3 + c] = ((Math.floor(x / 10) + Math.floor(y / 10)) % 2) * 255;
  const normal = await sharp(pixels, { raw: { width, height: width, channels: 3 } }).png().toBuffer();
  const tiny = await sharp(normal).resize(32, 32).png().toBuffer();
  let mode = 'face';
  let providerCalls = 0;
  global.fetch = async (url, init) => {
    const host = new URL(url).hostname;
    if (host === 'api.sightengine.com') {
      providerCalls++;
      if(mode === 'quota') return Response.json({status:'failure',error:{type:'usage_limit',code:32}},{status:400});
      assert.equal(init.body.get('models'), 'genai,deepfake');
      if (mode === 'error') return new Response('{}', { status: 403 });
      const type = mode === 'missing' ? { deepfake: 0.95 } : mode === 'zero' ? { ai_generated: 0, deepfake: 0 } : mode === 'invalid' ? { ai_generated: -0.5, deepfake: 2 } : mode === 'generated' ? { ai_generated: 0.95, deepfake: 0.05 } : { ai_generated: 0.05, deepfake: 0.95 };
      return Response.json({ status: 'success', request: { id: 'test-request' }, type });
    }
    if (host === 'api.ocr.space') return Response.json({ ParsedResults: [{ ParsedText: 'Test OCR evidence' }] });
    if (host === 'catbox.moe') return new Response('https://files.catbox.moe/test.png');
    if (host === 'serpapi.com') return Response.json({ visual_matches: [{ source: 'Test source', title: 'Matched media', link: 'https://example.com/media' }] });
    throw new Error('Unexpected network request');
  };
  const route = compile('src/app/api/analyze/route.ts', name => name === '@/lib/services/ai-review' ? { additionalReview: async()=>undefined } : name === '@/lib/services/detection' ? models : name === '@/lib/analysis-cache' ? { analysisCacheKey: async()=> 'test', analysisCache: {run:async(_key,compute)=>compute()} } : require(name));
  async function call(bytes = normal, video = false, count = video ? 3 : 1) {
    const form = new FormData(); for (let i = 0; i < count; i++) form.append('file', new File([bytes], `test-${i}.png`, { type: 'image/png' }));
    form.append('type', video ? 'video' : 'image'); form.append('originalName', video ? 'original.mp4' : 'original.png');
    if (video) form.append('timestamps', JSON.stringify([1, 2, 3]));
    const response = await route.POST(new Request('http://localhost/api/analyze', { method: 'POST', body: form }));
    return { http: response.status, data: await response.json() };
  }
  let result = await call(); assert.equal(result.http, 200); assert.equal(result.data.score, 95); assert.equal(result.data.status, 'MANIPULATION SIGNAL DETECTED');
  assert.equal(result.data.samples[0].signals[1].score, 0.95); assert.equal(result.data.extractedText, 'Test OCR evidence'); assert.equal(result.data.sources[0].sourceName, 'Test source'); assert.ok(result.data.samples[0].sha256.match(/^[a-f0-9]{64}$/));
  mode = 'generated'; result = await call(); assert.equal(result.data.score, 95); assert.equal(result.data.assessment.strongestModel, 'AI-generation confidence');
  mode = 'zero'; result = await call(); assert.equal(result.data.score, 0); assert.equal(result.data.status, 'LOW MANIPULATION SIGNAL');
  mode = 'missing'; result = await call(); assert.equal(result.data.score, 95); assert.equal(result.data.status, 'INCONCLUSIVE'); assert.equal(result.data.assessment.completedChecks, 1);
  mode = 'invalid'; result = await call(); assert.equal(result.data.score, null); assert.equal(result.data.status, 'ANALYSIS UNAVAILABLE');
  mode = 'error'; result = await call(); assert.equal(result.data.score, null); assert.equal(result.data.extractedText, 'Test OCR evidence');
  mode = 'face'; result = await call(tiny); assert.equal(result.data.status, 'INCONCLUSIVE'); assert.ok(result.data.samples[0].qualityWarnings.length);
  result = await call(normal, true); assert.equal(result.data.samples.length, 3); assert.equal(result.data.assessment.completedChecks, 6); assert.equal(result.data.samples[1].timestamp, 2); assert.equal(result.data.filename, 'original.mp4'); assert.ok(result.data.caution.some(x => x.includes('Unsampled frames')));
  result = await call(Buffer.from('not an image')); assert.equal(result.http, 400);
  result = await call(normal, false, 4); assert.equal(result.http, 400);
  localScore = .95; mode = 'error'; result = await call(); assert.equal(result.data.score,95); assert.equal(result.data.status,'MANIPULATION SIGNAL DETECTED'); assert.equal(result.data.assessment.scope,'ai-generation-only'); assert.equal(result.data.samples[0].signals[1].score,null); assert.equal(result.data.extractedText,'Test OCR evidence'); assert.equal(result.data.sources.length,1);
  localScore = .01; result = await call(); assert.equal(result.data.status,'LOW MANIPULATION SIGNAL'); assert.equal(result.data.assessment.scope,'ai-generation-only');
  const labels = compile('src/lib/result-label.ts'); assert.equal(labels.resultLabel(result.data.status,null,'image',1,result.data.assessment.scope).title,'LOW AI-GENERATION SIGNAL');
  localScore = .796; result = await call(); assert.equal(result.data.status,'INCONCLUSIVE');
  localScore = .95; result = await call(normal,true); assert.equal(result.data.samples.length,3); assert.equal(result.data.assessment.completedChecks,3); assert.equal(result.data.assessment.requestedChecks,6); assert.equal(result.data.status,'MANIPULATION SIGNAL DETECTED');
  mode = 'zero'; result = await call(); assert.equal(result.data.samples[0].localDetector,undefined); assert.equal(result.data.assessment.scope,'full');
  mode = 'quota'; const beforeQuota = providerCalls; result = await call(); assert.equal(result.data.samples[0].signals[0].provider,'CommunityForensics'); assert.equal(providerCalls,beforeQuota+1);
  result = await call(); assert.equal(providerCalls,beforeQuota+1); assert.ok(result.data.samples[0].fallbackReason.includes('usage limit'));
  process.env.SIGHTENGINE_USER = 'updated-test-user'; mode = 'zero'; result = await call(); assert.equal(result.data.assessment.scope,'full'); assert.equal(result.data.samples[0].signals[0].provider,'Sightengine');
  console.log('PASS: separate face/generation scores, headline semantics, zero/missing/invalid scores, failed providers, low quality, 3 timestamped frames, invalid uploads, hashes, OCR and source lookup.');
})().catch(error => { console.error(error); process.exitCode = 1; });
