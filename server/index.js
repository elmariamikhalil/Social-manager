require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);

const IS_PROD = process.env.NODE_ENV === 'production';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const io = new Server(server, {
  cors: { origin: IS_PROD ? true : CLIENT_URL, methods: ['GET', 'POST'] },
});

// Middleware
app.use(cors({ origin: IS_PROD ? true : CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize DB
require('./db/database');

// API Routes
app.use('/api/trends', require('./routes/trends'));
app.use('/api/content', require('./routes/content'));
app.use('/api/accounts', require('./routes/accounts'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/marketing', require('./routes/marketing'));
app.use('/api/schedule', require('./routes/schedule'));
app.use('/api/settings', require('./routes/settings'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    env: process.env.NODE_ENV || 'development',
  });
});

// WebSocket — real-time updates
io.on('connection', (socket) => {
  socket.on('subscribe:trends', () => socket.join('trends'));
  socket.on('subscribe:queue', () => socket.join('queue'));
  socket.on('disconnect', () => {});
});

app.set('io', io);

// ── Production: Serve React build from Express ─────────────────
if (IS_PROD) {
  const clientBuild = path.join(__dirname, '../client/dist');
  app.use(express.static(clientBuild));
  // All non-API routes serve React's index.html (SPA routing)
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuild, 'index.html'));
  });
}

// Start scheduler
const { startAllJobs, runRefreshTrends } = require('./services/schedulerService');
startAllJobs();

// Initial trend refresh on startup
setTimeout(async () => {
  try {
    await runRefreshTrends();
    console.log('✅ Initial trends loaded');
  } catch (err) {
    console.error('Initial trend refresh failed:', err.message);
  }
}, 3000);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`\n🎯 SocialAI Manager running on port ${PORT}`);
  console.log(`🌐 Mode: ${IS_PROD ? 'PRODUCTION' : 'DEVELOPMENT'}`);
  console.log(`\n⚙️  API Status:`);
  console.log(`   Gemini AI: ${process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here' ? '✅' : '⚠️  Demo mode'}`);
  console.log(`   Meta API:  ${process.env.META_APP_ID && process.env.META_APP_ID !== 'your_meta_app_id' ? '✅' : '⚠️  Demo mode'}`);
  console.log(`   Reddit:    ${process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_ID !== 'your_reddit_client_id' ? '✅' : '⚠️  Demo mode'}`);
});
