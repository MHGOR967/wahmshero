/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  WAHM SHERLOCK V70 — Golden Lens Edition                       ║
 * ║  Node.js Server — Reverse Image Search Engine                  ║
 * ║  Website: wa7m.com                                              ║
 * ║  Version: 7.0.0 — Build 2026                                   ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { reverseImageSearch } from './services/imageSearchService.js';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// ─── MIDDLEWARE ─────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ─── MULTER CONFIGURATION ───────────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('نوع الملف غير مدعوم'));
    }
  }
});

// ─── ROUTES ─────────────────────────────────────────────────────────

// الصفحة الرئيسية
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API: رفع الصورة والبحث
app.post('/api/search', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'لم يتم رفع صورة' 
      });
    }

    console.log(`[WAHM] جاري البحث عن الصورة: ${req.file.originalname}`);

    // تحويل الصورة إلى base64
    const imageBase64 = req.file.buffer.toString('base64');
    const imageDataUrl = `data:${req.file.mimetype};base64,${imageBase64}`;

    // البحث العكسي
    const results = await reverseImageSearch(imageDataUrl, req.file.originalname);

    res.json({
      success: true,
      results: results,
      count: results.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[WAHM] خطأ في البحث:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'حدث خطأ أثناء البحث'
    });
  }
});

// API: البحث عبر رابط صورة
app.post('/api/search-url', express.json(), async (req, res) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        error: 'يرجى إدخال رابط الصورة'
      });
    }

    console.log(`[WAHM] جاري البحث عن الصورة من الرابط: ${imageUrl}`);

    // البحث العكسي
    const results = await reverseImageSearch(imageUrl, 'url-image');

    res.json({
      success: true,
      results: results,
      count: results.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[WAHM] خطأ في البحث:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'حدث خطأ أثناء البحث'
    });
  }
});

// API: صحة الخادم
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '7.0.0',
    timestamp: new Date().toISOString()
  });
});

// ─── ERROR HANDLING ─────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[WAHM] Error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'خطأ في الخادم'
  });
});

// ─── START SERVER ───────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════════╗
║  WAHM SHERLOCK V70 — Golden Lens Edition                       ║
║  Reverse Image Search Engine — Node.js                         ║
║  ─────────────────────────────────────────────────────────────  ║
║  🚀 الخادم يعمل على: http://localhost:${PORT}                   ║
║  📝 الإصدار: 7.0.0                                              ║
║  🌐 الموقع: wa7m.com                                            ║
╚══════════════════════════════════════════════════════════════════╝
  `);
});
