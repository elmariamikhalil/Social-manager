const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { getJobStatus, triggerJobNow } = require('../services/schedulerService');

// GET /api/schedule - All jobs
router.get('/', (req, res) => {
  const jobs = getJobStatus();
  res.json({ jobs });
});

// POST /api/schedule/:id/trigger - Run job now
router.post('/:id/trigger', async (req, res) => {
  try {
    const result = await triggerJobNow(parseInt(req.params.id));
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/schedule/:id/toggle - Enable/disable job
router.put('/:id/toggle', (req, res) => {
  db.prepare('UPDATE scheduled_jobs SET is_active = NOT is_active WHERE id = ?').run(req.params.id);
  const job = db.prepare('SELECT * FROM scheduled_jobs WHERE id = ?').get(req.params.id);
  res.json(job);
});

// GET /api/schedule/queue - Content publish queue
router.get('/queue', (req, res) => {
  const queue = db.prepare(`
    SELECT c.*, sa.account_name, sa.platform as account_platform, sa.account_username
    FROM content_items c
    LEFT JOIN social_accounts sa ON c.account_id = sa.id
    WHERE c.status IN ('queued', 'draft')
    ORDER BY c.scheduled_at ASC, c.created_at DESC
    LIMIT 20
  `).all();
  res.json({ queue });
});

module.exports = router;
