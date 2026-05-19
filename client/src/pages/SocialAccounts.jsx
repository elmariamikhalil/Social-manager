import { useState, useEffect } from 'react';
import { API } from '../App';

const PLATFORM_CONFIG = {
  instagram: { icon: '📸', color: '#e1306c', gradient: 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)', label: 'Instagram' },
  facebook:  { icon: '📘', color: '#1877f2', gradient: 'linear-gradient(135deg, #1877f2, #0d5db5)', label: 'Facebook' },
  twitter:   { icon: '🐦', color: '#1da1f2', gradient: 'linear-gradient(135deg, #1da1f2, #0d8bd9)', label: 'Twitter/X' },
  linkedin:  { icon: '💼', color: '#0077b5', gradient: 'linear-gradient(135deg, #0077b5, #005e8a)', label: 'LinkedIn' },
  tiktok:    { icon: '🎵', color: '#010101', gradient: 'linear-gradient(135deg, #010101, #ff0050, #00f2ea)', label: 'TikTok' },
};

function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function AccountProfileCard({ account, onDisconnect, onToggle }) {
  const cfg = PLATFORM_CONFIG[account.platform] || { icon: '📱', color: '#6366f1', gradient: 'linear-gradient(135deg,#6366f1,#a855f7)', label: account.platform };
  const isDemo = account.account_id?.startsWith('demo_');

  return (
    <div className="profile-card">
      {/* Cover band */}
      <div className="profile-card-cover" style={{ background: cfg.gradient }} />

      {/* Avatar */}
      <div className="profile-card-avatar-wrap">
        {account.profile_picture ? (
          <img src={account.profile_picture} alt={account.account_name} className="profile-card-avatar" />
        ) : (
          <div className="profile-card-avatar profile-card-avatar--initials" style={{ background: cfg.gradient }}>
            {getInitials(account.account_name)}
          </div>
        )}
        <div className="profile-card-platform-badge" style={{ background: cfg.gradient }}>
          {cfg.icon}
        </div>
      </div>

      {/* Info */}
      <div className="profile-card-body">
        <div className="profile-card-name">{account.account_name}</div>
        <div className="profile-card-handle">
          @{account.account_username || account.account_name?.toLowerCase().replace(/\s+/g, '_')}
        </div>

        {/* Stats row */}
        <div className="profile-card-stats">
          <div className="profile-stat">
            <div className="profile-stat-value">{account.followers_count ? account.followers_count.toLocaleString() : '—'}</div>
            <div className="profile-stat-label">Followers</div>
          </div>
          <div className="profile-stat-divider" />
          <div className="profile-stat">
            <div className="profile-stat-value">{account.posts_count || '—'}</div>
            <div className="profile-stat-label">Posts</div>
          </div>
          <div className="profile-stat-divider" />
          <div className="profile-stat">
            <div className="profile-stat-value">{cfg.label}</div>
            <div className="profile-stat-label">Platform</div>
          </div>
        </div>

        {/* Tags */}
        <div className="profile-card-tags">
          {isDemo && <span className="badge badge-demo">Demo</span>}
          {account.page_name && (
            <span className="badge badge-draft" style={{ gap: 4 }}>📄 {account.page_name}</span>
          )}
        </div>

        {/* Connected at */}
        <div className="profile-card-meta">
          Connected {new Date(account.connected_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      </div>

      {/* Footer actions */}
      <div className="profile-card-footer">
        <button
          className={`profile-toggle-btn ${account.is_active ? 'active' : ''}`}
          onClick={() => onToggle(account.id)}
          title="Toggle active status"
        >
          <span className="profile-toggle-dot" />
          {account.is_active ? 'Active' : 'Inactive'}
        </button>
        <button className="btn btn-danger btn-sm" onClick={() => onDisconnect(account.id)}>
          Disconnect
        </button>
      </div>
    </div>
  );
}

export default function SocialAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [metaConfigured, setMetaConfigured] = useState(false);
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState(null);
  const [demoName, setDemoName] = useState('');
  const [demoPlatform, setDemoPlatform] = useState('instagram');
  const [showDemoForm, setShowDemoForm] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = () => {
    fetch(`${API}/api/accounts`)
      .then(r => r.json())
      .then(async d => {
        const accs = d.accounts || [];
        // Attach latest growth snapshot data to each account
        const enriched = await Promise.all(accs.map(async acc => {
          try {
            const snap = await fetch(`${API}/api/analytics/growth?days=1`).then(r => r.json());
            const latest = (snap.snapshots || []).find(s => s.account_id === acc.id);
            return { ...acc, followers_count: latest?.followers_count || 0, posts_count: latest?.posts_count || 0 };
          } catch {
            return acc;
          }
        }));
        setAccounts(enriched);
        setMetaConfigured(d.meta_configured || false);
      });
  };

  useEffect(() => {
    load();
    const params = new URLSearchParams(window.location.search);
    if (params.get('success')) showToast('✅ Account connected successfully!');
    if (params.get('error')) showToast(`❌ ${params.get('error')}`, 'error');
  }, []);

  const connectMeta = async () => {
    const res = await fetch(`${API}/api/accounts/meta/auth-url`);
    const data = await res.json();
    if (data.auth_url) {
      window.location.href = data.auth_url;
    } else {
      showToast('⚠️ Meta API not configured. Add META_APP_ID to your .env file.', 'error');
    }
  };

  const addDemo = async () => {
    if (!demoName.trim()) { showToast('Please enter a name', 'error'); return; }
    setAdding(true);
    const res = await fetch(`${API}/api/accounts/demo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform: demoPlatform, name: demoName }),
    });
    const data = await res.json();
    if (data.success || data.id) {
      showToast('✅ Demo account added!');
      setShowDemoForm(false);
      setDemoName('');
      load();
    }
    setAdding(false);
  };

  const disconnect = async (id) => {
    if (!confirm('Disconnect this account?')) return;
    try {
      const res = await fetch(`${API}/api/accounts/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to disconnect');
      }
      showToast('✅ Account disconnected!');
      load();
    } catch (err) {
      showToast(`❌ ${err.message}`, 'error');
    }
  };

  const toggleActive = async (id) => {
    try {
      const res = await fetch(`${API}/api/accounts/${id}/toggle`, { method: 'PUT' });
      if (!res.ok) throw new Error('Failed to toggle');
      showToast('⚡ Status updated!');
      load();
    } catch (err) {
      showToast(`❌ ${err.message}`, 'error');
    }
  };

  const PLATFORMS = ['instagram', 'facebook', 'twitter', 'linkedin', 'tiktok'];

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Social Accounts</h1>
          <p className="page-subtitle">Manage your connected social media pages and profiles</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={() => setShowDemoForm(!showDemoForm)}>
            + Demo Account
          </button>
          <button className="btn btn-primary" onClick={connectMeta}>
            🔌 Connect Meta
          </button>
        </div>
      </div>

      {/* Platform Status Bar */}
      <div className="platform-status-bar">
        {PLATFORMS.map(p => {
          const cfg = PLATFORM_CONFIG[p];
          const connected = accounts.filter(a => a.platform === p);
          return (
            <div key={p} className={`platform-status-chip ${connected.length > 0 ? 'connected' : ''}`}>
              <span className="platform-status-icon">{cfg.icon}</span>
              <div>
                <div className="platform-status-name">{cfg.label}</div>
                <div className="platform-status-count">
                  {connected.length > 0 ? `${connected.length} page${connected.length > 1 ? 's' : ''}` : 'Not connected'}
                </div>
              </div>
              <span className={`platform-status-dot ${connected.length > 0 ? 'on' : ''}`} />
            </div>
          );
        })}
      </div>

      {/* Meta Setup Warning */}
      {!metaConfigured && (
        <div className="alert alert-warning" style={{ marginBottom: 24 }}>
          <span>⚠️</span>
          <div>
            <strong>Meta API not configured.</strong> Add <code>META_APP_ID</code> and <code>META_APP_SECRET</code> to <code>server/.env</code>, then click Connect Meta.
          </div>
        </div>
      )}

      {/* Demo Account Form */}
      {showDemoForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <div className="card-title">Add Demo Account</div>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowDemoForm(false)}>✕</button>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ flex: 1, minWidth: 180, margin: 0 }}>
              <label className="form-label">Account Name / Page</label>
              <input className="form-input" placeholder="e.g. My Lifestyle Brand" value={demoName} onChange={e => setDemoName(e.target.value)} />
            </div>
            <div className="form-group" style={{ width: 190, margin: 0 }}>
              <label className="form-label">Platform</label>
              <select className="form-select" value={demoPlatform} onChange={e => setDemoPlatform(e.target.value)}>
                {Object.entries(PLATFORM_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.icon} {v.label}</option>
                ))}
              </select>
            </div>
            <button className="btn btn-primary" onClick={addDemo} disabled={adding}>
              {adding ? 'Adding...' : '+ Add'}
            </button>
          </div>
        </div>
      )}

      {/* Accounts Grid */}
      {accounts.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">🔌</div>
            <h3>No accounts connected</h3>
            <p>Connect your Meta account (Instagram + Facebook Pages) or add a demo account to test the workflow</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={connectMeta}>🔌 Connect Meta</button>
              <button className="btn btn-secondary" onClick={() => setShowDemoForm(true)}>+ Demo Account</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="profile-grid">
          {accounts.map(account => (
            <AccountProfileCard
              key={account.id}
              account={account}
              onDisconnect={disconnect}
              onToggle={toggleActive}
            />
          ))}
        </div>
      )}

      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.type === 'error' ? 'alert-error' : 'alert-success'}`}>
            {toast.msg}
          </div>
        </div>
      )}
    </div>
  );
}
