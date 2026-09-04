
/* SOHOZKAJ photo crop/join upgrade — preserves existing AI, BG remove and OCR APIs */
let currentTarget='single', utilityMode='', lastImage='';
const $=id=>document.getElementById(id);
const cropStates={single:null,left:null,right:null};
const croppedImages={single:null,left:null,right:null};
const sourceFiles={single:null,left:null,right:null};
let utilityFile=null;
let cropRatioLocked=true;
let activeCropTarget='single', cropZoomLevel=1, cropRotation=0, cropPan={x:0,y:0}, dragging=false, dragStart=null, pinchStartDistance=0, pinchStartZoom=1;
const PRESETS={
 passport:{w:35,h:45,u:'mm'}, visa:{w:35,h:45,u:'mm'}, nid:{w:35,h:45,u:'mm'},
 job:{w:40,h:50,u:'mm'}, birth:{w:35,h:45,u:'mm'}, '2x2':{w:2,h:2,u:'inch'},
 '35x45':{w:35,h:45,u:'mm'}, '40x50':{w:40,h:50,u:'mm'}, '3.5x4.5':{w:3.5,h:4.5,u:'cm'},
 custom:{w:35,h:45,u:'mm'}
};
const DPI=300;
function toast(msg){const t=$('toast');if(!t)return;t.textContent=msg;t.classList.add('show');clearTimeout(window._toast);window._toast=setTimeout(()=>t.classList.remove('show'),2600)}
function openSheet(id){closeSheets();$('overlay')?.classList.add('open');$(id)?.classList.add('open')}
function closeSheets(){document.querySelectorAll('.sheet').forEach(x=>x.classList.remove('open'));$('overlay')?.classList.remove('open')}
function openQuick(){openSheet('quickSheet')}
function setView(id){document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));$(id)?.classList.add('active');document.body.classList.toggle('editor-active',id==='editorView');closeSheets();window.scrollTo(0,0)}
function goHome(){setView('homeView')}
function openEditor(mode='single'){setView('editorView'); if(mode==='remove'){utilityMode='remove';if($('prompt'))$('prompt').value='ব্যাকগ্রাউন্ড পরিষ্কারভাবে সরিয়ে দিন এবং বিষয়টিকে স্বাভাবিক রাখুন।'}else utilityMode='ai'}
function showProfile(){setView('profileView')}
function scrollToTools(){$('toolsTitle')?.scrollIntoView({behavior:'smooth'})}
function setPhotoMode(mode){
 const dual=mode==='dual';$('dualUpload')?.classList.toggle('hidden',!dual);$('singleUpload')?.classList.toggle('hidden',dual);
 $('singleModeBtn')?.classList.toggle('active',!dual);$('dualModeBtn')?.classList.toggle('active',dual);
 $('joinBtn')?.classList.toggle('hidden',!dual);
 if(dual) toast('দুটি ছবির মোড চালু হয়েছে');
}
function toggleMode(){setPhotoMode($('dualUpload')?.classList.contains('hidden')?'dual':'single')}
function pickImage(target){
  if(target==='utility'){
    const input=$('utilityFileInput');
    if(!input){toast('আপলোড ব্যবস্থা পাওয়া যায়নি');return}
    input.value='';input.click();return;
  }
  currentTarget=target;
  const input=$('fileInput');input.value='';input.click();
}
function handleCropFile(f,target){
  if(!f)return;
  if(f.size>60*1024*1024){toast('ফাইলের আকার 60MB-এর বেশি হতে পারবে না');return}
  if(!/^image\/(jpeg|png|webp)$/.test(f.type)){toast('শুধু JPG, PNG বা WEBP ছবি গ্রহণ করা হচ্ছে');return}
  sourceFiles[target]=f;
  const url=URL.createObjectURL(f);
  const map={left:['leftBox','leftPreview','leftCropBtn'],right:['rightBox','rightPreview','rightCropBtn'],single:['singleUpload','singlePreview',null]};
  const ids=map[target]||map.single, box=$(ids[0]), pre=$(ids[1]);
  pre.onload=()=>{cropStates[target]={src:url,img:pre,naturalW:pre.naturalWidth,naturalH:pre.naturalHeight};croppedImages[target]=null;if(ids[2])$(ids[2]).classList.remove('hidden');box.classList.add('has-image');toast('ছবি সফলভাবে আপলোড হয়েছে');openCrop(target)};
  pre.src=url;
}
$('fileInput').addEventListener('change',e=>handleCropFile(e.target.files?.[0],currentTarget));
$('utilityFileInput').addEventListener('change',async e=>{
  const f=e.target.files?.[0];if(!f)return;utilityFile=f;
  if(utilityMode==='remove'||utilityMode==='ocr'){await runUtility(f)}
  else {toast('এই টুলের জন্য ছবিটি প্রস্তুত করা হচ্ছে');await runUtility(f)}
});

