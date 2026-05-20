const cloudinary = require('cloudinary').v2;

// Configure with user's keys
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Composites a real photo into a branded graphic using Cloudinary eager transformations.
 * Uploads the source photo and returns a guaranteed absolute HTTPS URL.
 * @param {string} sourceImageUrl - URL of the real photo
 * @param {string} headline - Short headline text to overlay
 * @param {string} platform - 'instagram' | 'facebook'
 * @returns {Promise<string>} Absolute HTTPS URL of the composited image
 */
async function generateTemplateGraphic(sourceImageUrl, headline, platform) {
  if (!process.env.CLOUDINARY_API_KEY) {
    console.warn('⚠️ No Cloudinary API Key. Returning raw photo without template.');
    return sourceImageUrl;
  }

  const isSquare = platform === 'instagram';
  const w = isSquare ? 1080 : 1200;
  const h = isSquare ? 1080 : 628;

  // Sanitize headline: Cloudinary text overlay rejects slashes, commas and special unicode
  const safeHeadline = (headline || 'Latest News')
    .replace(/[\/,!]/g, ' ')
    .replace(/[^a-zA-Z0-9 .?!'-]/g, '')
    .substring(0, 60)
    .trim() || 'Latest News';

  // Upload the photo with eager transformations baked in.
  // eager_async: false means we wait for the transformed URL before returning.
  // This guarantees uploadRes.eager[0].secure_url is a full absolute HTTPS URL.
  const uploadRes = await cloudinary.uploader.upload(sourceImageUrl, {
    folder: 'social_manager/posts',
    eager: [
      {
        width: w,
        height: h,
        crop: 'fill',
        gravity: 'center',
        overlay: {
          font_family: 'Montserrat',
          font_size: isSquare ? 50 : 42,
          font_weight: 'bold',
          text: safeHeadline
        },
        color: 'white',
        gravity: 'south',
        y: 80,
        width: w - 120,
        crop: 'fit'
      }
    ],
    eager_async: false
  });

  // Return the eagerly-transformed URL (always a full absolute https URL)
  if (uploadRes.eager && uploadRes.eager[0]) {
    return uploadRes.eager[0].secure_url;
  }

  // Fallback: return the plain uploaded image URL (still absolute)
  return uploadRes.secure_url;
}

module.exports = { generateTemplateGraphic };
