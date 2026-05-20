const cloudinary = require('cloudinary').v2;

// Configure with user's keys (will be empty/mocked until they provide them)
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'demo', 
  api_key: process.env.CLOUDINARY_API_KEY || '12345', 
  api_secret: process.env.CLOUDINARY_API_SECRET || 'abcde' 
});

/**
 * Composites a real photo onto a branded template using Cloudinary.
 * @param {string} sourceImageUrl - The URL of the real photo to embed
 * @param {string} headline - The short text to overlay
 * @param {string} platform - The platform name (instagram, facebook) to choose the template
 * @returns {Promise<string>} The URL of the final composited image
 */
async function generateTemplateGraphic(sourceImageUrl, headline, platform) {
  if (!process.env.CLOUDINARY_API_KEY) {
    console.warn('⚠️ No Cloudinary API Key. Returning raw photo without template.');
    // Return the raw factual photo if keys aren't set yet
    return sourceImageUrl;
  }

  try {
    // In a real app, you would have pre-uploaded templates in your Cloudinary account
    // e.g., 'fcb_template_ig' (1080x1080)
    const templateId = platform === 'instagram' ? 'fcb_template_ig' : 'fcb_template_general';

    // Upload the real photo temporarily so we can layer it
    const uploadRes = await cloudinary.uploader.upload(sourceImageUrl, {
      folder: 'social_manager/temp_photos'
    });

    // Generate the final composite URL
    const finalUrl = cloudinary.url(templateId, {
      transformation: [
        // Layer the uploaded real photo behind the template cutout
        { overlay: uploadRes.public_id, width: 800, height: 800, crop: "fill", gravity: "center" },
        // Apply the headline text on top of everything
        // Using a bold font, colored white, placed near the bottom
        { overlay: { font_family: "Montserrat", font_size: 55, font_weight: "bold", text: headline }, 
          color: "#FFFFFF", gravity: "south", y: 150, width: 900, crop: "fit" }
      ]
    });

    return finalUrl;
  } catch (error) {
    console.error('Cloudinary templating failed:', error);
    throw error;
  }
}

module.exports = { generateTemplateGraphic };
