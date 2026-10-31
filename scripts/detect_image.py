"""Community Forensics ViT-S/384 ONNX CPU inference. See LOCAL_IMAGE_SETUP.md."""
import sys,json,math,hashlib
from pathlib import Path
import numpy as np
from PIL import Image,ImageOps
import onnxruntime as ort
EXPECTED='d7bb021fc2622d1f746da29010ef02d07028a76ab8c7759b0406c1d6763d1e72'
Image.MAX_IMAGE_PIXELS=25_000_000

def analyse(filename,model):
    digest=hashlib.sha256()
    with open(model,'rb') as f:
        for block in iter(lambda:f.read(1024*1024),b''):digest.update(block)
    if digest.hexdigest()!=EXPECTED:raise ValueError('Local image model integrity check failed. Run npm run setup:images.')
    with Image.open(filename) as source:
        image=ImageOps.exif_transpose(source).convert('RGB')
        w,h=image.size
        if not w or not h or w*h>25_000_000 or max(w,h)/min(w,h)>20:raise ValueError('Image dimensions are unsupported.')
        # Resize shortest edge to 440, then center crop to 384 (CLIP normalization).
        if w<h:size=(440,int(440*h/w))
        else:size=(int(440*w/h),440)
        image=image.resize(size,Image.Resampling.BICUBIC)
        left=round((image.width-384)/2);top=round((image.height-384)/2)
        image=image.crop((left,top,left+384,top+384))
        values=np.asarray(image,dtype=np.float32)/255.0
    mean=np.asarray([.48145466,.4578275,.40821073],dtype=np.float32)
    std=np.asarray([.26862954,.26130258,.27577711],dtype=np.float32)
    tensor=np.ascontiguousarray(((values-mean)/std).transpose(2,0,1)[None])
    options=ort.SessionOptions();options.intra_op_num_threads=2;options.inter_op_num_threads=1
    session=ort.InferenceSession(model,sess_options=options,providers=['CPUExecutionProvider'])
    logits=np.asarray(session.run(None,{session.get_inputs()[0].name:tensor})[0])
    if logits.size!=1 or not np.isfinite(logits).all():raise ValueError('Invalid local image detector output.')
    logit=float(logits.reshape(-1)[0]);score=1/(1+math.exp(-max(-80,min(80,logit))))
    return {'score':score,'logit':logit,'model':'Community Forensics ViT-S/384','sha256':EXPECTED,'preprocessing':'EXIF orientation; RGB; resize shortest edge 440 bicubic; center crop 384; CLIP normalization','scope':'AI-generated image detection only; face swaps and other edits are not verified.'}
if __name__=='__main__':
    try: print(json.dumps(analyse(sys.argv[1],sys.argv[2]),allow_nan=False))
    except Exception as error: print(json.dumps({'error':str(error)}));sys.exit(1)
