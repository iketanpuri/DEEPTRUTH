type Requester = (url: string, init?: RequestInit) => Promise<Response>;
export type HiveEvidence = { provider: 'Hive'; status: 'ok' | 'unavailable'; requestId: string | null; genai: number | null; deepfake: number | null; detail: string };
const valid = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1;
export async function analyzeHive(file: File, request: Requester): Promise<HiveEvidence> {
  const unavailable = (detail: string): HiveEvidence => ({ provider: 'Hive',status:'unavailable',requestId:null,genai:null,deepfake:null,detail });
  const key=process.env.HIVE_API_KEY?.trim();
  if(!key) return unavailable('Hive key is not configured.');
  try {
    const media=`data:${file.type || 'image/jpeg'};base64,${Buffer.from(await file.arrayBuffer()).toString('base64')}`;
    const response=await request('https://api.thehive.ai/api/v3/hive/ai-generated-and-deepfake-content-detection',{
      method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({media_metadata:true,input:[{media_base64:media}]}),
    });
    const data=await response.json().catch(()=>null);
    if(!response.ok) return unavailable(`Hive returned HTTP ${response.status}; check model access, credits and rate limits.`);
    // Each submitted image must have exactly one frame result. Do not mix generator attribution classes with detection heads.
    if(!Array.isArray(data?.output) || data.output.length!==1 || !Array.isArray(data.output[0]?.classes)) return unavailable('Hive returned an unsupported image response.');
    const classes=data.output[0].classes as {class?:string;value?:unknown}[];
    const read=(name:string):number|null=>{const found=classes.filter(c=>c.class===name);return found.length===1 && valid(found[0].value)?found[0].value:null;};
    const genai=read('ai_generated'),deepfake=read('deepfake');
    return {provider:'Hive',status:genai!==null || deepfake!==null?'ok':'unavailable',requestId:typeof data.task_id==='string'?data.task_id:null,genai,deepfake,detail:'Hive V3 model output; tasks are AI-generation and face manipulation. Missing classes are not zero scores.'};
  } catch {return unavailable('Hive could not be reached or returned unreadable data.');}
}
