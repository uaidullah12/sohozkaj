# সহজ কাজ — SOHOZKAJ Photo Crop & Join Upgrade

এই আপডেটটি বিদ্যমান SOHOZKAJ অ্যাপের উপর করা হয়েছে—পুরনো AI Edit, Background Remove, OCR API ও অন্যান্য UI flow সরানো হয়নি।

## নতুন ফটো প্রসেসিং সুবিধা

- একক ছবি স্বাধীনভাবে নির্দিষ্ট aspect ratio-তে ক্রপ
- দুইটি আলাদা ছবি আপলোড ও আলাদাভাবে ক্রপ
- বাংলা preset: Passport, Visa, NID, Job Application, Birth Certificate, 2×2 inch, 35×45 mm, 40×50 mm, 3.5×4.5 cm এবং Custom
- Width / Height + px, mm, cm, inch
- Drag/pan, zoom in/out, rotate, reset, live preview
- স্মার্ট/AI crop option; browser FaceDetector থাকলে মুখের অবস্থান বিবেচনা করে framing
- "জোড়া ছবি তৈরি করুন": বাম/ডান, সমান sizing, alignment, spacing, no-stretch rendering
- Final joined output exact pixel dimensions; physical units 300 DPI-তে px-এ রূপান্তর
- Original / White / Transparent / Custom background
- Print-ready PNG output ও print action
- বাংলা final actions: ডাউনলোড, আবার জেনারেট, প্রিন্ট, ইমেজ রিসাইজ ও এডিট, মুছে ফেলুন
- Android ও desktop responsive crop modal

## চালু করুন

1. Node.js 20+ ইনস্টল করুন
2. এই folder-এ terminal খুলুন
3. `npm install`
4. `.env.example` কপি করে `.env` করুন
5. প্রয়োজনীয় API key দিন
6. `npm start`
7. Browser-এ `http://localhost:3000`

## গুরুত্বপূর্ণ

- Existing API routes unchanged রাখা হয়েছে।
- API keys frontend-এ রাখা হয়নি।
- Crop/join processing browser canvas-এ হয়; মূল uploaded file পরিবর্তন করা হয় না।
- Final physical sizes are rendered at 300 DPI for print-oriented output.

## মোবাইল/ক্রপ ফিক্স
- এডিটর স্ক্রিনে নিচের সাদা গ্লোবাল ন্যাভিগেশন বার লুকানো থাকে; ক্রপ/এডিট কন্ট্রোল নিচে ঠিকভাবে থাকে।
- ইউটিলিটি আপলোডের জন্য আলাদা file input আছে, তাই ব্যাকগ্রাউন্ড রিমুভ ও OCR এখন সঠিক ফাইলে কাজ করে।
- Background Remove-এ Auto provider প্রথমে Cutout.Pro, প্রয়োজনে remove.bg চেষ্টা করে।
- Crop width/height হাতে লেখা যায় এবং লক করা অনুপাত স্বয়ংক্রিয়ভাবে বজায় থাকে।
- দুই আঙুলে pinch zoom এবং এক আঙুলে image pan কাজ করে।
- Two-photo join সমান উচ্চতা/সাইজ, spacing ও proportion বজায় রেখে তৈরি হয়।
