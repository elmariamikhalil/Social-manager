const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { generateMarketingPlan } = require('../services/aiService');

// GET /api/marketing - List plans
router.get('/', (req, res) => {
  const plans = db.prepare('SELECT * FROM marketing_plans ORDER BY created_at DESC').all();
  res.json({ plans });
});

// GET /api/marketing/:id
router.get('/:id', (req, res) => {
  const plan = db.prepare('SELECT * FROM marketing_plans WHERE id = ?').get(req.params.id);
  if (!plan) return res.status(404).json({ error: 'Plan not found' });
  res.json(plan);
});

// POST /api/marketing/generate
router.post('/generate', async (req, res) => {
  const { period = '30 days', platforms = ['instagram', 'facebook'], goals } = req.body;

  try {
    const brand = db.prepare('SELECT * FROM brand_profiles WHERE id = 1').get();
    if (!brand) return res.status(400).json({ error: 'Brand profile not configured' });

    // Get top trends for context
    const trends = db.prepare('SELECT * FROM trend_snapshots ORDER BY score DESC LIMIT 10').all();

    const aiResult = await generateMarketingPlan(trends, brand, { period, platforms, goals });

    const result = db.prepare(`
      INSERT INTO marketing_plans (title, period, goals, strategy, platforms)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      `${period} Marketing Plan — ${new Date().toLocaleDateString()}`,
      period,
      goals || `Grow ${brand.name} social media presence to maximum reach`,
      aiResult.text,
      JSON.stringify(platforms)
    );

    const plan = db.prepare('SELECT * FROM marketing_plans WHERE id = ?').get(result.lastInsertRowid);
    res.json({ success: true, plan });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/marketing/:id
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM marketing_plans WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
