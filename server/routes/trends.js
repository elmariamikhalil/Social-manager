const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { fetchAllTrends } = require('../services/trendService');

// GET /api/trends - Latest cached trends
router.get('/', (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  const source = req.query.source;

  let query = 'SELECT * FROM trend_snapshots';
  const params = [];

  if (source) {
    query += ' WHERE source = ?';
    params.push(source);
  }

  query += ' ORDER BY captured_at DESC, score DESC LIMIT ?';
  params.push(limit);

  const trends = db.prepare(query).all(...params);
  res.json({ trends, total: trends.length });
});

// POST /api/trends/refresh - Force refresh
router.post('/refresh', async (req, res) => {
  try {
    const trends = await fetchAllTrends(req.body.config || {});

    const insert = db.prepare(
      'INSERT INTO trend_snapshots (topic, description, score, source, category, url) VALUES (?, ?, ?, ?, ?, ?)'
    );
    const insertMany = db.transaction((items) => {
      for (const t of items) {
        insert.run(t.topic, t.description || '', t.score, t.source, t.category || 'general', t.url || '');
      }
    });
    insertMany(trends);

    res.json({ success: true, count: trends.length, trends });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
