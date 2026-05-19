const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { generateSocialPost, generateImagePrompt, scoreContentIdea } = require('../services/aiService');

// GET /api/content - List all content
router.get('/', (req, res) => {
  const { status, platform, limit = 50, offset = 0 } = req.query;
  let query = `
    SELECT c.*, sa.account_name, sa.platform as account_platform
    FROM content_items c
    LEFT JOIN social_accounts sa ON c.account_id = sa.id
  `;
  const params = [];
  const conditions = [];

  if (status) { conditions.push('c.status = ?'); params.push(status); }
  if (platform) { conditions.push('c.platform = ?'); params.push(platform); }

  if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
  query += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  const items = db.prepare(query).all(...params);
  const total = db.prepare('SELECT COUNT(*) as count FROM content_items').get().count;
  res.json({ items, total });
});

// GET /api/content/:id
router.get('/:id', (req, res) => {
  const item = db.prepare('SELECT * FROM content_items WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

// POST /api/content/generate - AI generate content
router.post('/generate', async (req, res) => {
  const { trend_id, platform = 'instagram', account_id, tone_override } = req.body;

  try {
    const brand = db.prepare('SELECT * FROM brand_profiles WHERE id = 1').get();
    if (!brand) return res.status(400).json({ error: 'Brand profile not configured' });

    // Get trend data
    let trend = { topic: 'trending topic', description: '' };
    if (trend_id) {
      trend = db.prepare('SELECT * FROM trend_snapshots WHERE id = ?').get(trend_id) || trend;
    } else if (req.body.topic) {
      trend = { topic: req.body.topic, description: req.body.description || '' };
    }

    if (tone_override) brand.tone = tone_override;

    const aiResult = await generateSocialPost(trend, platform, brand);
    const imagePromptResult = await generateImagePrompt(aiResult.text, brand);

    // Auto-extract hashtags
    const hashtagMatches = aiResult.text.match(/#\w+/g) || [];

    // Save as draft
    const result = db.prepare(`
      INSERT INTO content_items (title, body, platform, hashtags, image_prompt, trend_id, account_id, ai_model, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft')
    `).run(
      trend.topic.substring(0, 100),
      aiResult.text,
      platform,
      JSON.stringify(hashtagMatches),
      imagePromptResult.text,
      trend_id || null,
      account_id || null,
      aiResult.model
    );

    // Mark trend as used
    if (trend_id) {
      db.prepare('UPDATE trend_snapshots SET used_in_content = 1 WHERE id = ?').run(trend_id);
    }

    const newItem = db.prepare('SELECT * FROM content_items WHERE id = ?').get(result.lastInsertRowid);
    res.json({ success: true, item: newItem, ai_model: aiResult.model });
  } catch (err) {
    console.error('Generate error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/content/:id - Update content
router.put('/:id', (req, res) => {
  const { body, status, scheduled_at, account_id, image_url, hashtags } = req.body;
  const updates = [];
  const params = [];

  if (body !== undefined) { updates.push('body = ?'); params.push(body); }
  if (status !== undefined) { updates.push('status = ?'); params.push(status); }
  if (scheduled_at !== undefined) { updates.push('scheduled_at = ?'); params.push(scheduled_at); }
  if (account_id !== undefined) { updates.push('account_id = ?'); params.push(account_id); }
  if (image_url !== undefined) { updates.push('image_url = ?'); params.push(image_url); }
  if (hashtags !== undefined) { updates.push('hashtags = ?'); params.push(JSON.stringify(hashtags)); }

  if (!updates.length) return res.status(400).json({ error: 'No fields to update' });

  updates.push("updated_at = datetime('now')");
  params.push(req.params.id);

  db.prepare(`UPDATE content_items SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  const updated = db.prepare('SELECT * FROM content_items WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// DELETE /api/content/:id
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM content_items WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// POST /api/content/:id/publish
router.post('/:id/publish', async (req, res) => {
  const { publishContent } = require('../services/publishService');
  try {
    const result = await publishContent(parseInt(req.params.id));
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/content/:id/approve - Move draft to queued
router.post('/:id/approve', (req, res) => {
  const { scheduled_at } = req.body;
  db.prepare(`
    UPDATE content_items SET status = 'queued', scheduled_at = ?, updated_at = datetime('now') WHERE id = ?
  `).run(scheduled_at || null, req.params.id);
  const item = db.prepare('SELECT * FROM content_items WHERE id = ?').get(req.params.id);
  res.json(item);
});

// POST /api/content/score - Score a content idea
router.post('/score', async (req, res) => {
  const { topic } = req.body;
  if (!topic) return res.status(400).json({ error: 'topic required' });
  const brand = db.prepare('SELECT * FROM brand_profiles WHERE id = 1').get();
  const score = await scoreContentIdea(topic, brand);
  res.json(score);
});

module.exports = router;
