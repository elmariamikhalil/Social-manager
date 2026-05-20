const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { generateSocialPost, generateImagePrompt, scoreContentIdea, generateImage } = require('../services/aiService');

// GET /api/content - List all content
router.get('/', (req, res) => {
  const { status, platform, limit = 50, offset = 0 } = req.query;
  let query = `
    SELECT c.*, 
           sa.account_name, sa.platform as account_platform,
           (SELECT post_url FROM publish_logs WHERE content_id = c.id AND status = 'published' ORDER BY timestamp DESC LIMIT 1) as post_url
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

    // Surface rate limit errors clearly to the client
    if (aiResult.error === 'rate_limit') {
      return res.status(429).json({
        error: aiResult.message,
        retry_after: aiResult.retryAfter,
        hint: 'Gemini free tier quota exceeded. Wait a minute and try again, or add billing at console.cloud.google.com',
      });
    }

    const imagePromptResult = await generateImagePrompt(aiResult.text, brand);

    // Generate actual image using Imagen 4
    let imageUrl = null;
    if (imagePromptResult?.text) {
      imageUrl = await generateImage(imagePromptResult.text);
    }

    // Auto-extract hashtags
    const hashtagMatches = aiResult.text?.match(/#\w+/g) || [];

    // Save as draft
    const result = db.prepare(`
      INSERT INTO content_items (title, body, platform, hashtags, image_prompt, image_url, trend_id, account_id, ai_model, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')
    `).run(
      trend.topic.substring(0, 100),
      aiResult.text,
      platform,
      JSON.stringify(hashtagMatches),
      imagePromptResult?.text || null,
      imageUrl,
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
  try {
    // Delete associated logs first to avoid foreign key constraints
    db.prepare('DELETE FROM publish_logs WHERE content_id = ?').run(req.params.id);
    db.prepare('DELETE FROM content_items WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/content/:id/insights - Fetch live stats from Meta
router.get('/:id/insights', async (req, res) => {
  try {
    const log = db.prepare("SELECT post_id, account_id, platform FROM publish_logs WHERE content_id = ? AND status = 'published' ORDER BY timestamp DESC LIMIT 1").get(req.params.id);
    if (!log || !log.post_id || log.post_id.startsWith('demo_')) {
      return res.json({ likes: 0, comments: 0, shares: 0, reach: 0, mock: true });
    }

    const account = db.prepare('SELECT * FROM social_accounts WHERE id = ?').get(log.account_id);
    if (!account) return res.json({ likes: 0, comments: 0, shares: 0, reach: 0 });

    const { getFacebookPostInsights, getInstagramPostInsights } = require('../services/metaService');
    
    let stats = { likes: 0, comments: 0, shares: 0, reach: 0 };
    if (log.platform === 'facebook') {
      stats = await getFacebookPostInsights(log.post_id, account.access_token);
    } else if (log.platform === 'instagram') {
      stats = await getInstagramPostInsights(log.post_id, account.access_token);
    }
    
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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
  let { scheduled_at } = req.body;
  
  if (!scheduled_at) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    scheduled_at = tomorrow.toISOString();
  }

  db.prepare(`
    UPDATE content_items SET status = 'queued', scheduled_at = ?, updated_at = datetime('now') WHERE id = ?
  `).run(scheduled_at, req.params.id);
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
