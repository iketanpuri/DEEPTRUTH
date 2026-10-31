import { createHash } from 'node:crypto';

type Payload = Record<string, any>;
type Entry = { body: Payload; expires: number; bytes: number };
/** Bounded, in-memory cache. No original uploads or credentials are written to disk. */
export class AnalysisCache {
  private entries = new Map<string, Entry>();
  private pending = new Map<string, Promise<{ body: Payload; status: number; expires: number }>>();
  constructor(private now = Date.now, private maxBytes = 16 * 1024 * 1024, private maxEntries = 30) {}
  async run(key: string, compute: () => Promise<Response>): Promise<Response> {
    for (const [k, value] of this.entries) if (value.expires <= this.now()) this.entries.delete(k);
    const hit = this.entries.get(key);
    if (hit) {
      this.entries.delete(key); this.entries.set(key, hit);
      return this.response(hit.body, 200, true, hit.expires);
    }
    let work = this.pending.get(key);
    const shared = !!work;
    if (!work) {
      work = (async () => {
        const response = await compute();
        const body = await response.json() as Payload;
        const complete = typeof body.score === 'number' && body.assessment?.completedChecks > 0 && body.assessment.completedChecks === body.assessment.requestedChecks;
        const ttl = body.aiReview?.status === 'unavailable' && typeof body.score === 'number' ? 30 * 1000 : complete ? 60 * 60 * 1000 : typeof body.score === 'number' ? 30 * 1000 : 0;
        const expires = this.now() + ttl;
        if (response.ok && ttl) {
          const bytes = Buffer.byteLength(JSON.stringify(body));
          if (bytes <= this.maxBytes) {
            while (this.entries.size && (this.entries.size >= this.maxEntries || [...this.entries.values()].reduce((n,e)=>n+e.bytes,0) + bytes > this.maxBytes)) this.entries.delete(this.entries.keys().next().value!);
            this.entries.set(key, { body, expires, bytes });
          }
        }
        return { body, status: response.status, expires };
      })();
      this.pending.set(key, work);
    }
    try {
      const result = await work;
      return this.response(result.body, result.status, shared, result.expires);
    } finally { if (this.pending.get(key) === work) this.pending.delete(key); }
  }
  private response(body: Payload, status: number, reused: boolean, expires: number) {
    return Response.json(status === 200 ? { ...body, cache: { reused, analysedAt: body.timestamp, expiresAt: new Date(expires).toISOString() } } : body, { status, headers: { 'Cache-Control':'no-store' } });
  }
}
export const analysisCache = new AnalysisCache();
/** Configuration participates in the digest so key/provider changes never reuse stale checks. */
export async function analysisCacheKey(files: File[], context: unknown): Promise<string> {
  const hash = createHash('sha256').update('deeptruth-media-pipeline-v1\0');
  for (const name of ['SIGHTENGINE_USER','SIGHTENGINE_SECRET','HIVE_API_KEY','SERPAPI_KEY','GEMINI_API_KEY','GEMINI_MODEL','IMAGE_PYTHON','AUDIO_PYTHON']) hash.update(name+'='+ (process.env[name] || '')+'\0');
  hash.update(JSON.stringify(context));
  for (const file of files) { hash.update('\0'+file.type+'\0'+file.name+'\0'+file.size+'\0'); hash.update(Buffer.from(await file.arrayBuffer())); }
  return hash.digest('hex');
}
