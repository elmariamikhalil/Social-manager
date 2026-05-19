import { useState, useEffect, useCallback } from 'react';
import { API } from '../App';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const PLATFORM_CONFIG = {
  instagram: { icon: '📸', color: '#e1306c', gradient: 'linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)' },
  facebook:  { icon: '📘', color: '#1877f2', gradient: 'linear-gradient(135deg,#1877f2,#0d5db5)' },
  twitter:   { icon: '🐦', color: '#1da1f2', gradient: 'linear-gradient(135deg,#1da1f2,#0d8bd9)' },
  linkedin:  { icon: '💼', color: '#0077b5', gradient: 'linear-gradient(135deg,#0077b5,#005e8a)' },
  tiktok:    { icon: '🎵', color: '#010101', gradient: 'linear-gradient(135deg,#010101,#ff0050)' },
};

function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function AccountMiniCard({ account }) {
  const cfg = PLATFORM_CONFIG[account.platform] || { icon: '📱', gradient: 'linear-gradient(135deg,#6366f1,#a855f7)', color: '#6366f1' };
  return (
    <div className="account-mini-card">
      <div className="account-mini-avatar-wrap">
        {account.profile_picture ? (
          <img src={account.profile_picture} alt={account.account_name} className="account-mini-avatar" />
        ) : (
          <div className="account-mini-avatar account-mini-avatar--initials" style={{ background: cfg.gradient }}>
            {getInitials(account.account_name)}
          </div>
        )}
        <div className="account-mini-platform" style={{ background: cfg.gradient }}>
          {cfg.icon}
        </div>
      </div>
      <div className="account-mini-info">
        <div className="account-mini-name">{account.account_name}</div>
        <div className="account-mini-handle">
          @{account.account_username || account.account_name?.toLowerCase().replace(/\s+/g, '_')}
        </div>
        {account.followers_count > 0 && (
          <div className="account-mini-followers">
            {account.followers_count.toLocaleString()} followers
          </div>
        )}
      </div>
      <span className={`account-mini-status ${account.is_active ? 'active' : ''}`} title={account.is_active ? 'Active' : 'Inactive'} />
    </div>
  );
}

function MetricCard({ label, value, sub, icon, color = 'purple' }) {
  return (
    <div className={`metric-card ${color}`}>
      <div className="metric-icon">{icon}</div>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      {sub && <div className="metric-sub">{sub}</div>}
    </div>
  );
}

function TrendFeedCard({ trends, onRefresh }) {
  return (
    <div className="card" style={{ height: '100%' }}>
      <div className="card-header">
        <div className="card-title">🔥 Live Trends</div>
        <button className="btn btn-ghost btn-sm" onClick={onRefresh}>Refresh</button>
      </div>
      <div className="trend-list">
        {trends.slice(0, 6).map((t, i) => (
          <div key={t.id || i} className="trend-card">
            <div className="trend-rank">#{i + 1}</div>
            <div className="trend-info">
              <div className="trend-topic">{t.topic}</div>
              <div className="trend-meta">{t.source} · {t.category}</div>
            </div>
            <div className="trend-score">{t.score?.toFixed(0)}</div>
          </div>
        ))}
        {trends.length === 0 && (
          <div className="empty-state" style={{ padding: '30px' }}>
            <p>No trends yet — click Refresh</p>
          </div>
        )}
      </div>
    </div>
  );
}

function RecentContentCard({ items }) {
  const PLATFORM_ICONS = { instagram: '📸', facebook: '📘', twitter: '🐦', linkedin: '💼', tiktok: '🎵', default: '📱' };
  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">📝 Recent Content</div>
        <a href="/studio" className="btn btn-ghost btn-sm" style={{ textDecoration: 'none' }}>View All</a>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.slice(0, 5).map(item => (
          <div key={item.id} className="recent-content-row">
            <span className="recent-content-icon">{PLATFORM_ICONS[item.platform] || PLATFORM_ICONS.default}</span>
            <div className="recent-content-text">
              <div className="recent-content-body">{item.body?.substring(0, 70)}...</div>
              <div className="recent-content-date">{new Date(item.created_at).toLocaleDateString()}</div>
            </div>
            <span className={`badge badge-${item.status}`}>{item.status}</span>
          </div>
        ))}
        {items.length === 0 && (
          <div className="empty-state" style={{ padding: '20px' }}>
            <p>No content yet. <a href="/studio">Go to Content Studio →</a></p>
          </div>
        )}
      </div>
    </div>
  );
}

