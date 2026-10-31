import { spawnSync } from 'node:child_process';
import { access,mkdir,rename,rm } from 'node:fs/promises';
import { createWriteStream,createReadStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
const run=(cmd,args)=>{const r=spawnSync(cmd,args,{stdio:'inherit'});if(r.error||r.status!==0)throw new Error('Image setup failed. Check Python 3.12+ and your connection.');};
const interpreter=process.env.IMAGE_SETUP_PYTHON||process.env.AUDIO_SETUP_PYTHON||'python3';
const python=path.join('.venv-audio312',process.platform==='win32'?'Scripts/python.exe':'bin/python');
try{await access(python);}catch{run(interpreter,['-c','import sys; assert sys.version_info >= (3,12), "Python 3.12+ required"']);run(interpreter,['-m','venv','.venv-audio312']);}
run(python,['-m','pip','install','--no-cache-dir','onnxruntime==1.31.1','numpy==2.5.4','Pillow==13.0.0']);
await mkdir('.image-models',{recursive:true});
const target='.image-models/community-forensics.onnx';
const expected='d7bb021fc2622d1f746da29010ef02d07028a76ab8c7759b0406c1d6763d1e72';
async function hash(file){const h=createHash('sha256');for await(const b of createReadStream(file))h.update(b);return h.digest('hex');}
let ready=false;try{ready=await hash(target)===expected;}catch{}
if(!ready){
 console.log('Downloading Community Forensics ONNX (~87 MB)...');
 const r=await fetch('https://huggingface.co/Red-had1911/deepfake-detector-onnx/resolve/main/generative_detector.onnx',{signal:AbortSignal.timeout(180000)});
 if(!r.ok||!r.body)throw new Error(`Model download failed: HTTP ${r.status}`);
 try{await pipeline(r.body,createWriteStream(target+'.partial'));if(await hash(target+'.partial')!==expected)throw new Error('Model SHA-256 mismatch. Setup stopped.');await rename(target+'.partial',target);}finally{await rm(target+'.partial',{force:true});}
}
console.log('Local image detection ready. Restart npm run dev if this is a new installation.');
