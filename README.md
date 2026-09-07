# সহজ কাজ — Full Updated App v2

এই ZIP-এ আগের AI photo editor-এর সঙ্গে নতুন **Joint Photo, Original Image Preservation, Clothing ON/OFF, Background ON/OFF, Credit/Limit/Unlimited, User Access Days, Plan এবং Admin Panel থেকে Application/Link management** যোগ করা হয়েছে।

## চালানো
1. Node.js 20+ ইনস্টল করুন
2. `npm install`
3. `.env.example` কপি করে `.env` করুন
4. `ADMIN_EMAIL` ও `ADMIN_PASSWORD` পরিবর্তন করুন
5. প্রয়োজনীয় API keys বসান
6. `npm start`
7. ব্রাউজারে `http://localhost:3000`

## API keys
- `OPENAI_API_KEY`: AI edit এবং clothing transformation-এর জন্য
- `CUTOUT_PRO_API_KEY`: background removal-এর জন্য
- `GOOGLE_VISION_API_KEY`: OCR-এর জন্য
- `REMOVEBG_API_KEY`: Cutout.Pro না থাকলে fallback background removal

API key কখনো frontend-এ রাখবেন না।

## Admin
`হিসাব ও সেটিংস → অ্যাডমিন প্যানেল`

Login credentials `.env` থেকে আসে। Admin থেকে:
- Tool ON/OFF
- Credit cost
- Unlimited/Daily/Monthly/Total mode
- User credit ও unlimited access
- Access days
- Plans
- চাকরি/আবেদন link add/edit/delete/ON/OFF
- Site credit system ON/OFF

## Joint Photo
দুইটি original ছবি আলাদা রাখা হয়। Generated result আলাদা। Clothing এবং Background স্বাধীনভাবে ON/OFF করা যায়। Clothing ON হলে OpenAI edit pipeline ব্যবহার করে নির্বাচিত পোশাকের নির্দেশনা পাঠানো হয়। Background ON হলে Cutout.Pro থাকলে subject cutout করে নির্বাচিত background-এ বসানো হয়; এরপর দুইটি ছবি পাশাপাশি natural canvas-এ compose করা হয়।

## Production note
এই v2 starter-এর admin persistence দ্রুত deploy/test করার জন্য `data/store.json`-এ রাখা হয়েছে। Production SaaS-এ PostgreSQL/Prisma migration করার জন্য `data` structure-টি database model-এ নেওয়া উচিত। Upload storage-ও S3-compatible object storage-এ নেওয়া উচিত।
