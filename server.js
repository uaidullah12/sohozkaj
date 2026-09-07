import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import OpenAI from 'openai';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = Number(process.env.PORT || 3000);
const TMP = path.join(__dirname, '.tmp');
const DATA = path.join(__dirname, 'data');
const STORE = path.join(DATA, 'store.json');
fs.mkdirSync(TMP, { recursive: true });
fs.mkdirSync(DATA, { recursive: true });
if (!fs.existsSync(STORE)) fs.copyFileSync(path.join(DATA, 'store.example.json'), STORE);

const upload = multer({ dest: TMP, limits: { fileSize: 60 * 1024 * 1024 }, fileFilter: (_r, f, cb) => cb(null, ['image/jpeg','image/png','image/webp'].includes(f.mimetype)) });
const appJson = express.json({ limit: '4mb' });
app.use(cors()); app.use(appJson); app.use(express.static(path.join(__dirname, 'public')));
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

const readStore = () => JSON.parse(fs.readFileSync(STORE, 'utf8'));
const writeStore = s => fs.writeFileSync(STORE, JSON.stringify(s, null, 2));
const cleanup = f => { if (f?.path) fs.promises.unlink(f.path).catch(()=>{}); };
const key = k => { if (!process.env[k]) throw new Error(`${k} সেট করা নেই। .env ফাইলে key দিন।`); };
const b64 = async (p) => `data:image/png;base64,${(await fs.promises.readFile(p)).toString('base64')}`;

function toolAllowed(id) {
  const s = readStore(); const t = s.tools.find(x => x.id === id);
  if (!t || !t.enabled) throw new Error('এই টুলটি বর্তমানে বন্ধ আছে।');
  return t;
}
function creditCheck(id, userId='demo') {
  const s = readStore(); const t = toolAllowed(id);
  if (s.settings.creditSystem && !t.free && t.creditCost > 0) {
    const u = s.users.find(x=>x.id===userId);
    if (u && !u.unlimited && (u.credit ?? 0) < t.creditCost) throw new Error('পর্যাপ্ত ক্রেডিট নেই।');
    if (u && !u.unlimited) u.credit -= t.creditCost;
    s.usage.push({id:crypto.randomUUID(),userId,tool:id,credit:t.free?0:t.creditCost,at:new Date().toISOString(),status:'success'});
    writeStore(s);
  }
  return t;
}

app.get('/api/health', (_req,res)=>res.json({ok:true,services:{openai:Boolean(process.env.OPENAI_API_KEY),cutout:Boolean(process.env.CUTOUT_PRO_API_KEY),removebg:Boolean(process.env.REMOVEBG_API_KEY),vision:Boolean(process.env.GOOGLE_VISION_API_KEY)}}));
app.get('/api/config', (_req,res)=>{const s=readStore();res.json({ok:true,site:s.settings,tools:s.tools,applications:s.applications,plans:s.plans});});

app.post('/api/ai-edit', upload.single('image'), async (req,res)=>{
  try { creditCheck('ai'); key('OPENAI_API_KEY'); if(!req.file) throw new Error('একটি ছবি আপলোড করুন।');
    const prompt=String(req.body.prompt||'ছবিটি পরিষ্কার ও প্রফেশনাল করুন, মুখের স্বাভাবিক পরিচয় অক্ষুণ্ণ রাখুন।');
    const result=await openai.images.edit({model:process.env.OPENAI_IMAGE_MODEL||'gpt-image-1',image:fs.createReadStream(req.file.path),prompt,size:'auto',quality:['low','medium','high'].includes(req.body.quality)?req.body.quality:'auto',background:'auto',input_fidelity:'high'});
    const out=result.data?.[0]?.b64_json; if(!out) throw new Error('AI থেকে ছবি পাওয়া যায়নি।'); res.json({ok:true,image:`data:image/png;base64,${out}`,original:await b64(req.file.path)});
  } catch(e){res.status(500).json({ok:false,error:e.message});} finally{cleanup(req.file);}
});

async function cutout(filePath, bgcolor='') {
  key('CUTOUT_PRO_API_KEY');
  const form=new FormData(); form.append('file',new Blob([fs.readFileSync(filePath)]),'image.jpg');
  const url='https://www.cutout.pro/api/v1/matting?preview=false'+(bgcolor?`&bgcolor=${encodeURIComponent(bgcolor.replace('#',''))}`:'');
  const r=await fetch(url,{method:'POST',headers:{APIKEY:process.env.CUTOUT_PRO_API_KEY},body:form});
  if(!r.ok) throw new Error(await r.text()); return Buffer.from(await r.arrayBuffer());
}

