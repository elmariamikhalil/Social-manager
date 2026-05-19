require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const axios = require('axios');
const RSSParser = require('rss-parser');

const parser = new RSSParser();

// Default subreddits for trend discovery
const DEFAULT_SUBREDDITS = [
  'marketing', 'socialmedia', 'entrepreneur', 'smallbusiness',
  'digitalmarketing', 'contentcreation', 'InstagramMarketing'
];

const RSS_FEEDS = [
  { url: 'https://feeds.feedburner.com/entrepreneur/latest', category: 'business' },
  { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml', category: 'technology' },
  { url: 'https://www.socialmediaexaminer.com/feed/', category: 'social_media' },
  { url: 'https://feeds.feedburner.com/marketingland/lqbj', category: 'marketing' },
];

async function getRedditAccessToken() {
  if (!process.env.REDDIT_CLIENT_ID || process.env.REDDIT_CLIENT_ID === 'your_reddit_client_id') {
    return null;
  }
  try {
    // Reddit "script" apps use password grant (requires your Reddit username+password)
    // Reddit "web app" type uses client_credentials
    const hasUserCreds = process.env.REDDIT_USERNAME && process.env.REDDIT_PASSWORD;
    const grantBody = hasUserCreds
      ? `grant_type=password&username=${encodeURIComponent(process.env.REDDIT_USERNAME)}&password=${encodeURIComponent(process.env.REDDIT_PASSWORD)}`
      : 'grant_type=client_credentials';

    const response = await axios.post(
      'https://www.reddit.com/api/v1/access_token',
      grantBody,
      {
        auth: { username: process.env.REDDIT_CLIENT_ID, password: process.env.REDDIT_CLIENT_SECRET },
        headers: {
          'User-Agent': process.env.REDDIT_USER_AGENT || 'SocialManager/1.0',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    return response.data.access_token;
  } catch (err) {
    console.error('Reddit auth error:', err.message);
    return null;
  }
}

async function fetchRedditTrends(subreddits = DEFAULT_SUBREDDITS, limit = 5) {
  const trends = [];

  for (const sub of subreddits.slice(0, 4)) {
    try {
      // Use public Reddit JSON API — no OAuth needed for public subreddits
      const response = await axios.get(
        `https://www.reddit.com/r/${sub}/hot.json?limit=${limit}`,
        {
          headers: { 'User-Agent': process.env.REDDIT_USER_AGENT || 'SocialManager/1.0' },
          timeout: 8000,
        }
      );
      const posts = response.data?.data?.children || [];

      for (const post of posts) {
        const d = post.data;
        if (d.stickied || d.score < 50) continue;
        trends.push({
          topic: d.title.length > 120 ? d.title.substring(0, 120) + '...' : d.title,
          description: d.selftext ? d.selftext.substring(0, 300) : `Trending in r/${sub}`,
          score: Math.min(100, Math.log10(d.score + 1) * 25),
          source: 'reddit',
          category: sub,
          url: `https://reddit.com${d.permalink}`,
        });
      }
    } catch (err) {
      console.error(`Reddit r/${sub} error:`, err.message);
    }
  }

  return trends;
}

async function fetchRSSFeeds() {
  const trends = [];

  for (const feed of RSS_FEEDS) {
    try {
      const result = await parser.parseURL(feed.url);
      const items = (result.items || []).slice(0, 3);

      for (const item of items) {
        trends.push({
          topic: item.title || 'Untitled',
          description: item.contentSnippet || item.summary || '',
          score: Math.random() * 30 + 50,
          source: 'rss',
          category: feed.category,
          url: item.link || '',
        });
      }
    } catch (err) {
      // RSS feeds can be unreliable, silently skip
    }
  }

  return trends;
}

async function fetchGoogleTrends(keywords = []) {
  if (!process.env.SERPAPI_KEY || process.env.SERPAPI_KEY === 'your_serpapi_key_here') {
    return [];
  }

  const trends = [];
  try {
    const response = await axios.get('https://serpapi.com/search.json', {
      params: {
        engine: 'google_trends_trending_now',
        geo: 'US',
        api_key: process.env.SERPAPI_KEY,
      },
      timeout: 10000,
    });

    const trendingSearches = response.data?.trending_searches || [];
    for (const trend of trendingSearches.slice(0, 10)) {
      trends.push({
        topic: trend.query || trend.title?.query || 'Trending topic',
        description: trend.articles?.[0]?.snippet || 'Trending on Google',
        score: Math.min(100, (trend.formattedTraffic || '1K').replace(/[KM+]/g, '') * (trend.formattedTraffic?.includes('M') ? 10 : 1)),
        source: 'google_trends',
        category: 'trending',
        url: trend.articles?.[0]?.url || '',
      });
    }
  } catch (err) {
    console.error('SerpApi error:', err.message);
  }

  return trends;
}

// Generate demo trends when no APIs are configured
function getDemoTrends() {
  const demoTopics = [
    { topic: 'AI tools are changing the content creation game in 2025', category: 'technology', score: 92 },
    { topic: 'How to grow your Instagram from 0 to 10K in 90 days', category: 'marketing', score: 88 },
    { topic: 'The best time to post on social media for maximum reach', category: 'social_media', score: 85 },
    { topic: 'Short-form video is dominating social media — here\'s how to adapt', category: 'content', score: 83 },
    { topic: 'Micro-influencer marketing: Why small is the new big', category: 'marketing', score: 79 },
    { topic: 'Behind-the-scenes content gets 3x more engagement', category: 'social_media', score: 76 },
    { topic: 'Authenticity over perfection: The new rule of social media', category: 'content', score: 74 },
    { topic: 'Hashtag strategy that actually works in 2025', category: 'instagram', score: 71 },
    { topic: 'How to write captions that stop the scroll', category: 'copywriting', score: 69 },
    { topic: 'Community building is the key to sustainable growth', category: 'engagement', score: 67 },
  ];

  return demoTopics.map(t => ({
    ...t,
    description: `This topic is trending across social media platforms and content creator communities.`,
    source: 'demo',
    url: '',
  }));
}

async function fetchAllTrends(config = {}) {
  const subreddits = config.subreddits || DEFAULT_SUBREDDITS;
  const [redditTrends, rssTrends, googleTrends] = await Promise.allSettled([
    fetchRedditTrends(subreddits),
    fetchRSSFeeds(),
    fetchGoogleTrends(),
  ]);

  let allTrends = [
    ...(redditTrends.status === 'fulfilled' ? redditTrends.value : []),
    ...(rssTrends.status === 'fulfilled' ? rssTrends.value : []),
    ...(googleTrends.status === 'fulfilled' ? googleTrends.value : []),
  ];

  // Fall back to demo data if nothing fetched
  if (allTrends.length === 0) {
    allTrends = getDemoTrends();
  }

  // Sort by score descending, deduplicate
  const seen = new Set();
  return allTrends
    .filter(t => {
      if (seen.has(t.topic)) return false;
      seen.add(t.topic);
      return true;
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);
}

module.exports = { fetchAllTrends, fetchRedditTrends, fetchRSSFeeds, fetchGoogleTrends, getDemoTrends };
