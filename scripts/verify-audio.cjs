// Functional checks using deterministic worker outputs; not an accuracy benchmark.
const fs = require('node:fs'); const assert = require('node:assert/strict'); const ts = require('typescript');
function compile(file, load = require) { const exports={}; const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText;new Function('exports','require',code)(exports,load);return exports; }
let scores=[.01,.02], warnings=[], speechPassed=true, invalidTiming=false, excluded=[], notes=[];
const child = { execFile: require('node:util').callbackify(async()=>({stdout:JSON.stringify({duration:8.075,segments:scores.map((score,i)=>({start:invalidTiming?-1:i*4.0375,end:(i+1)*4.0375,score,detectedSpeechSeconds:3})),qualityWarnings:warnings,processingNotes:notes,speechDetection:{passed:speechPassed,detectedSeconds:speechPassed?6:1,fraction:speechPassed?6/8.075:1/8.075},excludedWindows:excluded,sha256:'a'.repeat(64),rms:.04})})) };
// A promise custom implementation matches promisify(execFile)'s stdout/stderr object.
child.execFile[require('node:util').promisify.custom]=async()=>({stdout:JSON.stringify({duration:8.075,segments:scores.map((score,i)=>({start:invalidTiming?-1:i*4.0375,end:(i+1)*4.0375,score,detectedSpeechSeconds:3})),qualityWarnings:warnings,processingNotes:notes,speechDetection:{passed:speechPassed,detectedSeconds:speechPassed?6:1,fraction:speechPassed?6/8.075:1/8.075},excludedWindows:excluded,sha256:'a'.repeat(64),rms:.04})});
(async()=>{
 const service=compile('src/lib/services/audio-detection.ts',name=>name==='node:child_process'?child:require(name));
 const route=compile('src/app/api/analyze-audio/route.ts',name=>name==='@/lib/services/audio-detection'?service:name==='@/lib/analysis-cache'?{analysisCacheKey:async()=> 'test',analysisCache:{run:async(_key,compute)=>compute()}}:require(name));
 const labels=compile('src/lib/result-label.ts');
 async function call(bytes=Buffer.alloc(100)) {const form=new FormData();form.append('file',new File([bytes],'speech.wav'));return route.POST(new Request('http://localhost/api/analyze-audio',{method:'POST',body:form}));}
 let response=await call();let d=await response.json();assert.equal(response.status,200);assert.equal(d.status,'LOW MANIPULATION SIGNAL');assert.equal(d.mediaType,'audio');assert.equal(d.signals.length,2);assert.equal(d.samples,undefined);assert.equal(d.sources,undefined);
 scores=[.95,.99];d=await(await call()).json();assert.equal(d.score,99);assert.equal(labels.resultLabel(d.status,null,'audio',1).title,'LIKELY SYNTHETIC VOICE');
 notes=['Short input repeated using documented preprocessing'];scores=[.94];d=await(await call()).json();assert.equal(d.status,'MANIPULATION SIGNAL DETECTED');assert.ok(d.supporting.includes(notes[0]));assert.ok(d.caution.includes(notes[0]));
 scores=[.01];d=await(await call()).json();assert.equal(d.status,'LOW MANIPULATION SIGNAL');notes=[];
 scores=[.204];d=await(await call()).json();assert.equal(d.score,20);assert.equal(d.status,'INCONCLUSIVE');
 scores=[.796];d=await(await call()).json();assert.equal(d.score,80);assert.equal(d.status,'INCONCLUSIVE');
 scores=[.3,.99];d=await(await call()).json();assert.equal(d.status,'INCONCLUSIVE');
 scores=[.01,.3];d=await(await call()).json();assert.equal(d.status,'INCONCLUSIVE');
 scores=[.01,.99];d=await(await call()).json();assert.equal(d.status,'INCONCLUSIVE');
 scores=[.01];warnings=['Quiet recording'];d=await(await call()).json();assert.equal(d.status,'INCONCLUSIVE');
 scores=[];warnings=['Silent recording'];d=await(await call()).json();assert.equal(d.score,null);assert.equal(d.status,'INCONCLUSIVE');
 speechPassed=false;scores=[];d=await(await call()).json();assert.equal(d.score,null);assert.equal(d.status,'INCONCLUSIVE');
 scores=[.99];response=await call();assert.equal(response.status,503);
 speechPassed=true;scores=[.01];warnings=[];excluded=[{start:4.038,end:8.075,reason:'Clipped window'}];d=await(await call()).json();assert.equal(d.status,'INCONCLUSIVE');assert.ok(d.assessment.reasons.includes('Clipped window'));
 excluded=[];invalidTiming=true;response=await call();assert.equal(response.status,503);invalidTiming=false;
 scores=[NaN];response=await call();assert.equal(response.status,503);
 response=await call(Buffer.alloc(12));assert.equal(response.status,400);
 response=await call(Buffer.alloc(1_000_001));assert.equal(response.status,400);
 console.log('PASS: audio scores, mixed windows, quality warnings, silence, invalid outputs, upload bounds, audio labels and separate media schema.');
})().catch(e=>{console.error(e);process.exitCode=1});
