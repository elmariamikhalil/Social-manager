const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { generateMarketingPlan, extractContentIdeasFromPlan } = require('../services/aiService');

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

// POST /api/marketing/:id/launch — Convert plan into scheduled content items
router.post('/:id/launch', async (req, res) => {
  const plan = db.prepare('SELECT * FROM marketing_plans WHERE id = ?').get(req.params.id);
  if (!plan) return res.status(404).json({ error: 'Plan not found' });

  try {
    const brand = db.prepare('SELECT * FROM brand_profiles WHERE id = 1').get();
    if (!brand) return res.status(400).json({ error: 'Brand profile not configured' });

    console.log(`🚀 Launching marketing plan "${plan.title}"...`);

    // Extract content ideas from the plan strategy using AI
    const ideas = await extractContentIdeasFromPlan(plan, brand);
    console.log(`💡 Extracted ${ideas.length} content ideas from plan`);

    // Save each idea as a queued content item
    const insertStmt = db.prepare(`
      INSERT INTO content_items (title, body, platform, status, hashtags, ai_model, scheduled_at, plan_id)
      VALUES (?, ?, ?, 'queued', ?, 'plan-launch', ?, ?)
    `);

    const created = [];
    let daysOffset = 0; // start today
    for (const idea of ideas) {
      if (!idea.body || !idea.platform) continue;
      
      const scheduledAt = new Date();
      scheduledAt.setDate(scheduledAt.getDate() + daysOffset);
      scheduledAt.setHours(9 + (daysOffset % 4), 0, 0, 0); // Stagger times slightly
      
      const result = insertStmt.run(
        idea.topic || `${plan.title} — ${idea.platform}`,
        idea.body,
        idea.platform,
        JSON.stringify(idea.hashtags || []),
        scheduledAt.toISOString(),
        plan.id
      );
      created.push(result.lastInsertRowid);
      daysOffset++; // Next post goes on the next day
    }

    // Mark plan as launched
    db.prepare("UPDATE marketing_plans SET status = 'launched' WHERE id = ?").run(plan.id);

    console.log(`✅ Plan launched: created & scheduled ${created.length} content items`);
    res.json({ success: true, created: created.length, item_ids: created });
  } catch (err) {
    console.error('❌ Plan launch error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/marketing/:id
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM marketing_plans WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// GET /api/marketing/:id/content — Fetch all generated content for this plan
router.get('/:id/content', (req, res) => {
  try {
    const items = db.prepare('SELECT * FROM content_items WHERE plan_id = ? ORDER BY scheduled_at ASC, created_at ASC').all(req.params.id);
    res.json({ items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
