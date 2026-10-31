const fs=require('fs'),ts=require('typescript'),assert=require('node:assert/strict');
const moduleObject={exports:{}};
new Function('require','module','exports',ts.transpileModule(fs.readFileSync('src/lib/services/ai-review.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(require,moduleObject,moduleObject.exports);
const {additionalReview}=moduleObject.exports;
(async()=>{
 process.env.GEMINI_API_KEY='offline-test';
 const input={status:'INCONCLUSIVE',score:51,assessment:{reasons:['Intermediate signal']},samples:[]};let calls=0;
 const mock=async(url,init)=>{calls++;assert.equal(init.headers['x-goog-api-key'],'offline-test');assert.ok(JSON.parse(init.body).tools[0].google_search);return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:'Cannot establish authenticity from these signals.'}]},groundingMetadata:{groundingChunks:[{web:{uri:'https://example.com/source',title:'Source'}},{web:{uri:'javascript:alert(1)'}}]}}]});};
 const review=await additionalReview(input,mock);assert.equal(review.status,'ok');assert.equal(review.sources.length,1);assert.equal(input.score,51);
 assert.equal(await additionalReview({...input,status:'LOW MANIPULATION SIGNAL'},mock),undefined);assert.equal(calls,1);
 assert.equal((await additionalReview(input,async()=>new Response('',{status:429}))).status,'unavailable');
 delete process.env.GEMINI_API_KEY;assert.equal(await additionalReview(input,mock),undefined);
 console.log('PASS: eligibility, score preservation, grounding URL validation, quota failure, missing key.');
 if(process.argv.includes('--live')){
   for(const line of fs.readFileSync('.env.local','utf8').split(/\r?\n/)){const m=/^(GEMINI_API_KEY|GEMINI_MODEL)=(.*)$/.exec(line);if(m)process.env[m[1]]=m[2].trim().replace(/^['"]|['"]$/g,'');}
   const live=await additionalReview({...input,assessment:{reasons:['Integration test only; no actual media supplied.']}});
   console.log(JSON.stringify({liveStatus:live?.status,detail:live?.detail,returnedText:!!live?.text,sourceCount:live?.sources?.length}));
 }
})().catch(error=>{console.error(error.message);process.exitCode=1});
