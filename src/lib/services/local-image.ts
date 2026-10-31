import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { access, mkdtemp, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
const run = promisify(execFile);
let queue = Promise.resolve();
let pending = 0;
export type LocalImageResult = { score: number; logit: number; model: string; sha256: string; preprocessing: string; scope: string };
export async function analyzeLocalImage(bytes: Buffer): Promise<LocalImageResult> {
  if (pending >= 6) throw new Error('Local image detector is busy. Please retry after the current check.');
  pending++;
  const previous = queue;
  let release!: () => void;
  queue = new Promise<void>(resolve => { release = resolve; });
  let folder: string | undefined;
  try {
    await previous;
    const root = process.cwd();
    let python = process.env.IMAGE_PYTHON || process.env.AUDIO_PYTHON || path.join(root,'.venv-audio312','bin','python');
    if (!process.env.IMAGE_PYTHON && !process.env.AUDIO_PYTHON) { try { await access(python); } catch { python = path.join(root,'.venv-audio312','Scripts','python.exe'); } }
    const model = path.join(root,'.image-models','community-forensics.onnx');
    try { await Promise.all([access(python),access(model)]); } catch { throw new Error('Local image detector setup is missing. Run npm run setup:images.'); }
    folder = await mkdtemp(path.join(os.tmpdir(),'deeptruth-image-'));
    const input = path.join(folder,'input'); await writeFile(input,bytes);
    let stdout: string;
    try { ({ stdout } = await run(python,[path.join(root,'scripts/detect_image.py'),input,model],{timeout:45000,maxBuffer:1024*1024,env:{...process.env,PYTHONDONTWRITEBYTECODE:'1'}})); }
    catch { throw new Error('Local image detection could not complete. Check local model setup or retry.'); }
    const result = JSON.parse(stdout) as LocalImageResult;
    if (!Number.isFinite(result.score) || result.score<0 || result.score>1 || result.sha256 !== 'd7bb021fc2622d1f746da29010ef02d07028a76ab8c7759b0406c1d6763d1e72') throw new Error('Local image detector returned an invalid result.');
    return result;
  } finally { try { if(folder) await rm(folder,{recursive:true,force:true}); } finally { pending--; release(); } }
}
