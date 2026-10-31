import PDFDocument from 'pdfkit';
import path from 'node:path';
import sharp from 'sharp';
import { resultLabel } from './result-label';

type RecordData = Record<string, any>;
const INK='#17212f', MUTED='#64748b', ACCENT='#0f766e', NAVY='#14243b';
const MARGIN=44, WIDTH=507;
const present=(value: unknown)=>value!==undefined && value!==null;
const display=(value: unknown):string=>present(value)?String(value):'Not available';
const excerpt=(value: unknown, limit=180)=>{
  if(typeof value!=='string') return '';
  const text=value.replace(/\s+/g,' ').trim();return text.length>limit?text.slice(0,limit-3).trimEnd()+'...':text;
};
const score=(value: unknown)=>typeof value==='number' && Number.isFinite(value)?`${Math.round(value*10)/10}/100`:'Not available';
function safeUrl(value: unknown):string|undefined{
  if(typeof value!=='string')return;
  try{const u=new URL(value);if(u.protocol==='https:'||u.protocol==='http:')return u.href;}catch{/* Not a source URL. */}
}


/** Concise complaint attachment based on the existing analysis; never reruns detection. */
export async function createEvidencePdf(data: RecordData):Promise<Buffer>{
  const samples:Array<RecordData>=Array.isArray(data.samples)?data.samples:[];
  let preview:Buffer|undefined;
  const first=samples[0];
  if(typeof first?.preview==='string' && /^data:image\/(jpeg|png);base64,/.test(first.preview)){
    try{preview=await sharp(Buffer.from(first.preview.split(',')[1],'base64'),{limitInputPixels:1_000_000}).rotate().resize({width:420,height:240,fit:'inside',withoutEnlargement:true}).jpeg({quality:70}).toBuffer();}catch{/* Optional reference preview; textual evidence remains. */}
  }
  const doc=new PDFDocument({size:'A4',margins:{top:44,bottom:51,left:MARGIN,right:MARGIN},bufferPages:true,info:{Title:'DeepTruth - Media Analysis Summary',Author:'DeepTruth',Subject:`Supporting attachment ${display(data.id)}`,Creator:'DeepTruth PDF export'}});
  const result=new Promise<Buffer>((resolve,reject)=>{const chunks:Buffer[]=[];doc.on('data',chunk=>chunks.push(chunk));doc.on('end',()=>resolve(Buffer.concat(chunks)));doc.on('error',reject);});
  doc.registerFont('Body',path.join(process.cwd(),'assets/report-fonts/NotoSans-Regular.ttf'));
  doc.registerFont('Indic',path.join(process.cwd(),'assets/report-fonts/NotoSansDevanagari-Regular.ttf'));
  const room=(height:number)=>{if(doc.y+height>doc.page.height-55)doc.addPage();};
  const text=(value:unknown,size=9,color=INK,link?:string)=>{
    const content=display(value).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'');
    const runs=content.match(/[\u0900-\u097f]+|[^\u0900-\u097f]+/g)||[''];
    runs.forEach((run,i)=>{doc.font(/[\u0900-\u097f]/.test(run)?'Indic':'Body').fontSize(size).fillColor(color);const options={width:WIDTH,lineGap:2,continued:i<runs.length-1,...(link?{link,underline:true}:{})};if(i===0)doc.text(run,MARGIN,doc.y,options);else doc.text(run,options);});
    doc.moveDown(.25);
  };
  const heading=(title:string)=>{room(55);doc.moveDown(.5);text(title,11.5,ACCENT);doc.save().strokeColor('#dbe5ee').lineWidth(.6).moveTo(MARGIN,doc.y+2).lineTo(MARGIN+WIDTH,doc.y+2).stroke().restore();doc.y+=9;};
  const field=(name:string,value:unknown)=>{if(present(value)&&value!=='')text(`${name}: ${display(value)}`);};
  try{
    doc.save().rect(0,0,doc.page.width,88).fill(NAVY).restore();
    doc.save().roundedRect(MARGIN,27,34,34,7).fill('#1e4262').restore();
    doc.font('Body').fontSize(21).fillColor('#67e8f9').text('D',MARGIN,28,{width:34,align:'center',lineBreak:false});
    doc.fontSize(23).fillColor('#ffffff').text('DEEPTRUTH',MARGIN+46,27,{lineBreak:false});
    doc.save().rect(MARGIN,74,WIDTH,2).fill('#2dd4bf').restore();
    doc.x=MARGIN;doc.y=106;
    if(data.isDemo)text('ILLUSTRATIVE DEMO - no live analysis or source retrieval was performed.',9,'#9b341b');

    const simple=data.detectionSchemaVersion===3?resultLabel(data.status,data.assessment?.strongestModel,data.mediaType,samples.length||1,data.assessment?.scope):null;
    const primary=present(data.evidenceScore)?data.evidenceScore:data.score;
    const primaryName=data.claimsAnalyzed?'Evidence score':data.mediaType==='audio'?'Synthetic-voice signal':data.assessment?.strongestModel==='Face-manipulation confidence'?'Face-manipulation signal':'AI-generation signal';
    const detected=data.claimsAnalyzed ? data.verdict==='LIKELY MISLEADING' : data.status==='MANIPULATION SIGNAL DETECTED' || (data.detectionSchemaVersion!==3 && data.color==='synthetic');
    const low=data.claimsAnalyzed ? data.verdict==='VERIFIED' : data.status==='LOW MANIPULATION SIGNAL' || (data.detectionSchemaVersion!==3 && data.color==='authentic');
    const verdictColor=detected?'#dc2626':low?'#15803d':'#b45309';
    const verdictBackground=detected?'#fff1f2':low?'#f0fdf4':'#fffbeb';
    room(184);
    const cardTop=doc.y;
    doc.save().roundedRect(MARGIN,cardTop,WIDTH,176,10).fillAndStroke('#f8fafc','#e2e8f0').restore();
    doc.y=cardTop+12;
    const verdictTitle = simple?.title === 'LIKELY FACE-MANIPULATED' ? 'LIKELY AI-GENERATED' : simple?.title || data.verdict || data.status || 'No conclusion available';
    doc.font('Body').fontSize(12).fillColor(verdictColor).text(verdictTitle,MARGIN,doc.y,{width:WIDTH,align:'center'});
    const centerX=doc.page.width/2,centerY=doc.y+67,radius=54;
    doc.save().circle(centerX,centerY,radius).fillAndStroke(verdictBackground,verdictColor).restore();
    doc.save().lineWidth(2).circle(centerX,centerY,radius).stroke(verdictColor).restore();
    const available=typeof primary==='number' && Number.isFinite(primary);
    doc.font('Body').fontSize(available?40:32).fillColor(verdictColor).text(available?String(Math.round(primary*10)/10):'N/A',centerX-radius,centerY-33,{width:radius*2,align:'center',lineBreak:false});
    if(available)doc.fontSize(10).text('/100',centerX-radius,centerY+21,{width:radius*2,align:'center',lineBreak:false});
    doc.fontSize(8.5).fillColor(MUTED).text(primaryName,MARGIN,centerY+radius+11,{width:WIDTH,align:'center'});
    doc.x=MARGIN;doc.y=Math.max(centerY+radius+32,cardTop+190);

    if(data.keyReasoning)text(excerpt(data.keyReasoning,300));
    else if(simple)text(simple.explanation);
    else if(data.explainSimply || data.desc)text(excerpt(data.explainSimply || data.desc,220));

    if(data.assessment?.scope==='ai-generation-only')text('Scope: AI-generation check only; face-swap verification unavailable.',8.5,MUTED);
    if(data.assessment?.scope==='single-provider')text('Scope: single-provider result; a two-provider average was unavailable.',8.5,MUTED);
    if(data.mediaType==='video')text(`Scope: ${samples.length} sampled frames; whole-video motion, soundtrack and lip-sync were not checked.`,8.5,MUTED);
    if(data.audioEvidence){
      field('Audio examined',`${Number(data.audioEvidence.duration).toFixed(2)}s; ${data.audioEvidence.segments?.length || 0} checked windows`);
      if(data.audioEvidence.speechDetection)field('Detected speech',`${data.audioEvidence.speechDetection.detectedSeconds}s`);
    }
    const warnings=[...new Set<string>([...samples.flatMap(s=>Array.isArray(s.qualityWarnings)?s.qualityWarnings:[]),...(Array.isArray(data.audioEvidence?.qualityWarnings)?data.audioEvidence.qualityWarnings:[])])];
    warnings.slice(0,3).forEach(w=>text(excerpt(w,200),8.5,'#9b341b'));
    if(data.originalContent)field('Content examined',excerpt(data.originalContent,400));
    if(data.extractedText){heading('Text found in the media (excerpt)');text(excerpt(data.extractedText,350),9);}

    if(preview){
      room(113);const y=doc.y+6;
      doc.save().roundedRect(MARGIN,y,WIDTH,99,8).fill('#f8fafc').restore();
      doc.image(preview,MARGIN+12,y+10,{fit:[110,78]});
      doc.font('Body').fontSize(10).fillColor(INK).text(data.mediaType==='video'?'Analysed video frame':'Analysed image',MARGIN+140,y+25,{width:WIDTH-155});
      doc.fontSize(8).fillColor(MUTED).text(data.mediaType==='video'?'Reference preview of the first sampled frame. This is not a manipulation heatmap.':'Reference preview of the submitted image. This is not a manipulation heatmap.',MARGIN+140,y+45,{width:WIDTH-155,lineGap:2});
      doc.x=MARGIN;doc.y=y+110;
    }

    const related:Array<RecordData>=[];const seen=new Set<string>();
    for(const source of Array.isArray(data.sources)?data.sources:[]){const target=safeUrl(source?.url);if(!target || seen.has(target))continue;seen.add(target);related.push({...source,url:target});}
    heading('Related source links');
    if(!related.length)text('No external source links were retrieved.',8.5,MUTED);
    else{
      text('Retrieved matches/context only. Original publisher and connection to an incident are not verified.',8,MUTED);
      related.forEach((source,i)=>{room(45);text(`${i+1}. ${excerpt(source.sourceName || source.title || 'Source',90)}`,9);
        const context=excerpt(source.relevance || source.relevanceReason,120);if(context)text(context,8,MUTED);
        text(source.url,8,'#145e9c',source.url);
      });
    }

    const fingerprints=samples.filter(s=>typeof s.sha256==='string' && /^[a-f0-9]{64}$/i.test(s.sha256));
    const audioHash=data.audioEvidence?.sha256;
    if(fingerprints.length || (typeof audioHash==='string' && /^[a-f0-9]{64}$/i.test(audioHash))){
      heading('Evidence fingerprints (SHA-256)');
      for(const sample of fingerprints){
        const name=data.mediaType==='video'?`Extracted JPEG frame at ${sample.timestamp}s`:'Uploaded image';
        text(`${name}: ${sample.sha256}`,7.8);
      }
      if(data.mediaType==='video')text('Frame fingerprints identify analysed JPEG samples, not the original video file.',7.5,MUTED);
      if(typeof audioHash==='string' && /^[a-f0-9]{64}$/i.test(audioHash)){text(`Converted analysis WAV: ${audioHash}`,7.8);text('This fingerprint identifies the converted WAV, not the original encoded audio file.',7.5,MUTED);}
    }
    room(65);doc.moveDown(.6);
    text('Automated indicators only - not proof of authenticity, manipulation or a crime. Scores are not measured accuracy. This is a supporting attachment, not an official complaint or forensic certification. Preserve the original media and supply the incident details separately.',8,MUTED);
    const pages=doc.bufferedPageRange();
    for(let i=pages.start;i<pages.start+pages.count;i++){
      doc.switchToPage(i);const height=doc.page.height,bottom=doc.page.margins.bottom;doc.page.margins.bottom=0;
      doc.strokeColor('#dbe1e8').lineWidth(.5).moveTo(MARGIN,height-35).lineTo(MARGIN+WIDTH,height-35).stroke();
      doc.font('Body').fontSize(7.5).fillColor(MUTED).text('DeepTruth | Supporting media analysis',MARGIN,height-27,{lineBreak:false});
      doc.text(`${i+1} / ${pages.count}`,MARGIN+WIDTH-50,height-27,{width:50,align:'right',lineBreak:false});doc.page.margins.bottom=bottom;
    }
    doc.end();
  }catch(error){doc.destroy(error instanceof Error?error:new Error('PDF export failed.'));}
  return result;
}
