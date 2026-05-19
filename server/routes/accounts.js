const express = require('express');
const router = express.Router();
const db = require('../db/database');
const metaService = require('../services/metaService');

const isMetaConfigured = () =>
  process.env.META_APP_ID && process.env.META_APP_ID !== 'your_meta_app_id';

// GET /api/accounts - List connected accounts
router.get('/', (req, res) => {
  const accounts = db.prepare('SELECT id, platform, account_name, account_username, profile_picture, page_name, is_active, connected_at FROM social_accounts').all();
  res.json({ accounts, meta_configured: isMetaConfigured() });
});

// GET /api/accounts/meta/auth-url - Get OAuth URL for Meta
router.get('/meta/auth-url', (req, res) => {
  if (!isMetaConfigured()) {
    return res.json({
      demo_mode: true,
      message: 'Meta App credentials not configured. Using demo mode.',
      auth_url: null,
    });
  }
  const authUrl = metaService.getMetaAuthUrl();
  res.json({ auth_url: authUrl });
});

// GET /api/accounts/meta/callback - OAuth callback from Meta
router.get('/meta/callback', async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    return res.redirect(`${process.env.CLIENT_URL}/accounts?error=${encodeURIComponent(error)}`);
  }

  try {
    // Exchange code for short-lived token
    const tokenData = await metaService.exchangeCodeForToken(code);
    // Exchange for long-lived token
    const longToken = await metaService.getLongLivedToken(tokenData.access_token);
    // Get user profile
    const profile = await metaService.getUserProfile(longToken.access_token);
    // Get user's pages
    const pages = await metaService.getUserPages(longToken.access_token);

    for (const page of pages) {
      // Get Instagram account linked to page
      const igAccount = await metaService.getInstagramAccount(page.id, page.access_token);

      // Save Facebook Page account
      db.prepare(`
        INSERT OR REPLACE INTO social_accounts 
        (platform, account_id, account_name, account_username, profile_picture, access_token, page_id, page_name)
        VALUES ('facebook', ?, ?, ?, ?, ?, ?, ?)
      `).run(
        `fb_${page.id}`,
        profile.name,
        page.name,
        page.picture?.data?.url || null,
        page.access_token,
        page.id,
        page.name
      );

      // Save Instagram Business account if connected
      if (igAccount) {
        db.prepare(`
          INSERT OR REPLACE INTO social_accounts
          (platform, account_id, account_name, account_username, profile_picture, access_token, page_id, page_name)
          VALUES ('instagram', ?, ?, ?, ?, ?, ?, ?)
        `).run(
          igAccount.id,
          igAccount.name || profile.name,
          igAccount.username || '',
          igAccount.profile_picture_url || null,
          page.access_token, // IG uses the page token
          page.id,
          page.name
        );
      }
    }

    res.redirect(`${process.env.CLIENT_URL}/accounts?success=true`);
  } catch (err) {
    console.error('Meta OAuth error:', err.message);
    res.redirect(`${process.env.CLIENT_URL}/accounts?error=${encodeURIComponent(err.message)}`);
  }
});

// POST /api/accounts/demo - Add a demo account
router.post('/demo', (req, res) => {
  const { platform = 'instagram', name = 'My Brand Account' } = req.body;
  
  const existing = db.prepare('SELECT id FROM social_accounts WHERE platform = ? AND account_id LIKE ?')
    .get(platform, 'demo_%');
  
  if (existing) {
    return res.json({ message: 'Demo account already exists', id: existing.id });
  }

  const demoId = `demo_${Date.now()}`;
  const result = db.prepare(`
    INSERT INTO social_accounts (platform, account_id, account_name, account_username, profile_picture, access_token, page_id, page_name)
    VALUES (?, ?, ?, ?, ?, 'demo_token', ?, ?)
  `).run(
    platform,
    demoId,
    name,
    name.toLowerCase().replace(/\s+/g, '_'),
    null,
    demoId,
    `${name} Page`
  );

  // Create initial growth snapshot
  db.prepare(`
    INSERT OR REPLACE INTO growth_snapshots (account_id, followers_count, following_count, posts_count)
    VALUES (?, 0, 0, 0)
  `).run(result.lastInsertRowid);

  const account = db.prepare('SELECT * FROM social_accounts WHERE id = ?').get(result.lastInsertRowid);
  res.json({ success: true, account });
});

// DELETE /api/accounts/:id - Disconnect account
router.delete('/:id', (req, res) => {
  try {
    const accountId = parseInt(req.params.id);
    db.transaction(() => {
      // 1. Unlink account from content items (set account_id = NULL)
      db.prepare('UPDATE content_items SET account_id = NULL WHERE account_id = ?').run(accountId);
      // 2. Delete growth snapshots associated with this account
      db.prepare('DELETE FROM growth_snapshots WHERE account_id = ?').run(accountId);
      // 3. Delete from social_accounts
      db.prepare('DELETE FROM social_accounts WHERE id = ?').run(accountId);
    })();
    res.json({ success: true });
  } catch (err) {
    console.error('Disconnect account error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/accounts/:id/toggle - Toggle active status
router.put('/:id/toggle', (req, res) => {
  db.prepare('UPDATE social_accounts SET is_active = NOT is_active WHERE id = ?').run(req.params.id);
  const account = db.prepare('SELECT * FROM social_accounts WHERE id = ?').get(req.params.id);
  res.json(account);
});

module.exports = router;
