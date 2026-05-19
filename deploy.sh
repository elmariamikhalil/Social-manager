#!/bin/bash
APP_DIR="/home/admin-01/Social-manager"

echo "🚀 Deploying SocialAI Manager..."
cd $APP_DIR
git pull origin main
cd $APP_DIR/client && npm install && npm run build
cd $APP_DIR/server && npm install
pm2 restart socialai-manager
echo "✅ Deploy complete! Live at: https://agent.kael.es"
