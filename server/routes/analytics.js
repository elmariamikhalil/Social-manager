const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET /api/analytics/overview - Dashboard overview stats
router.get('/overview', (req, res) => {
  const publishStats = db.prepare(`
    SELECT 
      COUNT(*) as total_content,
      SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published,
      SUM(CASE WHEN status = 'queued' THEN 1 ELSE 0 END) as queued,
      SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as drafts,
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
    FROM content_items
  `).get();

  const accountCount = db.prepare('SELECT COUNT(*) as count FROM social_accounts WHERE is_active = 1').get().count;
  const trendCount = db.prepare('SELECT COUNT(*) as count FROM trend_snapshots').get().count;
  const planCount = db.prepare('SELECT COUNT(*) as count FROM marketing_plans').get().count;

  // Latest follower counts per account
  const latestGrowth = db.prepare(`
    SELECT sa.platform, sa.account_username, gs.followers_count, gs.reach, gs.impressions
    FROM growth_snapshots gs
    JOIN social_accounts sa ON gs.account_id = sa.id
    WHERE gs.snapshot_date = (
      SELECT MAX(snapshot_date) FROM growth_snapshots gs2 WHERE gs2.account_id = gs.account_id
    )
  `).all();

  const totalFollowers = latestGrowth.reduce((sum, a) => sum + (a.followers_count || 0), 0);

  // Published per day (last 7 days)
  const publishedByDay = db.prepare(`
    SELECT date(published_at) as date, COUNT(*) as count, platform
    FROM content_items
    WHERE status = 'published' AND published_at >= date('now', '-7 days')
    GROUP BY date(published_at), platform
    ORDER BY date ASC
  `).all();

  res.json({
    stats: {
      ...publishStats,
      account_count: accountCount,
      trend_count: trendCount,
      plan_count: planCount,
      total_followers: totalFollowers,
    },
    growth: latestGrowth,
    published_by_day: publishedByDay,
  });
});

// GET /api/analytics/growth - Follower growth over time
router.get('/growth', (req, res) => {
  const { account_id, days = 30 } = req.query;

  let query = `
    SELECT gs.*, sa.platform, sa.account_username, sa.account_name
    FROM growth_snapshots gs
    JOIN social_accounts sa ON gs.account_id = sa.id
    WHERE gs.snapshot_date >= date('now', '-${parseInt(days)} days')
  `;
  const params = [];

  if (account_id) {
    query += ' AND gs.account_id = ?';
    params.push(account_id);
  }

  query += ' ORDER BY gs.account_id, gs.snapshot_date ASC';

  const snapshots = db.prepare(query).all(...params);
  res.json({ snapshots });
});

// GET /api/analytics/content - Content performance
router.get('/content', (req, res) => {
  const { days = 30 } = req.query;

  const byPlatform = db.prepare(`
    SELECT platform, COUNT(*) as count, 
    SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published
    FROM content_items
    WHERE created_at >= date('now', '-${parseInt(days)} days')
    GROUP BY platform
  `).all();

  const byStatus = db.prepare(`
    SELECT status, COUNT(*) as count
    FROM content_items
    GROUP BY status
  `).all();

  const recent = db.prepare(`
    SELECT c.*, pl.post_url, pl.status as publish_status
    FROM content_items c
    LEFT JOIN publish_logs pl ON pl.content_id = c.id
    WHERE c.status = 'published'
    ORDER BY c.published_at DESC
    LIMIT 10
  `).all();

  res.json({ by_platform: byPlatform, by_status: byStatus, recent_published: recent });
});

// GET /api/analytics/trends-used - Trends that generated content
router.get('/trends-used', (req, res) => {
  const trends = db.prepare(`
    SELECT ts.topic, ts.source, ts.score, ts.captured_at, COUNT(ci.id) as content_generated
    FROM trend_snapshots ts
    LEFT JOIN content_items ci ON ci.trend_id = ts.id
    WHERE ts.used_in_content = 1
    GROUP BY ts.id
    ORDER BY content_generated DESC, ts.score DESC
    LIMIT 20
  `).all();
  res.json({ trends });
});

// POST /api/analytics/growth/simulate - Add demo growth data
router.post('/growth/simulate', (req, res) => {
  const accounts = db.prepare('SELECT * FROM social_accounts WHERE is_active = 1').all();
  
  if (accounts.length === 0) {
    return res.status(400).json({ error: 'No active accounts. Add a demo account first.' });
  }

  const days = parseInt(req.body.days) || 30;
  
  for (const account of accounts) {
    let followers = Math.floor(Math.random() * 50) + 10;
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      followers += Math.floor(Math.random() * 20) + (i < 15 ? 5 : 1);
      
      db.prepare(`
        INSERT OR REPLACE INTO growth_snapshots 
        (account_id, followers_count, following_count, posts_count, reach, impressions, profile_views, snapshot_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        account.id,
        followers,
        Math.floor(followers * 0.4),
        Math.floor(i === days ? 0 : (days - i) * 0.5),
        Math.floor(Math.random() * 800) + 200,
        Math.floor(Math.random() * 1500) + 300,
        Math.floor(Math.random() * 100) + 30,
        dateStr
      );
    }
  }

  res.json({ success: true, message: `Simulated ${days} days of growth for ${accounts.length} accounts` });
});

module.exports = router;
