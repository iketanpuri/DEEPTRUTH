// Offline lifecycle checks: no provider requests, models or user uploads.
const fs=require('fs'),assert=require('assert/strict'),ts=require('typescript');
const exportsData={};new Function('exports','require',ts.transpileModule(fs.readFileSync('src/lib/analysis-cache.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText)(exportsData,require);
(async()=>{
 const {AnalysisCache,analysisCacheKey}=exportsData;let time=1000,calls=0;const cache=new AnalysisCache(()=>time);
 const compute=async()=>{calls++;return Response.json({id:'original',timestamp:'2026-10-31T12:00:00Z',score:0,assessment:{completedChecks:4,requestedChecks:4}});};
 let a=await(await cache.run('same',compute)).json();assert.equal(a.cache.reused,false);
 let b=await(await cache.run('same',compute)).json();assert.equal(b.cache.reused,true);assert.equal(calls,1);assert.equal(b.id,a.id);assert.equal(b.timestamp,a.timestamp);
 await cache.run('different',compute);assert.equal(calls,2);time+=3600001;await cache.run('same',compute);assert.equal(calls,3);
 let release;const gate=new Promise(r=>release=r);let concurrentCalls=0;const pending=new AnalysisCache();const slow=async()=>{concurrentCalls++;await gate;return compute();};
 const first=pending.run('duplicate',slow),second=pending.run('duplicate',slow);release();await Promise.all([first,second]);assert.equal(concurrentCalls,1);
 let failures=0;const fail=async()=>{failures++;return Response.json({error:'unavailable'},{status:503});};await cache.run('error',fail);await cache.run('error',fail);assert.equal(failures,2);
 const file=new File([Buffer.from('same content')],'example.png',{type:'image/png'});const key1=await analysisCacheKey([file],{type:'image'});const previous=process.env.HIVE_API_KEY;process.env.HIVE_API_KEY='offline-config-change';const key2=await analysisCacheKey([file],{type:'image'});if(previous===undefined)delete process.env.HIVE_API_KEY;else process.env.HIVE_API_KEY=previous;assert.notEqual(key1,key2);
 assert.notEqual(key1,await analysisCacheKey([file],{type:'video',timestamps:[1]}));
 let shortCalls=0;const short=async()=>{shortCalls++;return Response.json({score:50,assessment:{completedChecks:1,requestedChecks:4}});};await cache.run('partial',short);await cache.run('partial',short);assert.equal(shortCalls,1);time+=30001;await cache.run('partial',short);assert.equal(shortCalls,2);
 console.log('PASS: reuse, expiry, concurrent deduplication, failure retry, short partial-result TTL, credential and media-context invalidation. No live API calls.');
})().catch(e=>{console.error(e);process.exitCode=1});