app.post('/api/remove-bg', upload.single('image'), async(req,res)=>{try{creditCheck('remove'); if(!req.file) throw new Error('একটি ছবি আপলোড করুন।'); const buf=process.env.CUTOUT_PRO_API_KEY?await cutout(req.file.path):await (async()=>{key('REMOVEBG_API_KEY');const form=new FormData();form.append('image_file',new Blob([fs.readFileSync(req.file.path)]),'image.jpg');form.append('size','auto');const r=await fetch('https://api.remove.bg/v1.0/removebg',{method:'POST',headers:{'X-Api-Key':process.env.REMOVEBG_API_KEY},body:form});if(!r.ok)throw new Error(await r.text());return Buffer.from(await r.arrayBuffer());})();res.json({ok:true,image:`data:image/png;base64,${buf.toString('base64')}`});}catch(e){res.status(500).json({ok:false,error:e.message});}finally{cleanup(req.file);}});

app.post('/api/ocr', upload.single('image'), async(req,res)=>{try{creditCheck('ocr');key('GOOGLE_VISION_API_KEY');if(!req.file)throw new Error('একটি ছবি আপলোড করুন।');const content=fs.readFileSync(req.file.path).toString('base64');const r=await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${encodeURIComponent(process.env.GOOGLE_VISION_API_KEY)}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({requests:[{image:{content},features:[{type:'DOCUMENT_TEXT_DETECTION'}]}]})});const d=await r.json();if(!r.ok)throw new Error(d?.error?.message||'OCR ব্যর্থ');res.json({ok:true,text:d?.responses?.[0]?.fullTextAnnotation?.text||''});}catch(e){res.status(500).json({ok:false,error:e.message});}finally{cleanup(req.file);}});

async function clothingEdit(filePath, type='formal suit', full=true) {
  key('OPENAI_API_KEY');
  const prompt=`Change the person's ${full?'entire visible clothing':'selected visible clothing area'} to ${type}. Preserve the exact facial identity, face, hair, skin tone, body proportions and pose. Do not change the background. Do not change the person's gender or age. Photorealistic result.`;
  const r=await openai.images.edit({model:process.env.OPENAI_IMAGE_MODEL||'gpt-image-1',image:fs.createReadStream(filePath),prompt,size:'auto',quality:'auto',background:'auto',input_fidelity:'high'});
  const out=r.data?.[0]?.b64_json;if(!out)throw new Error('পোশাক পরিবর্তনের ছবি পাওয়া যায়নি।');return Buffer.from(out,'base64');
}

app.post('/api/joint-image', upload.fields([{name:'left',maxCount:1},{name:'right',maxCount:1}]), async(req,res)=>{
  const files=[...(req.files?.left||[]),...(req.files?.right||[])];
  try{
    creditCheck('joint'); if(files.length!==2) throw new Error('বাম ও ডান—দুইটি ছবি আপলোড করুন।');
    const clothing=String(req.body.clothingEnabled)==='true'; const bgEnabled=String(req.body.backgroundEnabled)==='true';
    const clothingType=String(req.body.clothingType||'formal suit'); const bg=String(req.body.background||'original');
    let leftBuf=fs.readFileSync(files[0].path), rightBuf=fs.readFileSync(files[1].path);
    if(clothing){ if(!process.env.OPENAI_API_KEY) throw new Error('পোশাক পরিবর্তনের জন্য OPENAI_API_KEY প্রয়োজন।'); const fullClothing=String(req.body.fullClothing)!=='false'; leftBuf=await clothingEdit(files[0].path,clothingType,fullClothing); rightBuf=await clothingEdit(files[1].path,clothingType,fullClothing); }
    if(bgEnabled && process.env.CUTOUT_PRO_API_KEY){
      const lp=path.join(TMP,`${crypto.randomUUID()}-l.png`), rp=path.join(TMP,`${crypto.randomUUID()}-r.png`);await fs.promises.writeFile(lp,leftBuf);await fs.promises.writeFile(rp,rightBuf);leftBuf=await cutout(lp,bg==='original'?'':bg);rightBuf=await cutout(rp,bg==='original'?'':bg);cleanup({path:lp});cleanup({path:rp});
    }
    const targetH=900; const li=await sharp(leftBuf).resize({height:targetH,fit:'inside'}).png().toBuffer(); const ri=await sharp(rightBuf).resize({height:targetH,fit:'inside'}).png().toBuffer();
    const lm=await sharp(li).metadata(), rm=await sharp(ri).metadata(); const w=(lm.width||600)+(rm.width||600);
    let bgColor=bgEnabled&&/^#[0-9a-f]{6}$/i.test(bg)?bg:'#ffffff';
    const out=await sharp({create:{width:w,height:targetH,channels:4,background:bgColor}}).composite([{input:li,left:0,top:0},{input:ri,left:lm.width||600,top:0}]).png().toBuffer();
    res.json({ok:true,originalLeft:`data:${files[0].mimetype};base64,${fs.readFileSync(files[0].path).toString('base64')}`,originalRight:`data:${files[1].mimetype};base64,${fs.readFileSync(files[1].path).toString('base64')}`,generated:`data:image/png;base64,${out.toString('base64')}`,settings:{clothingEnabled:clothing,backgroundEnabled:bgEnabled,background:bg,clothingType}});
  }catch(e){res.status(500).json({ok:false,error:e.message});}finally{files.forEach(cleanup);}
});

