const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'social_manager.db');
const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initializeDatabase() {
  db.exec(`
    -- Brand profile (single row config)
    CREATE TABLE IF NOT EXISTS brand_profiles (
      id INTEGER PRIMARY KEY,
      name TEXT DEFAULT 'My Brand',
      niche TEXT DEFAULT 'general',
      tone TEXT DEFAULT 'professional',
      target_audience TEXT DEFAULT 'general public',
      keywords TEXT DEFAULT '[]',
      posting_frequency TEXT DEFAULT 'daily',
      auto_publish INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Connected social accounts (OAuth tokens)
    CREATE TABLE IF NOT EXISTS social_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      platform TEXT NOT NULL,
      account_id TEXT NOT NULL,
      account_name TEXT,
      account_username TEXT,
      profile_picture TEXT,
      access_token TEXT NOT NULL,
      refresh_token TEXT,
      token_expires_at TEXT,
      page_id TEXT,
      page_name TEXT,
      is_active INTEGER DEFAULT 1,
      connected_at TEXT DEFAULT (datetime('now')),
      UNIQUE(platform, account_id)
    );

    -- Content items (drafts, queued, published)
    CREATE TABLE IF NOT EXISTS content_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      body TEXT NOT NULL,
      platform TEXT NOT NULL,
      content_type TEXT DEFAULT 'post',
      status TEXT DEFAULT 'draft',
      hashtags TEXT DEFAULT '[]',
      image_prompt TEXT,
      image_url TEXT,
      trend_id INTEGER,
      account_id INTEGER,
      scheduled_at TEXT,
      published_at TEXT,
      ai_model TEXT,
      engagement_score INTEGER DEFAULT 0,
      plan_id INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (account_id) REFERENCES social_accounts(id)
    );

    -- Trending topics cache
    CREATE TABLE IF NOT EXISTS trend_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic TEXT NOT NULL,
      description TEXT,
      score REAL DEFAULT 0,
      source TEXT NOT NULL,
      category TEXT DEFAULT 'general',
      url TEXT,
      used_in_content INTEGER DEFAULT 0,
      captured_at TEXT DEFAULT (datetime('now'))
    );

    -- Publishing history & logs
    CREATE TABLE IF NOT EXISTS publish_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content_id INTEGER NOT NULL,
      account_id INTEGER,
      platform TEXT NOT NULL,
      status TEXT NOT NULL,
      response_data TEXT,
      post_id TEXT,
      post_url TEXT,
      error_message TEXT,
      timestamp TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (content_id) REFERENCES content_items(id)
    );

    -- Follower & reach growth snapshots (per account per day)
    CREATE TABLE IF NOT EXISTS growth_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL,
      followers_count INTEGER DEFAULT 0,
      following_count INTEGER DEFAULT 0,
      posts_count INTEGER DEFAULT 0,
      reach INTEGER DEFAULT 0,
      impressions INTEGER DEFAULT 0,
      profile_views INTEGER DEFAULT 0,
      snapshot_date TEXT DEFAULT (date('now')),
      FOREIGN KEY (account_id) REFERENCES social_accounts(id),
      UNIQUE(account_id, snapshot_date)
    );

    -- AI-generated marketing plans
    CREATE TABLE IF NOT EXISTS marketing_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      period TEXT DEFAULT '30 days',
      goals TEXT,
      strategy TEXT,
      content_calendar TEXT,
      kpis TEXT,
      platforms TEXT,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Cron job configurations
    CREATE TABLE IF NOT EXISTS scheduled_jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      cron_expression TEXT NOT NULL,
      job_type TEXT NOT NULL,
      config TEXT DEFAULT '{}',
      is_active INTEGER DEFAULT 1,
      last_run TEXT,
      next_run TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Seed default brand profile if not exists
    INSERT OR IGNORE INTO brand_profiles (id, name, niche, tone, target_audience, keywords)
    VALUES (1, 'My Brand', 'lifestyle', 'engaging and relatable', 'young adults 18-35', '[]');

    -- Seed default scheduled jobs
    INSERT OR IGNORE INTO scheduled_jobs (name, cron_expression, job_type, config)
    VALUES 
      ('Refresh Trends', '0 */2 * * *', 'refresh_trends', '{"subreddits": ["technology", "marketing", "socialmedia"]}'),
      ('Process Publish Queue', '*/15 * * * *', 'process_queue', '{}'),
      ('Daily Growth Snapshot', '0 9 * * *', 'growth_snapshot', '{}');
  `);

  console.log('✅ Database initialized at', DB_PATH);
}

initializeDatabase();

module.exports = db;