function QuickActionsCard({ onRefreshTrends }) {
  return (
    <div className="card quick-actions-card">
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: '1.8rem', marginBottom: 10 }}>🚀</div>
        <h3 style={{ color: 'var(--text-primary)', marginBottom: 6, fontSize: '1.1rem' }}>Quick Actions</h3>
        <p style={{ fontSize: '0.85rem' }}>Jump to the right tool</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <a href="/studio" className="btn btn-primary" style={{ justifyContent: 'center', textDecoration: 'none' }}>✍️ Generate Content</a>
        <button className="btn btn-secondary" style={{ justifyContent: 'center' }} onClick={onRefreshTrends}>🔄 Refresh Trends</button>
        <a href="/plans" className="btn btn-secondary" style={{ justifyContent: 'center', textDecoration: 'none' }}>🗺️ Marketing Plans</a>
        <a href="/accounts" className="btn btn-ghost" style={{ justifyContent: 'center', textDecoration: 'none' }}>🔗 Manage Accounts</a>
      </div>
    </div>
  );
}

export default function Dashboard({ apiStatus }) {
  const [overview, setOverview] = useState(null);
  const [trends, setTrends] = useState([]);
  const [recentContent, setRecentContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [growthData, setGrowthData] = useState([]);
  const [accounts, setAccounts] = useState([]);

  const loadData = useCallback(async () => {
    try {
      const [ov, tr, ct, gr, ac] = await Promise.allSettled([
        fetch(`${API}/api/analytics/overview`).then(r => r.json()),
        fetch(`${API}/api/trends?limit=10`).then(r => r.json()),
        fetch(`${API}/api/content?limit=5`).then(r => r.json()),
        fetch(`${API}/api/analytics/growth?days=14`).then(r => r.json()),
        fetch(`${API}/api/accounts`).then(r => r.json()),
      ]);

      if (ov.status === 'fulfilled') setOverview(ov.value);
      if (tr.status === 'fulfilled') setTrends(tr.value.trends || []);
      if (ct.status === 'fulfilled') setRecentContent(ct.value.items || []);
      if (gr.status === 'fulfilled') {
        const snaps = gr.value.snapshots || [];
        const byDate = {};
        snaps.forEach(s => {
          if (!byDate[s.snapshot_date]) byDate[s.snapshot_date] = { date: s.snapshot_date, followers: 0, reach: 0 };
          byDate[s.snapshot_date].followers += s.followers_count || 0;
          byDate[s.snapshot_date].reach += s.reach || 0;
        });
        setGrowthData(Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date)));
      }
      if (ac.status === 'fulfilled') setAccounts(ac.value.accounts || []);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const refreshTrends = async () => {
    await fetch(`${API}/api/trends/refresh`, { method: 'POST' });
    loadData();
  };

  const stats = overview?.stats || {};

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Your social media growth command center</p>
        </div>
        <div className="page-actions">
          {!apiStatus?.gemini && !apiStatus?.openai && (
            <span className="badge badge-demo">⚠️ Demo Mode — Add Gemini API Key</span>
          )}
        </div>
      </div>

      {/* Connected Accounts Strip */}
      {accounts.length > 0 && (
        <div className="accounts-strip">
          <div className="accounts-strip-label">Connected Accounts</div>
          <div className="accounts-strip-row">
            {accounts.map(acc => <AccountMiniCard key={acc.id} account={acc} />)}
            <a href="/accounts" className="accounts-strip-add" style={{ textDecoration: 'none' }}>
              <span style={{ fontSize: '1.4rem' }}>+</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Add Account</span>
            </a>
          </div>
        </div>
      )}

      {/* Metric Grid */}
      <div className="metric-grid">
        <MetricCard label="Total Followers" value={stats.total_followers?.toLocaleString() || '0'} sub="Across all accounts" icon="👥" color="purple" />
        <MetricCard label="Published" value={stats.published || 0} sub="Posts live" icon="✅" color="green" />
        <MetricCard label="In Queue" value={stats.queued || 0} sub="Awaiting publish" icon="⏳" color="amber" />
        <MetricCard label="Drafts" value={stats.drafts || 0} sub="Ready to review" icon="📝" color="cyan" />
        <MetricCard label="Trending Topics" value={stats.trend_count || 0} sub="Live data" icon="🔥" color="pink" />
      </div>

      {/* Growth Chart */}
      {growthData.length > 0 && (
        <div className="card" style={{ marginBottom: 28 }}>
          <div className="card-header">
            <div className="card-title">📈 Follower Growth</div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Last 14 days</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={growthData}>
              <defs>
                <linearGradient id="followerGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
              <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#0d1226', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: 'var(--text-primary)' }} />
              <Area type="monotone" dataKey="followers" stroke="#6366f1" strokeWidth={2.5} fill="url(#followerGrad)" name="Followers" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Main 3-col grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 280px', gap: 24 }}>
        <TrendFeedCard trends={trends} onRefresh={refreshTrends} />
        <RecentContentCard items={recentContent} />
        <QuickActionsCard onRefreshTrends={refreshTrends} />
      </div>
    </div>
  );
}
