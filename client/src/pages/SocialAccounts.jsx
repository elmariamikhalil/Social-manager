import { useState, useEffect } from 'react';
import { API } from '../App';

const PLATFORM_CONFIG = {
  instagram: { color: '#e1306c', gradient: 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)', label: 'Instagram' },
  facebook:  { color: '#1877f2', gradient: 'linear-gradient(135deg, #1877f2, #0d5db5)', label: 'Facebook' },
  twitter:   { color: '#1da1f2', gradient: 'linear-gradient(135deg, #1da1f2, #0d8bd9)', label: 'Twitter/X' },
  linkedin:  { color: '#0077b5', gradient: 'linear-gradient(135deg, #0077b5, #005e8a)', label: 'LinkedIn' },
  tiktok:    { color: '#010101', gradient: 'linear-gradient(135deg, #010101, #ff0050, #00f2ea)', label: 'TikTok' },
  youtube:   { color: '#ff0000', gradient: 'linear-gradient(135deg, #ff0000, #cc0000)', label: 'YouTube' },
};

function PlatformIcon({ platform, size = 22 }) {
  const s = size;
  switch (platform) {
    case 'instagram': return (
      <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
        <defs><linearGradient id={`ig-${s}`} x1="0" y1="32" x2="32" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#F9CE34"/><stop offset="35%" stopColor="#EE2A7B"/><stop offset="100%" stopColor="#6228D7"/></linearGradient></defs>
        <rect width="32" height="32" rx="8" fill={`url(#ig-${s})`}/>
        <rect x="9" y="9" width="14" height="14" rx="4" stroke="white" strokeWidth="2" fill="none"/>
        <circle cx="16" cy="16" r="3.5" stroke="white" strokeWidth="1.8" fill="none"/>
        <circle cx="21.2" cy="10.8" r="1.1" fill="white"/>
      </svg>
    );
    case 'facebook': return (
      <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="8" fill="#1877F2"/>
        <path d="M18.5 27V18h3l.5-3.5h-3.5V12.5c0-1 .4-1.5 1.5-1.5H20V8s-1-.3-2.5-.3c-2.5 0-4 1.5-4 4.2V14.5H11V18h2.5v9h5z" fill="white"/>
      </svg>
    );
    case 'twitter': return (
      <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="8" fill="#1DA1F2"/>
        <path d="M27 10.2a9.4 9.4 0 01-2.6.7 4.6 4.6 0 002-2.5 9.2 9.2 0 01-2.9 1.1 4.6 4.6 0 00-7.8 4.2A13 13 0 015.8 9a4.6 4.6 0 001.4 6.1 4.5 4.5 0 01-2.1-.6v.1a4.6 4.6 0 003.7 4.5 4.6 4.6 0 01-2 .1 4.6 4.6 0 004.3 3.2A9.2 9.2 0 015 23.9a13 13 0 007 2.1c8.4 0 13-7 13-13v-.6a9.2 9.2 0 002-2.2z" fill="white"/>
      </svg>
    );
    case 'linkedin': return (
      <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="8" fill="#0077B5"/>
        <path d="M10 13.5H7v10h3v-10zM8.5 12a1.8 1.8 0 100-3.5 1.8 1.8 0 000 3.5zM26 23.5h-3v-5c0-1.4-.6-2.3-1.9-2.3s-2.1.9-2.1 2.3v5h-3v-10h3v1.4c.6-.9 1.7-1.7 3-1.7 2.4 0 4 1.6 4 4.7v5.6z" fill="white"/>
      </svg>
    );
    case 'tiktok': return (
      <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="8" fill="#010101"/>
        <path d="M21.5 10.4c-1.2-.8-2-2.1-2.2-3.6H17v13c0 1.5-1.2 2.6-2.7 2.6s-2.7-1.2-2.7-2.6 1.2-2.6 2.7-2.6c.3 0 .5 0 .7.1v-3c-.2 0-.5-.1-.7-.1-3.1 0-5.7 2.6-5.7 5.7s2.6 5.7 5.7 5.7 5.7-2.6 5.7-5.7v-7.3c1.3.9 2.9 1.5 4.5 1.5v-3c-.8 0-2-.4-2.8-1.7z" fill="white"/>
      </svg>
    );
    case 'youtube': return (
      <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="8" fill="#FF0000"/>
        <path d="M27.5 11.2s-.3-2.2-1.3-3.1c-1.2-1.3-2.6-1.3-3.2-1.4C20.5 6.5 16 6.5 16 6.5s-4.5 0-7 .2c-.6.1-2 .1-3.2 1.4C4.8 9 4.5 11.2 4.5 11.2S4.2 13.7 4.5 16c.3 2.3 1.3 3.1 1.3 3.1 1.2 1.3 2.6 1.3 3.2 1.4C11.5 20.7 16 20.7 16 20.7s4.5 0 7-.2c.6-.1 2-.1 3.2-1.4.9-.9 1.3-3.1 1.3-3.1S27.8 13.7 27.5 11.2zm-14.8 6.4V10.4l7 3.6-7 3.6z" fill="white"/>
      </svg>
    );
    default: return (
      <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="8" fill="#6366f1"/>
        <text x="16" y="21" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">S</text>
      </svg>
    );
  }
}

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
          <PlatformIcon platform={account.platform} size={12} />
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
              <span className="platform-status-icon">
                <PlatformIcon platform={p} size={24} />
              </span>
              <div>
                <div className="platform-status-name">{cfg?.label || p}</div>
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