function pxFor(v,u){v=Number(v)||0;return u==='px'?Math.round(v):u==='mm'?Math.round(v/25.4*DPI):u==='cm'?Math.round(v/2.54*DPI):Math.round(v*DPI)}
function getCropSpec(){const u=$('cropUnit').value;return {w:Number($('cropW').value)||1,h:Number($('cropH').value)||1,u,pxW:pxFor($('cropW').value,u),pxH:pxFor($('cropH').value,u)}}
function applyPreset(key){const p=PRESETS[key]||PRESETS.custom;$('cropW').value=p.w;$('cropH').value=p.h;$('cropUnit').value=p.u;window._cropAspect=p.w/p.h;updateRatioBadge();if(cropStates[activeCropTarget])drawCrop()}
function updateRatioBadge(){const s=getCropSpec();$('ratioBadge').textContent=`অনুপাত ${s.w} : ${s.h} • ${s.pxW} × ${s.pxH} px @ ${DPI} DPI`}
function toggleRatioLock(){cropRatioLocked=!cropRatioLocked;const b=$('ratioLockBtn');if(b){b.classList.toggle('active',cropRatioLocked);b.textContent=cropRatioLocked?'🔒 অনুপাত লক':'🔓 অনুপাত মুক্ত'};if(cropRatioLocked){window._cropAspect=getCropSpec().pxW/getCropSpec().pxH;syncCropSize('w')}}
function syncCropSize(changed){
 const w=Number($('cropW').value)||1,h=Number($('cropH').value)||1;
 if(!cropRatioLocked){updateRatioBadge();if(cropStates[activeCropTarget])drawCrop();return}
 const ratio=window._cropAspect||w/h||1;
 if(changed==='w') $('cropH').value=(w/ratio).toFixed(2).replace(/\.00$/,'');
 else $('cropW').value=(h*ratio).toFixed(2).replace(/\.00$/,'');
 updateRatioBadge();if(cropStates[activeCropTarget])drawCrop();
}
$('cropW').addEventListener('input',()=>syncCropSize('w'));
$('cropH').addEventListener('input',()=>syncCropSize('h'));
$('cropUnit').addEventListener('change',()=>{updateRatioBadge();if(cropStates[activeCropTarget])drawCrop()});
document.querySelectorAll('.bg-choice').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.bg-choice').forEach(x=>x.classList.remove('active'));b.classList.add('active')}));
function selectedBg(){return document.querySelector('.bg-choice.active')?.dataset.bg||'original'}
function bgFill(ctx,w,h){const bg=selectedBg();if(bg==='original'||bg==='transparent'){ctx.clearRect(0,0,w,h);return}ctx.fillStyle=bg==='white'?'#fff':($('bgColor')?.value||'#fff');ctx.fillRect(0,0,w,h)}
function openCrop(target='current'){
 if(target==='current') target=$('dualModeBtn')?.classList.contains('active')?(croppedImages.left?'right':'left'):'single';
 if(!cropStates[target]){toast('প্রথমে ছবি আপলোড করুন');return}
 activeCropTarget=target;cropZoomLevel=1;cropRotation=0;cropPan={x:0,y:0};window._cropAspect=getCropSpec().pxW/getCropSpec().pxH;
 $('cropTargetLabel').textContent=target==='left'?'ছবি ১':target==='right'?'ছবি ২':'একক ছবি';
 $('cropModal').classList.remove('hidden');document.body.classList.add('modal-open');updateRatioBadge();drawCrop();
 if($('smartMode').checked)smartCenterCrop();
}
function closeCrop(){$('cropModal').classList.add('hidden');document.body.classList.remove('modal-open')}
function resetCrop(){cropZoomLevel=1;cropRotation=0;cropPan={x:0,y:0};drawCrop()}
function cropZoom(delta){cropZoomLevel=Math.max(.5,Math.min(5,cropZoomLevel+delta));drawCrop()}
function rotateCrop(deg){cropRotation=(cropRotation+deg)%360;drawCrop()}
function sourceImage(){return cropStates[activeCropTarget]?.img}
function drawCrop(){
 const canvas=$('cropCanvas'), wrap=canvas.parentElement, img=sourceImage();if(!img)return;
 const s=getCropSpec(), ratio=s.pxW/s.pxH, maxW=Math.max(260,wrap.clientWidth-20), maxH=Math.max(260,Math.min(window.innerHeight*.55,520));
 let cw=maxW,ch=cw/ratio;if(ch>maxH){ch=maxH;cw=ch*ratio}
 canvas.width=Math.round(cw*devicePixelRatio);canvas.height=Math.round(ch*devicePixelRatio);canvas.style.width=cw+'px';canvas.style.height=ch+'px';
 const ctx=canvas.getContext('2d');ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
 ctx.fillStyle='#090d16';ctx.fillRect(0,0,cw,ch);
 ctx.save();ctx.beginPath();ctx.rect(0,0,cw,ch);ctx.clip();
 const iw=img.naturalWidth,ih=img.naturalHeight, rot=((cropRotation%360)+360)%360, rotated=(rot===90||rot===270);
 const rw=rotated?ih:iw,rh=rotated?iw:ih;
 const scale=Math.max(cw/rw,ch/rh)*cropZoomLevel;
 const dw=rw*scale,dh=rh*scale,x=(cw-dw)/2+cropPan.x,y=(ch-dh)/2+cropPan.y;
 ctx.translate(x+dw/2,y+dh/2);ctx.rotate(rot*Math.PI/180);ctx.drawImage(img,-iw*scale/2,-ih*scale/2,iw*scale,ih*scale);ctx.restore();
 // subtle crop boundary/grid
 ctx.strokeStyle='#ff941d';ctx.lineWidth=2;ctx.strokeRect(1,1,cw-2,ch-2);
 ctx.strokeStyle='#ffffff55';ctx.lineWidth=1;for(let i=1;i<3;i++){ctx.beginPath();ctx.moveTo(cw*i/3,0);ctx.lineTo(cw*i/3,ch);ctx.stroke();ctx.beginPath();ctx.moveTo(0,ch*i/3);ctx.lineTo(cw,ch*i/3);ctx.stroke()}
}
function touchDistance(t){if(!t||t.length<2)return 0;const dx=t[0].clientX-t[1].clientX,dy=t[0].clientY-t[1].clientY;return Math.hypot(dx,dy)}
function pointerDown(e){
 if(e.touches&&e.touches.length>=2){dragging=false;pinchStartDistance=touchDistance(e.touches);pinchStartZoom=cropZoomLevel;return}
 dragging=true;const p=e.touches?.[0]||e;dragStart={x:p.clientX,y:p.clientY,px:cropPan.x,py:cropPan.y}
}
function pointerMove(e){
 if(e.touches&&e.touches.length>=2){e.preventDefault();const d=touchDistance(e.touches);if(pinchStartDistance>0){cropZoomLevel=Math.max(.5,Math.min(5,pinchStartZoom*(d/pinchStartDistance)));drawCrop()}return}
 if(!dragging)return;e.preventDefault();const p=e.touches?.[0]||e;cropPan.x=dragStart.px+p.clientX-dragStart.x;cropPan.y=dragStart.py+p.clientY-dragStart.y;drawCrop()
}
function pointerUp(e){dragging=false;if(!e?.touches||e.touches.length<2)pinchStartDistance=0}
$('cropCanvas').addEventListener('mousedown',pointerDown);$('cropCanvas').addEventListener('mousemove',pointerMove);window.addEventListener('mouseup',pointerUp);
$('cropCanvas').addEventListener('touchstart',pointerDown,{passive:false});$('cropCanvas').addEventListener('touchmove',pointerMove,{passive:false});window.addEventListener('touchend',pointerUp,{passive:false});
$('cropCanvas').addEventListener('wheel',e=>{e.preventDefault();cropZoom(e.deltaY<0?.12:-.12)},{passive:false});
async function smartCenterCrop(){
 const img=sourceImage();if(!img)return;
 try{
   if('FaceDetector' in window){const faces=await new FaceDetector({fastMode:true,maxDetectedFaces:1}).detect(img);if(faces[0]){const b=faces[0].boundingBox;const s=getCropSpec(),ratio=s.pxW/s.pxH;const desiredScale=Math.max(s.pxW/b.width,s.pxH/b.height)*1.9;cropZoomLevel=Math.max(.8,Math.min(4,desiredScale/Math.max(img.naturalWidth/s.pxW,img.naturalHeight/s.pxH)));cropPan={x:0,y:0};toast('মুখ শনাক্ত করে ফ্রেম ভারসাম্য করা হয়েছে');}}
   else toast('স্মার্ট ক্রপ প্রস্তুত — আপনার ব্রাউজারে স্বয়ংক্রিয় মুখ শনাক্তকরণ নেই, তাই নিরাপদ কেন্দ্র ফ্রেম ব্যবহার করা হয়েছে');
 }catch{toast('স্মার্ট ক্রপ নিরাপদ কেন্দ্র ফ্রেমে প্রস্তুত করা হয়েছে')}
 drawCrop();
}
async function applyCrop(){
 const img=sourceImage();if(!img)return;const s=getCropSpec(),out=document.createElement('canvas');out.width=s.pxW;out.height=s.pxH;const ctx=out.getContext('2d');
 bgFill(ctx,out.width,out.height);
 const iw=img.naturalWidth,ih=img.naturalHeight,rot=((cropRotation%360)+360)%360,rotated=rot===90||rot===270,rw=rotated?ih:iw,rh=rotated?iw:ih;
 const scale=Math.max(out.width/rw,out.height/rh)*cropZoomLevel;
 const dw=rw*scale,dh=rh*scale;
 const stage=$('cropCanvas'), sw=parseFloat(stage.style.width),sh=parseFloat(stage.style.height);
 const sx=(out.width-dw)/2+(cropPan.x*(out.width/sw)),sy=(out.height-dh)/2+(cropPan.y*(out.height/sh));
 ctx.save();ctx.translate(sx+dw/2,sy+dh/2);ctx.rotate(rot*Math.PI/180);ctx.drawImage(img,-iw*scale/2,-ih*scale/2,iw*scale,ih*scale);ctx.restore();
 croppedImages[activeCropTarget]=out;
 closeCrop();
 const preId=activeCropTarget==='single'?'singlePreview':activeCropTarget==='left'?'leftPreview':'rightPreview';
 $(preId).src=out.toDataURL('image/png');
 if(activeCropTarget==='left')$('leftBox').classList.add('has-image');
 if(activeCropTarget==='right')$('rightBox').classList.add('has-image');
 toast('ক্রপ সফলভাবে সংরক্ষণ হয়েছে');
 if(activeCropTarget==='single'){showResult(out.toDataURL('image/png'));}else if(croppedImages.left&&croppedImages.right){$('joinBtn').classList.remove('hidden');toast('দুই ছবিই প্রস্তুত — এখন জোড়া ছবি তৈরি করুন')}
}
function renderFit(ctx,img,x,y,w,h){
 const r=Math.min(w/img.width,h/img.height),dw=img.width*r,dh=img.height*r;ctx.drawImage(img,x+(w-dw)/2,y+(h-dh)/2,dw,dh)
}
function renderCover(ctx,img,x,y,w,h){
 // Fill the whole cell without stretching. This prevents the unwanted
 // transparent/duplicated strip that appeared when the two crop sizes differed.
 const scale=Math.max(w/img.width,h/img.height);
 const sw=w/scale,sh=h/scale;
 const sx=(img.width-sw)/2,sy=(img.height-sh)/2;
 ctx.drawImage(img,sx,sy,sw,sh,x,y,w,h);
}
function joinPhotos(){
 if(!croppedImages.left||!croppedImages.right){toast('ছবি ১ ও ছবি ২ দুটিই ক্রপ করুন');return}
 try{
   const a=croppedImages.left,b=croppedImages.right;
   // Both photos are placed in equal side-by-side cells. The cell ratio is
   // taken from the currently selected crop size, so faces stay proportional.
   const spec=getCropSpec();
   const cellH=Math.max(1,spec.pxH);
   const cellW=Math.max(1,spec.pxW);
   const gap=0;
   const c=document.createElement('canvas');c.width=cellW*2+gap;c.height=cellH;
   const ctx=c.getContext('2d',{alpha:true});
   bgFill(ctx,c.width,c.height);
   renderCover(ctx,a,0,0,cellW,cellH);
   renderCover(ctx,b,cellW+gap,0,cellW,cellH);
   window.joinCanvas=c;
   const card=$('finalSizeCard');card.classList.remove('hidden');
   $('finalW').value=(c.width/DPI).toFixed(2);
   $('finalH').value=(c.height/DPI).toFixed(2);
   $('finalUnit').value='inch';
   showResult(c.toDataURL('image/png'));
   card.scrollIntoView({behavior:'smooth',block:'center'});
   toast(`জোড়া ছবি তৈরি হয়েছে — পাশাপাশি সমান মাপে ${c.width} × ${c.height} px`);
 }catch(e){console.error(e);toast('জোড়া ছবি তৈরি করা যায়নি। দুই ছবির ক্রপ নিশ্চিত করে আবার চেষ্টা করুন।')}
}
function generateFinal(){
 if(!window.joinCanvas){toast('প্রথমে জোড়া ছবি তৈরি করুন');return}
 const w=pxFor($('finalW').value,$('finalUnit').value),h=pxFor($('finalH').value,$('finalUnit').value);
 if(w<1||h<1||w>16000||h>16000){toast('সাইজ ১ থেকে ১৬,০০০ px-এর মধ্যে দিন');return}
 const out=document.createElement('canvas');out.width=w;out.height=h;const ctx=out.getContext('2d');bgFill(ctx,w,h);
 renderFit(ctx,window.joinCanvas,0,0,w,h);showResult(out.toDataURL('image/png'));toast(`ফাইনাল ছবি ${w} × ${h} px-এ তৈরি হয়েছে`);$('resultPanel').scrollIntoView({behavior:'smooth',block:'center'})
}
function showResult(src){lastImage=src;$('resultImage').src=src;$('downloadBtn').href=src;$('resultPanel').classList.remove('hidden')}
function regenerate(){deleteResult();setPhotoMode(croppedImages.left&&croppedImages.right?'dual':'single');toast('আবার জেনারেট করার জন্য ছবি/ক্রপ প্রস্তুত করুন')}
function editResult(){$('resultPanel').classList.add('hidden');$('editorControls').scrollIntoView({behavior:'smooth'});toast('ইমেজ রিসাইজ ও এডিট মোড চালু')}
function deleteResult(){$('resultPanel').classList.add('hidden');lastImage='';if($('resultImage'))$('resultImage').removeAttribute('src');toast('ফলাফল মুছে ফেলা হয়েছে')}
function printResult(){if(!lastImage){toast('প্রথমে একটি ফলাফল তৈরি করুন');return}const w=window.open('','_blank');w.document.write(`<html><head><title>SOHOZKAJ Print</title><style>@page{margin:0}html,body{margin:0;text-align:center;background:#fff}img{max-width:100%;height:auto}</style></head><body><img src="${lastImage}" onload="window.print()"></body></html>`);w.document.close()}
async function smartCropAll(){if($('smartMode').checked){const targets=cropStates.left&&cropStates.right?['left','right']:['single'];for(const t of targets){if(cropStates[t]){activeCropTarget=t;await smartCenterCrop()}};toast('স্মার্ট ক্রপ সক্রিয় করা হয়েছে')}else{$('smartMode').checked=true;openCrop(croppedImages.left?'right':'single')}}
function focusPrompt(){openSheet('settingsSheet');setTimeout(()=>$('prompt')?.focus(),250)}
async function postImage(url,form){const r=await fetch(url,{method:'POST',body:form});const d=await r.json().catch(()=>({}));if(!r.ok||!d.ok)throw new Error(d.error||'অনুরোধ ব্যর্থ হয়েছে');return d}
function selectedImage(){const img=$('singlePreview');return img?.src&&sourceFiles.single?img:null}
async function generateAI(){
 closeSheets();const img=selectedImage();if(!img){toast('প্রথমে একটি ছবি আপলোড করুন');return}
 const f=sourceFiles.single;if(!f){toast('ছবিটি আবার নির্বাচন করুন');return}
 toast('AI ছবি তৈরি করছে…');const fd=new FormData();fd.append('image',f);fd.append('prompt',$('prompt').value);fd.append('quality',$('quality').value);fd.append('size','auto');fd.append('background','auto');
 try{const d=await postImage('/api/ai-edit',fd);showResult(d.image)}catch(e){toast(e.message+' — .env API key পরীক্ষা করুন।')}
}
function useResult(){deleteResult();toast('আবার এডিট করতে ছবি আপলোড করুন')}
async function runUtility(file){
 if(utilityMode==='remove'){toast('ব্যাকগ্রাউন্ড রিমুভ হচ্ছে…');const fd=new FormData();fd.append('image',file);fd.append('provider',$('bgProvider')?.value||'auto');try{const d=await postImage('/api/remove-bg',fd);closeSheets();showResult(d.image);toast(`${d.provider==='removebg'?'remove.bg':'Cutout.Pro'} দিয়ে ব্যাকগ্রাউন্ড সরানো হয়েছে`)}catch(e){toast('ব্যাকগ্রাউন্ড রিমুভ হয়নি: '+e.message)}}
 else if(utilityMode==='ocr'){toast('ছবি থেকে লেখা পড়া হচ্ছে…');const fd=new FormData();fd.append('image',file);try{const d=await postImage('/api/ocr',fd);openSheet('utilitySheet');$('utilityTitle').textContent='ছবি থেকে লেখা';$('utilityText').textContent='OCR ফলাফল';$('ocrOutput').textContent=d.text||'কোনো লেখা পাওয়া যায়নি';$('ocrOutput').classList.remove('hidden')}catch(e){toast(e.message)}}
 else toast('এই টুলটি UI-তে প্রস্তুত; API module পরে যুক্ত করা যাবে')
}
function openUpload(mode){utilityMode=mode;openSheet('utilitySheet');if(mode==='remove'&&$('bgProvider'))$('bgProvider').value='auto';$('utilityTitle').textContent=mode==='ocr'?'ছবি থেকে লেখা':mode==='remove'?'ব্যাকগ্রাউন্ড রিমুভ':mode==='compress'?'ইমেজ কমপ্রেস':'ইমেজ টুল';$('utilityText').textContent='একটি ছবি আপলোড করুন';$('ocrOutput').classList.add('hidden');$('bgProviderRow')?.classList.toggle('hidden',mode!=='remove')}
const sizes=[['২×২ ইঞ্চি','পাসপোর্ট/আইডি'],['৩৫×৪৫ মিমি','স্ট্যান্ডার্ড'],['৪০×৬০ মিমি','ভিসা'],['৪০×৫০ মিমি','ডকুমেন্ট'],['৩৫×৫০ মিমি','অন্যান্য']];
$('sizeGrid').innerHTML=sizes.map((s,i)=>`<button class="${i===0?'selected':''}" onclick="selectSize(this)"><b>${s[0]}</b><br><span>${s[1]}</span></button>`).join('');
function selectSize(el){document.querySelectorAll('.size-grid button').forEach(x=>x.classList.remove('selected'));el.classList.add('selected');toast('ছবির মাপ নির্বাচিত হয়েছে')}
document.querySelectorAll('.clothes-grid button').forEach(b=>b.onclick=()=>{document.querySelectorAll('.clothes-grid button').forEach(x=>x.classList.remove('selected'));b.classList.add('selected')});
document.querySelectorAll('.colors button').forEach(b=>b.onclick=()=>{document.querySelectorAll('.colors button').forEach(x=>x.classList.remove('selected'));b.classList.add('selected')});
window.addEventListener('resize',()=>{if(!$('cropModal').classList.contains('hidden'))drawCrop()});
window.addEventListener('load',async()=>{applyPreset('passport');try{const d=await fetch('/api/health').then(r=>r.json());window.services=d.services}catch{}});
