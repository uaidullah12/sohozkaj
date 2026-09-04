# সহজ কাজ — Full Web App Starter

বাংলা mobile-first photo/document utility app, screenshots অনুযায়ী UI এবং backend API integration সহ।

## চালু করুন

1. Node.js 20+ ইনস্টল করুন
2. এই folder-এ terminal খুলুন
3. `npm install`
4. `.env.example` কপি করে `.env` করুন
5. প্রয়োজনীয় API key দিন
6. `npm start`
7. Browser-এ `http://localhost:3000`

## API

- `POST /api/ai-edit` — OpenAI image editing
- `POST /api/remove-bg` — remove.bg background removal
- `POST /api/ocr` — Google Cloud Vision OCR
- `GET /api/health` — configured services check

API keys কখনও frontend-এ রাখবেন না। `.env` শুধু server-side রাখুন।

## গুরুত্বপূর্ণ

এই version-এ core AI Edit, Background Remove এবং OCR flow wired করা আছে। অন্যান্য UI tools-এর জন্য screen/UI প্রস্তুত রাখা হয়েছে; production-ready করতে আলাদা PDF/document processing, authentication, database, payment/credits এবং job/news data API যুক্ত করতে হবে।
