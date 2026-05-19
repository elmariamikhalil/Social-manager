const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET /api/settings/brand
router.get('/brand', (req, res) => {
  const brand = db.prepare('SELECT * FROM brand_profiles WHERE id = 1').get();
  if (brand) brand.keywords = JSON.parse(brand.keywords || '[]');
  res.json(brand);
});

// PUT /api/settings/brand
router.put('/brand', (req, res) => {
  const { name, niche, tone, target_audience, keywords, posting_frequency, auto_publish } = req.body;
  
  db.prepare(`
    UPDATE brand_profiles SET
      name = COALESCE(?, name),
      niche = COALESCE(?, niche),
      tone = COALESCE(?, tone),
      target_audience = COALESCE(?, target_audience),
      keywords = COALESCE(?, keywords),
      posting_frequency = COALESCE(?, posting_frequency),
      auto_publish = COALESCE(?, auto_publish),
      updated_at = datetime('now')
    WHERE id = 1
  `).run(
    name || null,
    niche || null,
    tone || null,
    target_audience || null,
    keywords ? JSON.stringify(keywords) : null,
    posting_frequency || null,
    auto_publish !== undefined ? (auto_publish ? 1 : 0) : null
  );

  const updated = db.prepare('SELECT * FROM brand_profiles WHERE id = 1').get();
  updated.keywords = JSON.parse(updated.keywords || '[]');
  res.json(updated);
});

// GET /api/settings/api-status - Check which APIs are configured
router.get('/api-status', (req, res) => {
  res.json({
    gemini: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here'),
    openai: !!(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here'),
    meta: !!(process.env.META_APP_ID && process.env.META_APP_ID !== 'your_meta_app_id'),
    reddit: !!(process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_ID !== 'your_reddit_client_id'),
    serpapi: !!(process.env.SERPAPI_KEY && process.env.SERPAPI_KEY !== 'your_serpapi_key_here'),
    ai_provider: process.env.AI_PROVIDER || 'gemini',
  });
});

module.exports = router;
