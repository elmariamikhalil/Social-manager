const cron = require('node-cron');
const db = require('../db/database');
const { fetchAllTrends } = require('./trendService');
const { processPublishQueue } = require('./publishService');

const activeJobs = new Map();

async function runRefreshTrends(config = {}) {
  console.log('🔄 Running: Refresh Trends');
  try {
    const trends = await fetchAllTrends(config);
    const insert = db.prepare(`
      INSERT INTO trend_snapshots (topic, description, score, source, category, url)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const insertMany = db.transaction((items) => {
      for (const t of items) {
        insert.run(t.topic, t.description || '', t.score, t.source, t.category || 'general', t.url || '');
      }
    });
    insertMany(trends);

    // Keep only last 200 trend snapshots
    db.prepare(`
      DELETE FROM trend_snapshots WHERE id NOT IN (
        SELECT id FROM trend_snapshots ORDER BY captured_at DESC LIMIT 200
      )
    `).run();

    console.log(`✅ Refreshed ${trends.length} trends`);
    return { count: trends.length };
  } catch (err) {
    console.error('Trend refresh error:', err.message);
    return { error: err.message };
  }
}

async function runProcessQueue() {
  console.log('📤 Running: Process Publish Queue');
  const result = await processPublishQueue();
  console.log(`✅ Published ${result.processed} items`);
  return result;
}

async function runGrowthSnapshot() {
  console.log('📊 Running: Growth Snapshot');
  const accounts = db.prepare('SELECT * FROM social_accounts WHERE is_active = 1').all();

  for (const account of accounts) {
    try {
      // In demo mode, generate simulated growth
      const lastSnapshot = db.prepare(`
        SELECT * FROM growth_snapshots WHERE account_id = ? ORDER BY snapshot_date DESC LIMIT 1
      `).get(account.id);

      const lastFollowers = lastSnapshot?.followers_count || Math.floor(Math.random() * 100);
      const growth = Math.floor(Math.random() * 15) + 1; // 1-15 new followers per day in demo

      db.prepare(`
        INSERT OR REPLACE INTO growth_snapshots 
        (account_id, followers_count, following_count, posts_count, reach, impressions, profile_views)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        account.id,
        lastFollowers + growth,
        lastSnapshot?.following_count || 50,
        lastSnapshot?.posts_count || 0,
        Math.floor(Math.random() * 500) + 100,
        Math.floor(Math.random() * 1000) + 200,
        Math.floor(Math.random() * 80) + 20
      );
    } catch (err) {
      console.error(`Growth snapshot error for account ${account.id}:`, err.message);
    }
  }

  console.log(`✅ Growth snapshot for ${accounts.length} accounts`);
  return { accounts: accounts.length };
}

async function runGenerateImages() {
  console.log('🎨 Running: Template Compositing');
  const { generateTemplateGraphic } = require('./cloudinaryService');
  
  const pendingItems = db.prepare(`
    SELECT id, image_prompt, platform FROM content_items 
    WHERE image_prompt IS NOT NULL AND image_url IS NULL 
    AND status IN ('draft', 'queued')
    LIMIT 3
  `).all();

  let count = 0;
  for (const item of pendingItems) {
    try {
      // Parse the JSON we saved during plan launch
      let templateData;
      try {
        templateData = JSON.parse(item.image_prompt);
      } catch (e) {
        // Fallback if it's still using the old raw prompt string
        templateData = { search_query: 'FC Barcelona', headline: 'BREAKING' };
      }

      console.log(`🔍 Searching for real photo: "${templateData.search_query}"`);
      
      // Mock Image Search (In production, replace with Google/Bing Image API)
      // For this prototype, we'll use a real high-quality football/stadium image from Wikimedia Commons
      // Unsplash blocks Cloudinary fetches, so we use Wikipedia images for the prototype
      const mockRealPhotoUrls = [
        'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Messi_vs_Nigeria_2018.jpg/800px-Messi_vs_Nigeria_2018.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Gerard_Pique_2015.jpg/800px-Gerard_Pique_2015.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/FC_Barcelona_-_Camp_Nou.jpg/800px-FC_Barcelona_-_Camp_Nou.jpg'
      ];
      const realPhotoUrl = mockRealPhotoUrls[Math.floor(Math.random() * mockRealPhotoUrls.length)];

      console.log(`🖼️ Compositing template with Cloudinary for platform: ${item.platform}`);
      let finalImageUrl;
      try {
        finalImageUrl = await generateTemplateGraphic(realPhotoUrl, templateData.headline, item.platform);
      } catch (cloudErr) {
        if (cloudErr.http_code === 400 || cloudErr.http_code === 429) {
          console.warn(`⚠️ Cloudinary/Wikimedia rate limit hit (429). Using fallback placeholder.`);
          const fallbackUrl = `https://placehold.co/800x800/1e293b/FFFFFF.png?text=Real+Photo+Mock`;
          finalImageUrl = await generateTemplateGraphic(fallbackUrl, templateData.headline, item.platform);
        } else {
          throw cloudErr;
        }
      }

      if (finalImageUrl) {
        db.prepare(`UPDATE content_items SET image_url = ?, updated_at = datetime('now') WHERE id = ?`).run(finalImageUrl, item.id);
        count++;
      }
    } catch (err) {
      console.error(`Failed to composite image for item ${item.id}:`, err.message);
    }
  }
  
  if (count > 0) console.log(`✅ Composited ${count} graphics`);
  return { generated: count };
}

const JOB_HANDLERS = {
  refresh_trends: runRefreshTrends,
  process_queue: runProcessQueue,
  growth_snapshot: runGrowthSnapshot,
  generate_images: runGenerateImages,
};

function startAllJobs() {
  const jobs = db.prepare('SELECT * FROM scheduled_jobs WHERE is_active = 1').all();

  for (const job of jobs) {
    if (activeJobs.has(job.id)) continue;

    try {
      const handler = JOB_HANDLERS[job.job_type];
      if (!handler) continue;

      const config = JSON.parse(job.config || '{}');
      const cronJob = cron.schedule(job.cron_expression, async () => {
        try {
          await handler(config);
          db.prepare(`UPDATE scheduled_jobs SET last_run = datetime('now') WHERE id = ?`).run(job.id);
        } catch (err) {
          console.error(`Job ${job.name} error:`, err.message);
        }
      });

      activeJobs.set(job.id, cronJob);
      console.log(`⏰ Scheduled: "${job.name}" (${job.cron_expression})`);
    } catch (err) {
      console.error(`Failed to schedule job ${job.name}:`, err.message);
    }
  }
}

function stopJob(jobId) {
  const job = activeJobs.get(jobId);
  if (job) {
    job.stop();
    activeJobs.delete(jobId);
  }
}

function getJobStatus() {
  return db.prepare('SELECT * FROM scheduled_jobs ORDER BY id').all().map(job => ({
    ...job,
    is_running: activeJobs.has(job.id),
    config: JSON.parse(job.config || '{}'),
  }));
}

async function triggerJobNow(jobId) {
  const job = db.prepare('SELECT * FROM scheduled_jobs WHERE id = ?').get(jobId);
  if (!job) throw new Error('Job not found');

  const handler = JOB_HANDLERS[job.job_type];
  if (!handler) throw new Error(`No handler for job type: ${job.job_type}`);

  const config = JSON.parse(job.config || '{}');
  const result = await handler(config);
  db.prepare(`UPDATE scheduled_jobs SET last_run = datetime('now') WHERE id = ?`).run(jobId);
  return result;
}

module.exports = { startAllJobs, stopJob, getJobStatus, triggerJobNow, runRefreshTrends, runGrowthSnapshot };
