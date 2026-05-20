const cloudinary = require('cloudinary').v2;

// Configure with user's keys (will be empty/mocked until they provide them)
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'demo', 
  api_key: process.env.CLOUDINARY_API_KEY || '12345', 
  api_secret: process.env.CLOUDINARY_API_SECRET || 'abcde' 
});

/**
 * Composites a real photo into a branded graphic using Cloudinary transformations.
 * Does NOT require any pre-uploaded template assets.
 * @param {string} sourceImageUrl - The URL of the real photo to embed
 * @param {string} headline - The short text to overlay
 * @param {string} platform - The platform name (instagram, facebook)
 * @returns {Promise<string>} The URL of the final composited image
 */
async function generateTemplateGraphic(sourceImageUrl, headline, platform) {
  if (!process.env.CLOUDINARY_API_KEY) {
    console.warn('⚠️ No Cloudinary API Key. Returning raw photo without template.');
    return sourceImageUrl;
  }

  // Upload the source photo to Cloudinary
  const uploadRes = await cloudinary.uploader.upload(sourceImageUrl, {
    folder: 'social_manager/temp_photos'
  });

  const isSquare = platform === 'instagram';
  const w = isSquare ? 1080 : 1200;
  const h = isSquare ? 1080 : 628;

  // Sanitize headline text for Cloudinary URL (remove special chars)
  const safeHeadline = (headline || 'Latest News')
    .replace(/[^a-zA-Z0-9 !?.,'-]/g, '')
    .substring(0, 60)
    .trim();

  // Build the composited image URL using only transformations on the uploaded photo
  const finalUrl = cloudinary.url(uploadRes.public_id, {
    transformation: [
      // 1. Crop/resize the base photo
      { width: w, height: h, crop: 'fill', gravity: 'center' },
      // 2. Dark gradient overlay at the bottom for text readability
      { overlay: `gradient:progressive`, gravity: 'south', height: Math.round(h * 0.5), width: w, crop: 'fill', opacity: 70, color: 'black' },
      // 3. Headline text
      {
        overlay: {
          font_family: 'Montserrat',
          font_size: isSquare ? 52 : 44,
          font_weight: 'bold',
          text: safeHeadline,
          text_align: 'left'
        },
        color: 'white',
        gravity: 'south_west',
        x: 60,
        y: isSquare ? 160 : 100,
        width: w - 120,
        crop: 'fit'
      },
      // 4. Brand bar at the very bottom
      {
        overlay: {
          font_family: 'Montserrat',
          font_size: 28,
          font_weight: 'bold',
          text: 'FC BARCELONA · BARÇA TV'
        },
        color: '#A50044',
        gravity: 'south_west',
        x: 60,
        y: 50
      }
    ],
    secure: true
  });

  return finalUrl;
}

module.exports = { generateTemplateGraphic };
