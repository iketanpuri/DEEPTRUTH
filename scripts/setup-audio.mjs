import { spawnSync } from 'node:child_process';
import { mkdir, rename, rm } from 'node:fs/promises';
import { createWriteStream, createReadStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
const run = (cmd,args) => { const result=spawnSync(cmd,args,{stdio:'inherit'}); if(result.error || result.status !== 0) throw new Error(`Setup failed: ${cmd}. Use Python 3.12+ and check your connection.`); };
const python=process.env.AUDIO_SETUP_PYTHON || 'python3';
const version=spawnSync(python,['-c','import sys; print(sys.version_info >= (3,12))'],{encoding:'utf8'});
if(version.stdout?.trim() !== 'True') throw new Error('Python 3.12+ required. Set AUDIO_SETUP_PYTHON to that interpreter.');
run(python,['-m','venv','.venv-audio312']);
const runtime=path.join('.venv-audio312', process.platform==='win32'?'Scripts/python.exe':'bin/python');
run(runtime,['-m','pip','install','--no-cache-dir','onnxruntime==1.31.1','numpy==2.5.4']);
await mkdir('.audio-models',{recursive:true});
const target='.audio-models/spectra-aasist3-int8-dynamic.onnx';
const expected='444f832d306a2be4f823119f84e698e8821db6a1aab248593d4b05b7a9a48108';
async function hash(file) { const digest=createHash('sha256'); for await(const bytes of createReadStream(file)) digest.update(bytes); return digest.digest('hex'); }
let existing=false; try {existing=(await hash(target))===expected;} catch {}
if(!existing) {
  console.log('Downloading Apache-2.0 model (~364 MB)...');
  const response=await fetch('https://huggingface.co/Limitless-8/spectra-aasist3-int8-audio-deepfake/resolve/main/spectra-aasist3-int8-dynamic.onnx',{signal:AbortSignal.timeout(600000)});
  if(!response.ok || !response.body) throw new Error(`Model download failed: ${response.status}`);
  try {
    await pipeline(response.body,createWriteStream(target+'.partial'));
    if(await hash(target+'.partial')!==expected) throw new Error('Model integrity check failed. Retry setup.');
    await rename(target+'.partial',target);
  } finally { await rm(target+'.partial',{force:true}); }
}
const vadTarget='.audio-models/silero_vad.onnx';
const vadExpected='1a153a22f4509e292a94e67d6f9b85e8deb25b4988682b7e174c65279d8788e3';
let vadExisting=false; try {vadExisting=(await hash(vadTarget))===vadExpected;} catch {}
if(!vadExisting) {
  console.log('Downloading MIT-licensed speech-presence model...');
  const response=await fetch('https://raw.githubusercontent.com/snakers4/silero-vad/066409f3d9db45a30d21dfcbf9147826ffdd7052/src/silero_vad/data/silero_vad.onnx',{signal:AbortSignal.timeout(60000)});
  if(!response.ok || !response.body) throw new Error(`Speech model download failed: ${response.status}`);
  try {
    await pipeline(response.body,createWriteStream(vadTarget+'.partial'));
    if(await hash(vadTarget+'.partial')!==vadExpected) throw new Error('Speech model integrity check failed. Retry setup.');
    await rename(vadTarget+'.partial',vadTarget);
  } finally { await rm(vadTarget+'.partial',{force:true}); }
}
console.log('Audio setup complete. Restart npm run dev. No audio API key needed.');
