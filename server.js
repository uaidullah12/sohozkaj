import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import OpenAI from 'openai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = Number(process.env.PORT || 3000);
const upload = multer({
  dest: path.join(__dirname, '.tmp'),
  limits: { fileSize: 60 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype);
    cb(ok ? null : new Error('শুধু JPG, PNG বা WEBP ছবি গ্রহণ করা হচ্ছে।'), ok);
  }
});

fs.mkdirSync(path.join(__dirname, '.tmp'), { recursive: true });
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

function cleanup(file) { if (file?.path) fs.promises.unlink(file.path).catch(() => {}); }
function requireKey(key, label) {
  if (!key) throw new Error(`${label} API key সেট করা নেই। .env ফাইলে key দিন।`);
}

app.get('/api/health', (_req, res) => res.json({
  ok: true,
  services: {
    openai: Boolean(process.env.OPENAI_API_KEY),
    cutoutpro: Boolean(process.env.CUTOUT_PRO_API_KEY),
    removebg: Boolean(process.env.REMOVE_BG_API_KEY),
    vision: Boolean(process.env.GOOGLE_VISION_API_KEY)
  }
}));

app.post('/api/ai-edit', upload.single('image'), async (req, res) => {
  try {
    requireKey(process.env.OPENAI_API_KEY, 'OpenAI');
    if (!req.file) return res.status(400).json({ ok: false, error: 'একটি ছবি আপলোড করুন।' });
    const prompt = String(req.body.prompt || 'ছবিটি পরিষ্কার, প্রাকৃতিক ও প্রফেশনালভাবে উন্নত করুন। মুখের পরিচয় ও স্বাভাবিক বৈশিষ্ট্য অক্ষুণ্ণ রাখুন।');
    const size = ['auto', '1024x1024', '1024x1536', '1536x1024'].includes(req.body.size) ? req.body.size : 'auto';
    const quality = ['auto', 'low', 'medium', 'high'].includes(req.body.quality) ? req.body.quality : 'auto';
    const background = ['auto', 'transparent', 'opaque'].includes(req.body.background) ? req.body.background : 'auto';

    const result = await openai.images.edit({
      model: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1',
      image: fs.createReadStream(req.file.path),
      prompt,
      size,
      quality,
      background,
      input_fidelity: 'high'
    });
    const b64 = result.data?.[0]?.b64_json;
    if (!b64) throw new Error('AI থেকে ছবি পাওয়া যায়নি।');
    res.json({ ok: true, image: `data:image/png;base64,${b64}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err?.message || 'AI edit ব্যর্থ হয়েছে।' });
  } finally { cleanup(req.file); }
});

app.post('/api/remove-bg', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ ok: false, error: 'একটি ছবি আপলোড করুন।' });
    const provider = ['cutoutpro', 'removebg'].includes(String(req.body.provider || 'cutoutpro')) ? String(req.body.provider || 'cutoutpro') : 'cutoutpro';
    let response;
    const bytes = fs.readFileSync(req.file.path);

    if (provider === 'removebg') {
      requireKey(process.env.REMOVE_BG_API_KEY, 'remove.bg');
      const form = new FormData();
      form.append('image_file', new Blob([bytes], { type: req.file.mimetype }), req.file.originalname);
      form.append('size', String(req.body.size || 'auto'));
      form.append('format', 'png');
      response = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: { 'X-Api-Key': process.env.REMOVE_BG_API_KEY },
        body: form
      });
    } else {
      requireKey(process.env.CUTOUT_PRO_API_KEY, 'Cutout.Pro');
      const form = new FormData();
      form.append('file', new Blob([bytes], { type: req.file.mimetype }), req.file.originalname);
      response = await fetch('https://www.cutout.pro/api/v1/matting?mattingType=6&crop=true', {
        method: 'POST',
        headers: { 'APIKEY': process.env.CUTOUT_PRO_API_KEY },
        body: form
      });
    }

    const contentType = response.headers.get('content-type') || '';
    if (!response.ok) {
      const text = await response.text();
      let message = text;
      try { const j = JSON.parse(text); message = j?.msg || j?.message || j?.errors?.[0]?.title || text; } catch {}
      throw new Error(`${provider === 'removebg' ? 'remove.bg' : 'Cutout.Pro'}: ${message}`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    const mime = contentType.includes('webp') ? 'image/webp' : contentType.includes('jpeg') || contentType.includes('jpg') ? 'image/jpeg' : 'image/png';
    res.json({ ok: true, provider, image: `data:${mime};base64,${buffer.toString('base64')}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err?.message || 'ব্যাকগ্রাউন্ড রিমুভ ব্যর্থ হয়েছে।' });
  } finally { cleanup(req.file); }
});

app.post('/api/ocr', upload.single('image'), async (req, res) => {
  try {
    requireKey(process.env.GOOGLE_VISION_API_KEY, 'Google Vision');
    if (!req.file) return res.status(400).json({ ok: false, error: 'একটি ছবি আপলোড করুন।' });
    const content = fs.readFileSync(req.file.path).toString('base64');
    const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${encodeURIComponent(process.env.GOOGLE_VISION_API_KEY)}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests: [{ image: { content }, features: [{ type: 'DOCUMENT_TEXT_DETECTION' }] }] })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.error?.message || 'OCR request failed');
    const text = data?.responses?.[0]?.fullTextAnnotation?.text || data?.responses?.[0]?.textAnnotations?.[0]?.description || '';
    res.json({ ok: true, text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err?.message || 'OCR ব্যর্থ হয়েছে।' });
  } finally { cleanup(req.file); }
});

app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ ok: false, error: 'ছবির আকার সর্বোচ্চ 60MB হতে পারবে।' });
  res.status(400).json({ ok: false, error: err?.message || 'অনুরোধটি গ্রহণ করা যায়নি।' });
});

app.use((_req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.listen(PORT, () => console.log(`সহজ কাজ চলছে: http://localhost:${PORT}`));
