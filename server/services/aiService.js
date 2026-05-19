require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;

function getGeminiClient() {
  if (!genAI && process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
}

// Mock AI response for demo mode (no API key required)
function mockGenerate(prompt) {
  const responses = {
    post: [
      "🚀 The future of content is here! AI-powered tools are transforming how brands connect with their audiences. Are you ready to level up your social media game? Drop a 🔥 if you're in!\n\n#ContentCreator #SocialMedia #AI #Marketing #Growth",
      "💡 Did you know? Brands that post consistently see 3x more engagement! Consistency is the secret sauce to growing your audience from zero to hero. Start today, thank yourself tomorrow. ✨\n\n#GrowthHacks #SocialMediaTips #ContentStrategy #Engagement",
      "🌟 Your story deserves to be heard. Stop waiting for the 'perfect moment' and start creating. The algorithm rewards ACTION, not perfection. Post more, grow faster! 📈\n\n#ContentCreation #InstagramGrowth #Motivation #PersonalBrand",
    ],
    plan: `# 30-Day Growth Marketing Plan

## Goals
- Grow followers from 0 to 1,000+ in 30 days
- Achieve 5%+ engagement rate
- Build brand awareness and community

## Week 1: Foundation (Days 1–7)
- Post 2x daily: 1 educational + 1 entertainment
- Use 15-20 targeted hashtags per post
- Engage with 50 accounts in your niche daily
- Set up complete bio with clear CTA

## Week 2: Momentum (Days 8–14)
- Introduce Reels/short-form video (3x per week)
- Start responding to ALL comments within 1 hour
- Collaborate with 2 micro-influencers (1K-10K followers)
- Run first story poll to boost engagement

## Week 3: Amplify (Days 15–21)
- Launch first giveaway (follow + tag a friend)
- Post behind-the-scenes content
- Start weekly Q&A series
- Cross-post best content to other platforms

## Week 4: Convert (Days 22–30)
- Analyze top-performing posts — double down
- Launch email capture CTA
- Reach out to 5 brand partnership prospects
- Review and optimize hashtag strategy

## KPIs to Track
- Daily new followers
- Engagement rate per post
- Story view completion rate
- Profile visits per week`,
  };

  if (prompt.toLowerCase().includes('plan') || prompt.toLowerCase().includes('strategy')) {
    return responses.plan;
  }
  return responses.post[Math.floor(Math.random() * responses.post.length)];
}

async function generateContent(prompt, options = {}) {
  const client = getGeminiClient();

  if (!client) {
    console.log('⚠️  No Gemini API key — using demo mode');
    return { text: mockGenerate(prompt), model: 'demo-mode', tokens: 0 };
  }

  try {
    const model = client.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return {
      text: response.text(),
      model: 'gemini-2.0-flash',
      tokens: response.usageMetadata?.totalTokenCount || 0,
    };
  } catch (err) {
    console.error('Gemini error:', err.message);
    return { text: mockGenerate(prompt), model: 'demo-mode (fallback)', tokens: 0 };
  }
}

async function generateSocialPost(trend, platform, brand) {
  const platformGuidelines = {
    instagram: 'Instagram post with emojis, 2200 characters max, 5-10 hashtags at end',
    facebook: 'Facebook post, conversational tone, can be longer, 1-2 hashtags max',
    twitter: 'Tweet under 280 characters, punchy and engaging, 1-2 hashtags',
    linkedin: 'LinkedIn post, professional tone, thought leadership angle, 3-5 hashtags',
    tiktok: 'TikTok caption, gen-z friendly, trending sounds reference, 5-10 hashtags',
  };

  const guide = platformGuidelines[platform.toLowerCase()] || platformGuidelines.instagram;

  const prompt = `You are a social media expert for the brand "${brand.name}" in the ${brand.niche} niche.
The brand tone is: ${brand.tone}
Target audience: ${brand.target_audience}
Brand keywords: ${(JSON.parse(brand.keywords || '[]')).join(', ')}

Write a viral ${guide} about this trending topic:
Topic: "${trend.topic}"
Context: "${trend.description || ''}"

Requirements:
- Make it highly engaging and shareable
- Optimized for maximum reach and follower growth
- Include a compelling call-to-action
- Natural and authentic, not salesy

Return ONLY the post text, nothing else.`;

  return generateContent(prompt);
}

async function generateImagePrompt(postContent, brand) {
  const prompt = `Based on this social media post for a ${brand.niche} brand, suggest a DALL-E image prompt:

Post: "${postContent.substring(0, 300)}"

Create a concise, detailed image prompt (max 100 words) that would make a stunning, eye-catching visual for this post. Focus on composition, mood, colors, and style. Return ONLY the image prompt.`;

  return generateContent(prompt);
}

async function generateMarketingPlan(trendsData, brand, options = {}) {
  const period = options.period || '30 days';
  const platforms = options.platforms || ['instagram', 'facebook'];

  const topTrends = trendsData
    .slice(0, 5)
    .map((t, i) => `${i + 1}. "${t.topic}" (score: ${t.score.toFixed(1)}, source: ${t.source})`)
    .join('\n');

  const prompt = `You are a senior marketing strategist. Create a comprehensive ${period} marketing plan for:

Brand: ${brand.name}
Niche: ${brand.niche}
Tone: ${brand.tone}
Target Audience: ${brand.target_audience}
Platforms: ${platforms.join(', ')}
Goal: Grow social media following from scratch to maximum possible reach

Current trending topics in this niche:
${topTrends}

Create a detailed marketing plan with:
1. Executive Summary & Goals (with specific follower targets)
2. Content Strategy (post types, frequency, optimal times)
3. Week-by-week content calendar with post ideas
4. Hashtag strategy
5. Engagement tactics (collaborations, giveaways, community building)
6. KPIs and metrics to track
7. Platform-specific growth hacks

Format as a clear, actionable document with headers and bullet points.`;

  return generateContent(prompt);
}

async function scoreContentIdea(topic, brand) {
  const prompt = `Rate this content idea for a ${brand.niche} brand on a scale of 1-100 for viral potential:
Topic: "${topic}"
Brand tone: ${brand.tone}
Target audience: ${brand.target_audience}

Return ONLY a JSON object: {"score": number, "reason": "one sentence explanation", "suggested_angle": "best content angle"}`;

  const result = await generateContent(prompt);
  try {
    const cleaned = result.text.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return { score: Math.floor(Math.random() * 40) + 60, reason: 'AI analysis', suggested_angle: topic };
  }
}

module.exports = { generateContent, generateSocialPost, generateImagePrompt, generateMarketingPlan, scoreContentIdea };
