require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const axios = require('axios');

// Meta Graph API base URL
const META_BASE = 'https://graph.facebook.com/v19.0';

function getMetaAuthUrl(state = 'default') {
  const scopes = [
    'pages_manage_posts',
    'pages_read_engagement',
    'pages_show_list',
    'business_management',
    'instagram_basic',
    'instagram_content_publish',
    'instagram_manage_insights',
    'public_profile',
    'email',
  ].join(',');

  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID || '',
    redirect_uri: process.env.META_REDIRECT_URI || '',
    scope: scopes,
    response_type: 'code',
    auth_type: 'rerequest',
    state,
  });

  return `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`;
}

async function exchangeCodeForToken(code) {
  const response = await axios.get(`${META_BASE}/oauth/access_token`, {
    params: {
      client_id: process.env.META_APP_ID,
      client_secret: process.env.META_APP_SECRET,
      redirect_uri: process.env.META_REDIRECT_URI,
      code,
    },
  });
  return response.data; // { access_token, token_type }
}

async function getLongLivedToken(shortToken) {
  const response = await axios.get(`${META_BASE}/oauth/access_token`, {
    params: {
      grant_type: 'fb_exchange_token',
      client_id: process.env.META_APP_ID,
      client_secret: process.env.META_APP_SECRET,
      fb_exchange_token: shortToken,
    },
  });
  return response.data; // { access_token, token_type, expires_in }
}

async function getUserProfile(accessToken) {
  const response = await axios.get(`${META_BASE}/me`, {
    params: {
      access_token: accessToken,
      fields: 'id,name,email,picture',
    },
  });
  return response.data;
}

async function getUserPages(accessToken) {
  const response = await axios.get(`${META_BASE}/me/accounts`, {
    params: {
      access_token: accessToken,
      fields: 'id,name,access_token,instagram_business_account,picture',
    },
  });
  return response.data?.data || [];
}

async function getInstagramAccount(pageId, pageAccessToken) {
  try {
    const response = await axios.get(`${META_BASE}/${pageId}`, {
      params: {
        access_token: pageAccessToken,
        fields: 'instagram_business_account{id,name,username,profile_picture_url,followers_count,media_count}',
      },
    });
    return response.data?.instagram_business_account || null;
  } catch (err) {
    console.error('IG account fetch error:', err.message);
    return null;
  }
}

async function publishToFacebook(pageId, pageToken, content, imageUrl = null) {
  try {
    let response;
    if (imageUrl) {
      response = await axios.post(`${META_BASE}/${pageId}/photos`, {
        access_token: pageToken,
        url: imageUrl,
        caption: content.body,
      });
    } else {
      response = await axios.post(`${META_BASE}/${pageId}/feed`, {
        access_token: pageToken,
        message: content.body,
      });
    }
    return {
      success: true,
      post_id: response.data.id,
      post_url: `https://facebook.com/${response.data.id}`,
    };
  } catch (err) {
    const errorMsg = err.response?.data?.error?.message || err.message;
    throw new Error(`Facebook publish failed: ${errorMsg}`);
  }
}

async function publishToInstagram(igAccountId, pageToken, content, imageUrl) {
  try {
    if (!imageUrl) {
      throw new Error('Instagram requires an image URL to publish');
    }

    // Step 1: Create media container
    const containerResponse = await axios.post(`${META_BASE}/${igAccountId}/media`, {
      image_url: imageUrl,
      caption: content.body,
      access_token: pageToken,
    });

    const containerId = containerResponse.data.id;

    // Step 2: Wait for processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 3: Publish media container
    const publishResponse = await axios.post(`${META_BASE}/${igAccountId}/media_publish`, {
      creation_id: containerId,
      access_token: pageToken,
    });

    return {
      success: true,
      post_id: publishResponse.data.id,
      post_url: `https://instagram.com/p/${publishResponse.data.id}`,
    };
  } catch (err) {
    const errorMsg = err.response?.data?.error?.message || err.message;
    throw new Error(`Instagram publish failed: ${errorMsg}`);
  }
}

async function getPageInsights(pageId, pageToken, metrics = ['page_fans', 'page_impressions', 'page_reach']) {
  try {
    const response = await axios.get(`${META_BASE}/${pageId}/insights`, {
      params: {
        access_token: pageToken,
        metric: metrics.join(','),
        period: 'day',
        since: Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000),
        until: Math.floor(Date.now() / 1000),
      },
    });
    return response.data?.data || [];
  } catch (err) {
    console.error('Page insights error:', err.message);
    return [];
  }
}

async function getInstagramInsights(igAccountId, pageToken) {
  try {
    const response = await axios.get(`${META_BASE}/${igAccountId}`, {
      params: {
        access_token: pageToken,
        fields: 'followers_count,media_count,profile_views,reach,website_clicks',
      },
    });
    return response.data;
  } catch (err) {
    console.error('IG insights error:', err.message);
    return {};
  }
}

// Mock publisher for demo mode (no real Meta credentials)
async function mockPublish(platform, content) {
  await new Promise(r => setTimeout(r, 1500)); // simulate API delay
  const mockId = `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  return {
    success: true,
    post_id: mockId,
    post_url: `https://${platform}.com/demo/${mockId}`,
    demo_mode: true,
  };
}

module.exports = {
  getMetaAuthUrl,
  exchangeCodeForToken,
  getLongLivedToken,
  getUserProfile,
  getUserPages,
  getInstagramAccount,
  publishToFacebook,
  publishToInstagram,
  getPageInsights,
  getInstagramInsights,
  mockPublish,
};
