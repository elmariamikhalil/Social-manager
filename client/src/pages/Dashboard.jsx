import { useState, useEffect, useCallback } from 'react';
import { API } from '../App';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';

const PLATFORM_ICONS = { instagram: '📸', facebook: '📘', twitter: '🐦', linkedin: '💼', tiktok: '🎵', default: '📱' };
const getPlatformIcon = (p) => PLATFORM_ICONS[p?.toLowerCase()] || PLATFORM_ICONS.default;

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

function TrendFeedCard({ trends, onGenerate }) {
  return (
    <div className="card" style={{ height: '100%' }}>
      <div className="card-header">
        <div className="card-title">🔥 Live Trends</div>
        <button className="btn btn-ghost btn-sm" onClick={onGenerate}>Refresh</button>
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
            <div>No trends yet</div>
          </div>
        )}
      </div>
    </div>
  );
}

function RecentContentCard({ items }) {
  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">📝 Recent Content</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {items.slice(0, 5).map(item => (
          <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '1.2rem' }}>{getPlatformIcon(item.platform)}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.body?.substring(0, 60)}...
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{new Date(item.created_at).toLocaleDateString()}</div>
            </div>
            <span className={`badge badge-${item.status}`}>{item.status}</span>
          </div>
        ))}
        {items.length === 0 && <div className="empty-state" style={{ padding: '20px' }}><p>No content yet. Go to Content Studio!</p></div>}
      </div>
    </div>
  );
}

function QuickActionsCard({ onRefreshTrends, onGenerateContent }) {
  return (
    <div className="card" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(236,72,153,0.1) 100%)', borderColor: 'rgba(99,102,241,0.3)' }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>🚀</div>
        <h3 style={{ color: 'var(--text-primary)', marginBottom: 4 }}>Quick Actions</h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Start growing your audience now</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={onGenerateContent}>✍️ Generate Content</button>
        <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={onRefreshTrends}>🔄 Refresh Trends</button>
        <a href="/accounts" className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', textDecoration: 'none' }}>🔗 Connect Accounts</a>
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

  const loadData = useCallback(async () => {
    try {
      const [ov, tr, ct, gr] = await Promise.allSettled([
        fetch(`${API}/api/analytics/overview`).then(r => r.json()),
        fetch(`${API}/api/trends?limit=10`).then(r => r.json()),
        fetch(`${API}/api/content?limit=5`).then(r => r.json()),
        fetch(`${API}/api/analytics/growth?days=14`).then(r => r.json()),
      ]);

      if (ov.status === 'fulfilled') setOverview(ov.value);
      if (tr.status === 'fulfilled') setTrends(tr.value.trends || []);
      if (ct.status === 'fulfilled') setRecentContent(ct.value.items || []);
      if (gr.status === 'fulfilled') {
        const snaps = gr.value.snapshots || [];
        // Aggregate all accounts by date
        const byDate = {};
        snaps.forEach(s => {
          if (!byDate[s.snapshot_date]) byDate[s.snapshot_date] = { date: s.snapshot_date, followers: 0, reach: 0 };
          byDate[s.snapshot_date].followers += s.followers_count || 0;
          byDate[s.snapshot_date].reach += s.reach || 0;
        });
        setGrowthData(Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date)));
      }
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

      {/* Metric Grid */}
      <div className="metric-grid">
        <MetricCard label="Total Followers" value={stats.total_followers?.toLocaleString() || '0'} sub="Across all accounts" icon="👥" color="purple" />
        <MetricCard label="Published" value={stats.published || 0} sub="Posts published" icon="✅" color="green" />
        <MetricCard label="In Queue" value={stats.queued || 0} sub="Awaiting publish" icon="⏳" color="amber" />
        <MetricCard label="Drafts" value={stats.drafts || 0} sub="Ready to review" icon="📝" color="cyan" />
        <MetricCard label="Trend Topics" value={stats.trend_count || 0} sub="Live trend data" icon="🔥" color="pink" />
      </div>

      {/* Growth Chart */}
      {growthData.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <div className="card-title">📈 Follower Growth</div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Last 14 days</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={growthData}>
              <defs>
                <linearGradient id="followerGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
              <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)' }} />
              <Area type="monotone" dataKey="followers" stroke="#6366f1" strokeWidth={2} fill="url(#followerGrad)" name="Followers" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 300px', gap: 24 }}>
        <TrendFeedCard trends={trends} onGenerate={refreshTrends} />
        <RecentContentCard items={recentContent} />
        <QuickActionsCard onRefreshTrends={refreshTrends} onGenerateContent={() => window.location.href = '/studio'} />
      </div>
    </div>
  );
}