// Admin/demo management APIs. Protect with environment credentials.
function adminAuth(req,res,next){const h=req.headers.authorization||'';const token=h.replace('Bearer ','');if(token && token==='demo-admin-session')return next();res.status(401).json({ok:false,error:'Admin login প্রয়োজন।'});}
app.post('/api/admin/login',(req,res)=>{if(req.body?.email===process.env.ADMIN_EMAIL && req.body?.password===process.env.ADMIN_PASSWORD)return res.json({ok:true,token:'demo-admin-session'});res.status(401).json({ok:false,error:'ইমেইল বা পাসওয়ার্ড ভুল।'});});
app.get('/api/admin/state',adminAuth,(_req,res)=>res.json({ok:true,state:readStore()}));
app.put('/api/admin/tools/:id',adminAuth,(req,res)=>{const s=readStore();const t=s.tools.find(x=>x.id===req.params.id);if(!t)return res.status(404).json({ok:false,error:'টুল পাওয়া যায়নি'});Object.assign(t,req.body);writeStore(s);res.json({ok:true,tool:t});});
app.post('/api/admin/applications',adminAuth,(req,res)=>{const s=readStore();const item={id:crypto.randomUUID(),title:req.body.title||'নতুন আবেদন',description:req.body.description||'',url:req.body.url||'',deadline:req.body.deadline||'',enabled:req.body.enabled!==false};s.applications.unshift(item);writeStore(s);res.json({ok:true,item});});
app.put('/api/admin/applications/:id',adminAuth,(req,res)=>{const s=readStore();const x=s.applications.find(a=>a.id===req.params.id);if(!x)return res.status(404).json({ok:false,error:'আবেদন পাওয়া যায়নি'});Object.assign(x,req.body);writeStore(s);res.json({ok:true,item:x});});
app.delete('/api/admin/applications/:id',adminAuth,(req,res)=>{const s=readStore();s.applications=s.applications.filter(a=>a.id!==req.params.id);writeStore(s);res.json({ok:true});});
app.post('/api/admin/users',adminAuth,(req,res)=>{const s=readStore();const u={id:crypto.randomUUID(),name:req.body.name||'নতুন ব্যবহারকারী',email:req.body.email||'',credit:Number(req.body.credit||0),unlimited:Boolean(req.body.unlimited),accessDays:Number(req.body.accessDays||0),createdAt:new Date().toISOString()};s.users.push(u);writeStore(s);res.json({ok:true,user:u});});
app.put('/api/admin/users/:id',adminAuth,(req,res)=>{const s=readStore();const u=s.users.find(x=>x.id===req.params.id);if(!u)return res.status(404).json({ok:false,error:'ইউজার পাওয়া যায়নি'});Object.assign(u,req.body);writeStore(s);res.json({ok:true,user:u});});
app.post('/api/admin/plans',adminAuth,(req,res)=>{const s=readStore();const p={id:crypto.randomUUID(),name:req.body.name||'নতুন প্ল্যান',credit:Number(req.body.credit||0),days:Number(req.body.days||30),unlimited:Boolean(req.body.unlimited),enabled:req.body.enabled!==false};s.plans.push(p);writeStore(s);res.json({ok:true,plan:p});});
app.put('/api/admin/settings',adminAuth,(req,res)=>{const s=readStore();Object.assign(s.settings,req.body);writeStore(s);res.json({ok:true,settings:s.settings});});

app.use((err,_req,res,_next)=>{if(err instanceof multer.MulterError&&err.code==='LIMIT_FILE_SIZE')return res.status(413).json({ok:false,error:'ছবির আকার সর্বোচ্চ 60MB হতে পারবে।'});res.status(400).json({ok:false,error:err?.message||'অনুরোধ গ্রহণ করা যায়নি।'});});
app.use((_req,res)=>res.sendFile(path.join(__dirname,'public','index.html')));
app.listen(PORT,()=>console.log(`সহজ কাজ চলছে: http://localhost:${PORT}`));
