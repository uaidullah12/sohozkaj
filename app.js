let currentTarget='single';let utilityMode='';let lastImage='';
const $=id=>document.getElementById(id);
function toast(msg){const t=$('toast');t.textContent=msg;t.classList.add('show');clearTimeout(window._toast);window._toast=setTimeout(()=>t.classList.remove('show'),2600)}
function openSheet(id){closeSheets();$('overlay').classList.add('open');$(id).classList.add('open')}
function closeSheets(){document.querySelectorAll('.sheet').forEach(x=>x.classList.remove('open'));$('overlay').classList.remove('open')}
function openQuick(){openSheet('quickSheet')}
function setView(id){document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));$(id).classList.add('active');closeSheets();window.scrollTo(0,0)}
function goHome(){setView('homeView')}
function openEditor(mode='single'){setView('editorView');if(mode==='remove'){utilityMode='remove';$('prompt').value='ব্যাকগ্রাউন্ড পরিষ্কারভাবে সরিয়ে দিন এবং বিষয়টিকে স্বাভাবিক রাখুন।';}else utilityMode='ai'}
function showProfile(){setView('profileView')}
function scrollToTools(){$('toolsTitle').scrollIntoView({behavior:'smooth'})}
function toggleMode(){const dual=$('dualUpload'),single=$('singleUpload');dual.classList.toggle('hidden');single.classList.toggle('hidden')}
function pickImage(target){currentTarget=target;$('fileInput').click()}
$('fileInput').addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;if(f.size>60*1024*1024){toast('ফাইলের আকার 60MB-এর বেশি হতে পারবে না');return}if(currentTarget==='utility'){runUtility(f);return}const url=URL.createObjectURL(f);let box,pre;if(currentTarget==='left'){box=$('leftBox');pre=$('leftPreview')}else if(currentTarget==='right'){box=$('rightBox');pre=$('rightPreview')}else{box=$('singleUpload');pre=$('singlePreview')}pre.src=url;box.classList.add('has-image');toast('ছবি সফলভাবে আপলোড হয়েছে')});
function clearResult(){ $('resultPanel').classList.add('hidden'); $('singleUpload').classList.remove('hidden'); }
function focusPrompt(){openSheet('settingsSheet');setTimeout(()=>$('prompt').focus(),250)}
async function postImage(url,form){const r=await fetch(url,{method:'POST',body:form});const d=await r.json().catch(()=>({}));if(!r.ok||!d.ok)throw new Error(d.error||'অনুরোধ ব্যর্থ হয়েছে');return d}
function selectedImage(){const img=$('singlePreview');if(img.src&&$('singleUpload').classList.contains('has-image'))return img;return null}
async function generateAI(){closeSheets();const img=selectedImage();if(!img){toast('প্রথমে একটি ছবি আপলোড করুন');return}const f=$('fileInput').files[0];if(!f){toast('ছবিটি আবার নির্বাচন করুন');return}toast('AI ছবি তৈরি করছে…');const fd=new FormData();fd.append('image',f);fd.append('prompt',$('prompt').value);fd.append('quality',$('quality').value);fd.append('size','auto');fd.append('background','auto');try{const d=await postImage('/api/ai-edit',fd);showResult(d.image)}catch(e){toast(e.message+' — .env API key পরীক্ষা করুন।')}}
function showResult(src){lastImage=src;$('resultImage').src=src;$('downloadBtn').href=src;$('resultPanel').classList.remove('hidden');$('singleUpload').classList.add('hidden');toast('ফলাফল প্রস্তুত')}
function useResult(){clearResult();toast('আবার এডিট করতে ছবি আপলোড করুন')}
async function runUtility(file){if(utilityMode==='remove'){toast('Background remove হচ্ছে…');const fd=new FormData();fd.append('image',file);try{const d=await postImage('/api/remove-bg',fd);openEditor('single');showResult(d.image)}catch(e){toast(e.message)}}else if(utilityMode==='ocr'){toast('ছবি থেকে লেখা পড়া হচ্ছে…');const fd=new FormData();fd.append('image',file);try{const d=await postImage('/api/ocr',fd);openSheet('utilitySheet');$('utilityTitle').textContent='ছবি থেকে লেখা';$('utilityText').textContent='OCR ফলাফল';$('ocrOutput').textContent=d.text||'কোনো লেখা পাওয়া যায়নি';$('ocrOutput').classList.remove('hidden')}catch(e){toast(e.message)}}else{toast('এই টুলটি UI-তে প্রস্তুত; API module পরে যুক্ত করা যাবে')}}
function openUpload(mode){utilityMode=mode;openSheet('utilitySheet');$('utilityTitle').textContent=mode==='ocr'?'ছবি থেকে লেখা':mode==='remove'?'ব্যাকগ্রাউন্ড রিমুভ':mode==='compress'?'ইমেজ কমপ্রেস':'ইমেজ টুল';$('utilityText').textContent='একটি ছবি আপলোড করুন';$('ocrOutput').classList.add('hidden')}
const sizes=[['২×২ ইঞ্চি','যুক্তরাষ্ট্র (US), ভারত'],['৩৫×৪৫ মিমি','যুক্তরাজ্য (UK), ইউরোপ'],['৪০×৬০ মিমি','সৌদি আরব, কুয়েত'],['৪০×৫০ মিমি','হংকং, কাজাখস্তান'],['৪০×৪০ মিমি','আর্জেন্টিনা, মেক্সিকো'],['৫০×৫০ মিমি','বাহামাস, কোস্টারিকা'],['৫০×৭০ মিমি','কানাডা (PR/ভিসা)'],['৩৮×৪৮ মিমি','চীন'],['৩৫×৫০ মিমি','মালয়েশিয়া'],['৩৬×৪৭ মিমি','আলবেনিয়া'],['৩৮×৪৮ মিমি','কাতার'],['৫০×৬০ মিমি','তুরস্ক']];
$('sizeGrid').innerHTML=sizes.map((s,i)=>`<button class="${i===0?'selected':''}" onclick="selectSize(this)"><b>${s[0]}</b><br><span>${s[1]}</span></button>`).join('');
function selectSize(el){document.querySelectorAll('.size-grid button').forEach(x=>x.classList.remove('selected'));el.classList.add('selected');toast('ছবির মাপ নির্বাচিত হয়েছে')}
document.querySelectorAll('.clothes-grid button').forEach(b=>b.onclick=()=>{document.querySelectorAll('.clothes-grid button').forEach(x=>x.classList.remove('selected'));b.classList.add('selected')});document.querySelectorAll('.colors button').forEach(b=>b.onclick=()=>{document.querySelectorAll('.colors button').forEach(x=>x.classList.remove('selected'));b.classList.add('selected')});
window.addEventListener('load',async()=>{try{const d=await fetch('/api/health').then(r=>r.json());window.services=d.services}catch{}});
