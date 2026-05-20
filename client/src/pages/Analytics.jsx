import { useState, useEffect } from 'react';
import { API } from '../App';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#6366f1', '#ec4899', '#06b6d4', '#10b981', '#f59e0b'];

export default function Analytics() {
  const [overview, setOverview] = useState(null);
  const [growth, setGrowth] = useState([]);
  const [contentStats, setContentStats] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [days, setDays] = useState(30);
  const [simulating, setSimulating] = useState(false);
  const [tab, setTab] = useState('growth');

  const loadAll = async () => {
    const [ov, gr, cs, ac] = await Promise.allSettled([
      fetch(`${API}/api/analytics/overview`).then(r => r.json()),
      fetch(`${API}/api/analytics/growth?days=${days}&${selectedAccount !== 'all' ? `account_id=${selectedAccount}` : ''}`).then(r => r.json()),
      fetch(`${API}/api/analytics/content?days=${days}`).then(r => r.json()),
      fetch(`${API}/api/accounts`).then(r => r.json()),
    ]);
    if (ov.status === 'fulfilled') setOverview(ov.value);
    if (gr.status === 'fulfilled') {
      const snaps = gr.value.snapshots || [];
      const byDate = {};
      snaps.forEach(s => {
        if (!byDate[s.snapshot_date]) byDate[s.snapshot_date] = { date: s.snapshot_date, followers: 0, reach: 0, impressions: 0 };
        byDate[s.snapshot_date].followers += s.followers_count || 0;
        byDate[s.snapshot_date].reach += s.reach || 0;
        byDate[s.snapshot_date].impressions += s.impressions || 0;
      });
      setGrowth(Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date)));
    }
    if (cs.status === 'fulfilled') setContentStats(cs.value);
    if (ac.status === 'fulfilled') setAccounts(ac.value.accounts || []);
  };

  useEffect(() => { loadAll(); }, [days, selectedAccount]);

  const simulateGrowth = async () => {
    setSimulating(true);
    await fetch(`${API}/api/analytics/growth/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ days }),
    });
    await loadAll();
    setSimulating(false);
  };

  const stats = overview?.stats || {};

  const chartTooltipStyle = {
    contentStyle: { background: '#ffffff', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', boxShadow: 'var(--shadow-md)', fontSize: '0.8rem' },
    labelStyle: { fontWeight: 700, color: 'var(--text-primary)' },
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">📊 Analytics</h1>
          <p className="page-subtitle">Track your growth, reach, and content performance</p>
        </div>
        <div className="page-actions">
          <select className="form-select" style={{ width: 'auto' }} value={days} onChange={e => setDays(parseInt(e.target.value))}>
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          {accounts.length > 1 && (
            <select className="form-select" style={{ width: 'auto' }} value={selectedAccount} onChange={e => setSelectedAccount(e.target.value)}>
              <option value="all">All accounts</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.account_username || a.account_name}</option>)}
            </select>
          )}
          {accounts.length > 0 && (
            <button className="btn btn-secondary btn-sm" onClick={simulateGrowth} disabled={simulating}>
              {simulating ? <><span className="spinner" />Simulating...</> : '🎭 Simulate Growth'}
            </button>
          )}
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="metric-grid">
        <div className="metric-card purple">
          <div className="metric-icon">👥</div>
          <div className="metric-label">Total Followers</div>
          <div className="metric-value">{stats.total_followers?.toLocaleString() || '0'}</div>
          <div className="metric-sub">All accounts combined</div>
        </div>
        <div className="metric-card green">
          <div className="metric-icon">✅</div>
          <div className="metric-label">Posts Published</div>
          <div className="metric-value">{stats.published || 0}</div>
        </div>
        <div className="metric-card cyan">
          <div className="metric-icon">📱</div>
          <div className="metric-label">Accounts</div>
          <div className="metric-value">{stats.account_count || 0}</div>
        </div>
        <div className="metric-card amber">
          <div className="metric-icon">🗺️</div>
          <div className="metric-label">Marketing Plans</div>
          <div className="metric-value">{stats.plan_count || 0}</div>
        </div>
      </div>

      {/* No data notice */}
      {accounts.length === 0 && (
        <div className="alert alert-warning">
          <span>⚠️</span>
          <div>
            No social accounts connected. <a href="/accounts">Add a demo account</a> first, then click "Simulate Growth" to see analytics.
          </div>
        </div>
      )}

      {accounts.length > 0 && growth.length === 0 && (
        <div className="alert alert-info">
          <span>ℹ️</span>
          <div>No growth data yet. Click <strong>Simulate Growth</strong> above to generate demo data for the charts.</div>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        {['growth', 'content', 'platforms'].map(t => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t === 'growth' ? '📈 Growth' : t === 'content' ? '📝 Content' : '🌐 Platforms'}
          </button>
        ))}
      </div>

      {/* Growth Tab */}
      {tab === 'growth' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="card">
            <div className="card-header">
              <div className="card-title">📈 Follower Growth</div>
            </div>
            {growth.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={growth}>
                  <defs>
                    <linearGradient id="follGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                  <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                  <Tooltip {...chartTooltipStyle} />
                  <Area type="monotone" dataKey="followers" stroke="#6366f1" strokeWidth={2.5} fill="url(#follGrad)" name="Followers" />
                </AreaChart>
              </ResponsiveContainer>
            ) : <div className="empty-state"><p>No growth data available</p></div>}
          </div>

          <div className="two-col">
            <div className="card">
              <div className="card-header"><div className="card-title">👁️ Reach Over Time</div></div>
              {growth.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={growth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" stroke="var(--text-muted)" tick={{ fontSize: 10 }} />
                    <YAxis stroke="var(--text-muted)" tick={{ fontSize: 10 }} />
                    <Tooltip {...chartTooltipStyle} />
                    <Line type="monotone" dataKey="reach" stroke="#06b6d4" strokeWidth={2} dot={false} name="Reach" />
                  </LineChart>
                </ResponsiveContainer>
              ) : <div className="empty-state" style={{ padding: 30 }}><p>No data</p></div>}
            </div>

            <div className="card">
              <div className="card-header"><div className="card-title">📊 Impressions</div></div>
              {growth.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={growth.slice(-7)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" stroke="var(--text-muted)" tick={{ fontSize: 10 }} />
                    <YAxis stroke="var(--text-muted)" tick={{ fontSize: 10 }} />
                    <Tooltip {...chartTooltipStyle} />
                    <Bar dataKey="impressions" fill="#ec4899" radius={[4,4,0,0]} name="Impressions" />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="empty-state" style={{ padding: 30 }}><p>No data</p></div>}
            </div>
          </div>

          {/* Per-account table */}
          {accounts.length > 0 && (
            <div className="card">
              <div className="card-header"><div className="card-title">🔗 Account Summary</div></div>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Platform</th>
                      <th>Account</th>
                      <th>Followers</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(overview?.growth || []).map(a => (
                      <tr key={a.account_username}>
                        <td><span className={`badge badge-${a.platform}`}>{a.platform}</span></td>
                        <td style={{ color: 'var(--text-primary)' }}>@{a.account_username || 'unknown'}</td>
                        <td style={{ color: 'var(--accent-green)', fontWeight: 700 }}>{a.followers_count?.toLocaleString() || 0}</td>
                        <td><span className="badge badge-published">Active</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Content Tab */}
      {tab === 'content' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="card">
            <div className="card-header"><div className="card-title">📝 Content by Status</div></div>
            {contentStats?.by_status?.length > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
                <ResponsiveContainer width="40%" height={200}>
                  <PieChart>
                    <Pie data={contentStats.by_status} cx="50%" cy="50%" outerRadius={80} dataKey="count" nameKey="status" label={({ status, count }) => `${status}: ${count}`} labelLine={false}>
                      {contentStats.by_status.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip {...chartTooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ flex: 1 }}>
                  {contentStats.by_status.map((s, i) => (
                    <div key={s.status} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <div style={{ width: 12, height: 12, borderRadius: 2, background: COLORS[i % COLORS.length] }} />
                      <span style={{ flex: 1, textTransform: 'capitalize', fontSize: '0.875rem' }}>{s.status}</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{s.count}</strong>
                    </div>
                  ))}
                </div>
              </div>
            ) : <div className="empty-state" style={{ padding: 30 }}><p>No content data yet</p></div>}
          </div>

          {contentStats?.recent_published?.length > 0 && (
            <div className="card">
              <div className="card-header"><div className="card-title">✅ Recently Published</div></div>
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>Content</th><th>Platform</th><th>Published</th></tr></thead>
                  <tbody>
                    {contentStats.recent_published.map(item => (
                      <tr key={item.id}>
                        <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>
                          {item.body?.substring(0, 80)}...
                        </td>
                        <td><span className={`badge badge-${item.platform}`}>{item.platform}</span></td>
                        <td>{item.published_at ? new Date(item.published_at).toLocaleDateString() : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Platforms Tab */}
      {tab === 'platforms' && (
        <div className="card">
          <div className="card-header"><div className="card-title">🌐 Content by Platform</div></div>
          {contentStats?.by_platform?.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={contentStats.by_platform}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="platform" stroke="var(--text-muted)" tick={{ fontSize: 12 }} />
                <YAxis stroke="var(--text-muted)" tick={{ fontSize: 12 }} />
                <Tooltip {...chartTooltipStyle} />
                <Bar dataKey="count" fill="#6366f1" radius={[6,6,0,0]} name="Total Content" />
                <Bar dataKey="published" fill="#10b981" radius={[6,6,0,0]} name="Published" />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="empty-state"><p>No platform data yet</p></div>}
        </div>
      )}
    </div>
  );
}
