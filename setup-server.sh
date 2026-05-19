#!/bin/bash
# ─────────────────────────────────────────────────────────────────────
#  SocialAI Manager — First-Time Server Setup Script
#  Run on the Azure VM as root or sudo user
#  Server IP: 172.201.249.228  |  Domain: agent.kael.es
# ─────────────────────────────────────────────────────────────────────

set -e  # Exit on any error

APP_DIR="/var/www/socialai"
DOMAIN="agent.kael.es"
GITHUB_REPO="https://github.com/YOUR_USERNAME/YOUR_REPO.git"  # <-- update this

echo "════════════════════════════════════════════"
echo "  SocialAI Manager — Server Setup"
echo "  Domain: $DOMAIN"
echo "════════════════════════════════════════════"

# ── 1. System Updates ─────────────────────────────────────────────
echo "📦 Updating system..."
apt update && apt upgrade -y

# ── 2. Install Node.js 20 ─────────────────────────────────────────
echo "📦 Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# ── 3. Install Nginx ──────────────────────────────────────────────
echo "📦 Installing Nginx..."
apt install -y nginx

# ── 4. Install PM2 (process manager) ─────────────────────────────
echo "📦 Installing PM2..."
npm install -g pm2

# ── 5. Install Certbot (free SSL) ─────────────────────────────────
echo "📦 Installing Certbot..."
apt install -y certbot python3-certbot-nginx

# ── 6. Clone repo ─────────────────────────────────────────────────
echo "📂 Setting up app directory..."
mkdir -p $APP_DIR
mkdir -p /var/log/socialai

git clone $GITHUB_REPO $APP_DIR
cd $APP_DIR

# ── 7. Install dependencies ───────────────────────────────────────
echo "📦 Installing app dependencies..."
cd $APP_DIR/client && npm install && npm run build
cd $APP_DIR/server && npm install

# ── 8. Set up .env file ───────────────────────────────────────────
echo "⚙️  Creating .env file..."
cp $APP_DIR/.env.example $APP_DIR/server/.env
echo ""
echo "❗ IMPORTANT: Edit the .env file now:"
echo "   nano $APP_DIR/server/.env"
echo ""
echo "   Add your real API keys, then press any key to continue..."
read -n 1

# ── 9. Configure Nginx ────────────────────────────────────────────
echo "🔧 Configuring Nginx..."
cp $APP_DIR/nginx.conf /etc/nginx/sites-available/$DOMAIN
ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/$DOMAIN
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# ── 10. Get SSL Certificate ───────────────────────────────────────
echo "🔒 Getting SSL certificate for $DOMAIN..."
certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@kael.es
systemctl reload nginx

# ── 11. Start app with PM2 ───────────────────────────────────────
echo "🚀 Starting app with PM2..."
cd $APP_DIR
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Run the printed command to auto-start on reboot

echo ""
echo "════════════════════════════════════════════"
echo "  ✅ Setup complete!"
echo "  🌐 Your app: https://$DOMAIN"
echo "════════════════════════════════════════════"
