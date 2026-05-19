const db = require('../db/database');
const metaService = require('./metaService');

const isMetaConfigured = () =>
  process.env.META_APP_ID &&
  process.env.META_APP_ID !== 'your_meta_app_id';

function getAbsoluteImageUrl(relativeUrl) {
  if (!relativeUrl) return null;
  if (relativeUrl.startsWith('http')) return relativeUrl;
  
  let baseUrl = process.env.APP_URL;
  if (!baseUrl && process.env.META_REDIRECT_URI) {
    try {
      const parsed = new URL(process.env.META_REDIRECT_URI);
      baseUrl = `${parsed.protocol}//${parsed.host}`;
    } catch (e) {
      baseUrl = 'https://agent.kael.es';
    }
  }
  if (!baseUrl) baseUrl = 'https://agent.kael.es';
  
  return `${baseUrl.replace(/\/$/, '')}${relativeUrl}`;
}

async function publishContent(contentId) {
  const content = db.prepare('SELECT * FROM content_items WHERE id = ?').get(contentId);
  if (!content) throw new Error(`Content ${contentId} not found`);

  const account = content.account_id
    ? db.prepare('SELECT * FROM social_accounts WHERE id = ?').get(content.account_id)
    : null;

  let result;
  const absoluteImageUrl = getAbsoluteImageUrl(content.image_url);

  // Demo mode if no real credentials
  if (!isMetaConfigured() || !account) {
    result = await metaService.mockPublish(content.platform, content);
    result.demo_mode = true;
  } else {
    try {
      if (content.platform === 'facebook') {
        result = await metaService.publishToFacebook(
          account.page_id,
          account.access_token,
          content,
          absoluteImageUrl
        );
      } else if (content.platform === 'instagram') {
        result = await metaService.publishToInstagram(
          account.account_id,
          account.access_token,
          content,
          absoluteImageUrl
        );
      } else {
        result = await metaService.mockPublish(content.platform, content);
      }
    } catch (err) {
      // Log failure
      db.prepare(`
        INSERT INTO publish_logs (content_id, account_id, platform, status, error_message)
        VALUES (?, ?, ?, 'failed', ?)
      `).run(contentId, content.account_id, content.platform, err.message);

      db.prepare(`UPDATE content_items SET status = 'failed', updated_at = datetime('now') WHERE id = ?`)
        .run(contentId);

      throw err;
    }
  }

  // Log success
  db.prepare(`
    INSERT INTO publish_logs (content_id, account_id, platform, status, response_data, post_id, post_url)
    VALUES (?, ?, ?, 'published', ?, ?, ?)
  `).run(
    contentId,
    content.account_id,
    content.platform,
    JSON.stringify(result),
    result.post_id,
    result.post_url
  );

  db.prepare(`
    UPDATE content_items 
    SET status = 'published', published_at = datetime('now'), updated_at = datetime('now')
    WHERE id = ?
  `).run(contentId);

  return result;
}

async function processPublishQueue() {
  const brand = db.prepare('SELECT * FROM brand_profiles WHERE id = 1').get();
  if (!brand?.auto_publish) return { processed: 0 };

  const queued = db.prepare(`
    SELECT * FROM content_items 
    WHERE status = 'queued' AND (scheduled_at IS NULL OR scheduled_at <= datetime('now'))
    ORDER BY scheduled_at ASC, created_at ASC
    LIMIT 5
  `).all();

  let processed = 0;
  for (const item of queued) {
    try {
      await publishContent(item.id);
      processed++;
    } catch (err) {
      console.error(`Failed to publish content ${item.id}:`, err.message);
    }
  }

  return { processed };
}

function getPublishStats() {
  const stats = db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published,
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
      SUM(CASE WHEN status = 'queued' THEN 1 ELSE 0 END) as queued,
      SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as drafts
    FROM content_items
  `).get();
  return stats;
}

module.exports = { publishContent, processPublishQueue, getPublishStats };
