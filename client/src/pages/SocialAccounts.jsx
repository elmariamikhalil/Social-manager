import { useState, useEffect } from 'react';
import { API } from '../App';

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
      .then(d => {
        setAccounts(d.accounts || []);
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
        throw new Error(errData.error || 'Failed to disconnect account');
      }
      showToast('✅ Account disconnected successfully!');
      load();
    } catch (err) {
      showToast(`❌ ${err.message}`, 'error');
    }
  };

  const toggleActive = async (id) => {
    try {
      const res = await fetch(`${API}/api/accounts/${id}/toggle`, { method: 'PUT' });
      if (!res.ok) throw new Error('Failed to toggle account status');
      showToast('⚡ Account active status updated!');
      load();
    } catch (err) {
      showToast(`❌ ${err.message}`, 'error');
    }
  };

  const PLATFORM_ICONS = { instagram: '📸', facebook: '📘', twitter: '🐦', linkedin: '💼', tiktok: '🎵' };
  const PLATFORM_COLORS = { instagram: 'var(--accent-pink)', facebook: '#60a5fa', twitter: 'var(--accent-cyan)', linkedin: '#60a5fa', tiktok: 'var(--text-primary)' };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">🔗 Social Accounts</h1>
          <p className="page-subtitle">Connect and manage your social media accounts</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={() => setShowDemoForm(!showDemoForm)}>+ Add Demo Account</button>
          <button className="btn btn-primary" onClick={connectMeta}>🔌 Connect Meta (IG + FB)</button>
        </div>
      </div>

      {/* Meta Setup Guide */}
      {!metaConfigured && (
        <div className="alert alert-warning" style={{ marginBottom: 24 }}>
          <span>⚠️</span>
          <div>
            <strong>Meta API not configured.</strong> To connect real Instagram & Facebook accounts:
            <ol style={{ marginTop: 8, paddingLeft: 20, fontSize: '0.875rem', lineHeight: 2 }}>
              <li>Go to <a href="https://developers.facebook.com" target="_blank">developers.facebook.com</a> and create an app</li>
              <li>Add <strong>META_APP_ID</strong> and <strong>META_APP_SECRET</strong> to <code>server/.env</code></li>
              <li>Set redirect URI to <code>http://localhost:3001/api/accounts/meta/callback</code></li>
              <li>Restart the server and click "Connect Meta" above</li>
            </ol>
            <strong>For now, use demo accounts below to test the full workflow.</strong>
          </div>
        </div>
      )}

      {/* Demo Account Form */}
      {showDemoForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-title" style={{ marginBottom: 16 }}>Add Demo Account</div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: 1, margin: 0 }}>
              <label className="form-label">Account Name / Brand</label>
              <input className="form-input" placeholder="e.g. My Lifestyle Brand" value={demoName} onChange={e => setDemoName(e.target.value)} />
            </div>
            <div className="form-group" style={{ width: 180, margin: 0 }}>
              <label className="form-label">Platform</label>
              <select className="form-select" value={demoPlatform} onChange={e => setDemoPlatform(e.target.value)}>
                <option value="instagram">📸 Instagram</option>
                <option value="facebook">📘 Facebook</option>
                <option value="twitter">🐦 Twitter/X</option>
                <option value="linkedin">💼 LinkedIn</option>
                <option value="tiktok">🎵 TikTok</option>
              </select>
            </div>
            <button className="btn btn-primary" onClick={addDemo} disabled={adding} style={{ marginBottom: 0, whiteSpace: 'nowrap' }}>
              {adding ? 'Adding...' : '+ Add Account'}
            </button>
            <button className="btn btn-ghost" onClick={() => setShowDemoForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Accounts Grid */}
      {accounts.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">🔌</div>
            <h3>No accounts connected</h3>
            <p>Connect your Instagram & Facebook accounts or add a demo account to get started</p>
            <button className="btn btn-primary" onClick={() => setShowDemoForm(true)}>+ Add Demo Account</button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {accounts.map(account => (
            <AccountCard
              key={account.id}
              account={account}
              onDisconnect={disconnect}
              onToggle={toggleActive}
              platformIcon={PLATFORM_ICONS[account.platform] || '📱'}
              platformColor={PLATFORM_COLORS[account.platform] || 'var(--text-primary)'}
            />
          ))}
        </div>
      )}

      {/* Platforms Status */}
      <div className="card" style={{ marginTop: 32 }}>
        <div className="card-title" style={{ marginBottom: 20 }}>📡 Platform Connection Status</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
          {[
            { platform: 'instagram', label: 'Instagram', icon: '📸', note: 'Via Meta Graph API' },
            { platform: 'facebook', label: 'Facebook', icon: '📘', note: 'Via Meta Graph API' },
            { platform: 'twitter', label: 'Twitter/X', icon: '🐦', note: 'Coming soon' },
            { platform: 'linkedin', label: 'LinkedIn', icon: '💼', note: 'Coming soon' },
            { platform: 'tiktok', label: 'TikTok', icon: '🎵', note: 'Coming soon' },
          ].map(p => {
            const connected = accounts.some(a => a.platform === p.platform);
            return (
              <div key={p.platform} style={{
                padding: '16px',
                background: connected ? 'rgba(16, 185, 129, 0.05)' : 'var(--bg-input)',
                border: `1px solid ${connected ? 'rgba(16,185,129,0.2)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-md)',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>{p.icon}</div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: 4 }}>{p.label}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 8 }}>{p.note}</div>
                <span className={`badge ${connected ? 'badge-published' : 'badge-draft'}`}>
                  {connected ? '✅ Connected' : '○ Not connected'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.type === 'error' ? 'alert-error' : 'alert-success'}`} style={{ border: 'none' }}>
            {toast.msg}
          </div>
        </div>
      )}
    </div>
  );
}

function AccountCard({ account, onDisconnect, onToggle, platformIcon, platformColor }) {
  return (
    <div className="card glow-hover" style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
        <div style={{
          width: 52, height: 52, borderRadius: '50%',
          background: `linear-gradient(135deg, ${platformColor}22, ${platformColor}44)`,
          border: `2px solid ${platformColor}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.5rem', flexShrink: 0,
        }}>
          {platformIcon}
        </div>
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
            {account.account_name}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            @{account.account_username || account.account_name?.toLowerCase().replace(/\s+/g, '_')}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <span className={`badge badge-${account.platform}`}>{platformIcon} {account.platform}</span>
        {account.account_id?.startsWith('demo_') && <span className="badge badge-demo">Demo</span>}
        <button
          className={`badge ${account.is_active ? 'badge-published' : 'badge-draft'}`}
          onClick={() => onToggle(account.id)}
          style={{
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            transition: 'all 0.2s ease',
          }}
          title="Click to toggle active status"
        >
          {account.is_active ? '🟢 Active' : '⚪ Inactive'}
        </button>
      </div>

      {account.page_name && (
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 12 }}>
          📄 Page: {account.page_name}
        </div>
      )}

      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 16 }}>
        Connected {new Date(account.connected_at).toLocaleDateString()}
      </div>

      <button className="btn btn-danger btn-sm" onClick={() => onDisconnect(account.id)} style={{ width: '100%', justifyContent: 'center' }}>
        Disconnect
      </button>
    </div>
  );
}
