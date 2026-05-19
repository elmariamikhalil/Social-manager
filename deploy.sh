#!/bin/bash
# ─────────────────────────────────────────────────────────────────────
#  SocialAI Manager — Deploy Update Script
#  Run this every time you push new code to GitHub
#  Usage: ssh into server then run: bash /var/www/socialai/deploy.sh
# ─────────────────────────────────────────────────────────────────────

APP_DIR="/var/www/socialai"

echo "🚀 Deploying SocialAI Manager..."

cd $APP_DIR

# Pull latest code from GitHub
git pull origin main

# Rebuild React frontend
echo "🏗️  Building React app..."
cd $APP_DIR/client && npm install && npm run build

# Install any new server dependencies
echo "📦 Updating server dependencies..."
cd $APP_DIR/server && npm install

# Restart the Node.js app
echo "🔄 Restarting app..."
pm2 restart socialai-manager

echo "✅ Deploy complete! Live at: https://agent.kael.es"
