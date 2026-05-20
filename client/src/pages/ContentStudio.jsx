import { useState, useEffect } from 'react';
import { API } from '../App';

/* ── Platform SVG Icons ────────────────────────────────────────── */
function PlatformIcon({ platform, size = 28 }) {
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
    default: return (
      <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="8" fill="#6366f1"/>
        <text x="16" y="21" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">S</text>
      </svg>
    );
  }
}

const PLATFORMS = [
  { id: 'instagram', label: 'Instagram' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'twitter', label: 'Twitter/X' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'tiktok', label: 'TikTok' },
];

const TONES = ['engaging and relatable', 'professional', 'humorous', 'inspirational', 'educational', 'casual', 'bold and edgy'];

export default function ContentStudio() {
  const [trends, setTrends] = useState([]);
  const [selectedTrend, setSelectedTrend] = useState(null);
  const [customTopic, setCustomTopic] = useState('');
  const [platform, setPlatform] = useState('instagram');
  const [tone, setTone] = useState('engaging and relatable');
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedItems, setGeneratedItems] = useState([]);
  const [toast, setToast] = useState(null);
  const [loadingTrends, setLoadingTrends] = useState(true);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    fetch(`${API}/api/trends?limit=15`)
      .then(r => r.json())
      .then(d => { setTrends(d.trends || []); setLoadingTrends(false); })
      .catch(() => setLoadingTrends(false));

    fetch(`${API}/api/accounts`)
      .then(r => r.json())
      .then(d => setAccounts(d.accounts || []));
  }, []);

  useEffect(() => {
    const matching = accounts.find(a => a.platform === platform && a.is_active);
    setSelectedAccount(matching ? matching.id.toString() : '');
  }, [platform, accounts]);

  const generate = async () => {
    setGenerating(true);
    try {
      const body = {
        platform,
        tone_override: tone,
        account_id: selectedAccount || null,
      };
      if (selectedTrend) body.trend_id = selectedTrend.id;
      else if (customTopic) body.topic = customTopic;

      const res = await fetch(`${API}/api/content/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (data.item) {
        setGeneratedItems(prev => [data.item, ...prev]);
        showToast(`✅ Content generated using ${data.ai_model}`);
      } else {
        throw new Error(data.error || 'Generation failed');
      }
    } catch (err) {
      showToast(`❌ ${err.message}`, 'error');
    } finally {
      setGenerating(false);
    }
  };

  const approve = async (item) => {
    await fetch(`${API}/api/content/${item.id}/approve`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
    setGeneratedItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'queued' } : i));
    showToast('✅ Approved & added to queue');
  };

  const publishNow = async (item) => {
    const res = await fetch(`${API}/api/content/${item.id}/publish`, { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      setGeneratedItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'published' } : i));
      showToast(`🎉 Published! ${data.result?.demo_mode ? '(Demo mode)' : ''}`);
    } else {
      showToast(`❌ ${data.error}`, 'error');
    }
  };

  const deleteItem = async (item) => {
    await fetch(`${API}/api/content/${item.id}`, { method: 'DELETE' });
    setGeneratedItems(prev => prev.filter(i => i.id !== item.id));
  };

  const updateBody = async (item, newBody) => {
    await fetch(`${API}/api/content/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: newBody }),
    });
    setGeneratedItems(prev => prev.map(i => i.id === item.id ? { ...i, body: newBody } : i));
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">✍️ Content Studio</h1>
          <p className="page-subtitle">Draft, preview, and generate AI posts instantly</p>
        </div>
      </div>

      <div className="studio-layout">
        
        {/* ── Left Panel: Composer ─────────────────────────────────────── */}
        <div className="studio-sidebar">
          
          <div className="card">
            <div className="card-title" style={{ marginBottom: 16 }}>🎯 Choose Platform</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {PLATFORMS.map(p => (
                <button
                  key={p.id}
                  onClick={() => setPlatform(p.id)}
                  className="btn"
                  style={{
                    flexDirection: 'column', padding: '12px 8px', gap: 6,
                    background: platform === p.id ? 'var(--primary-glow)' : 'var(--bg-input)',
                    borderColor: platform === p.id ? 'var(--primary)' : 'var(--border)',
                    color: platform === p.id ? 'var(--primary)' : 'var(--text-secondary)',
                  }}
                >
                  <PlatformIcon platform={p.id} size={24} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{p.label}</span>
                </button>
              ))}
            </div>
            
            <div style={{ marginTop: 20 }}>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">🔗 Post As</label>
                {accounts.filter(a => a.platform === platform && a.is_active).length > 0 ? (
                  <select className="form-select" value={selectedAccount} onChange={e => setSelectedAccount(e.target.value)}>
                    <option value="">No account linked</option>
                    {accounts.filter(a => a.platform === platform && a.is_active).map(a => (
                      <option key={a.id} value={a.id}>{a.account_name}</option>
                    ))}
                  </select>
                ) : (
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', padding: '10px 14px', background: 'var(--bg-input)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
                    No active {platform} account connected. <a href="/accounts" style={{ color: 'var(--primary)' }}>Link one →</a>
                  </div>
                )}
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">🎭 Tone</label>
                <select className="form-select" value={tone} onChange={e => setTone(e.target.value)}>
                  {TONES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-title" style={{ marginBottom: 16 }}>💡 Topic / Prompt</div>
            <textarea
              className="form-textarea"
              placeholder="What do you want to post about today?"
              value={customTopic}
              onChange={e => { setCustomTopic(e.target.value); setSelectedTrend(null); }}
              rows={3}
              style={{ minHeight: 80, marginBottom: 16 }}
            />
            
            <div className="card-title" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 10 }}>Or pick a trending topic:</div>
            
            {loadingTrends ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 46 }} />)}
              </div>
            ) : (
              <div className="trend-list" style={{ maxHeight: 240, overflowY: 'auto', margin: '0 -16px -16px', padding: '0 16px 16px' }}>
                {trends.slice(0, 8).map((t, i) => (
                  <div
                    key={t.id}
                    className={`trend-card ${selectedTrend?.id === t.id ? 'selected' : ''}`}
                    onClick={() => { setSelectedTrend(t); setCustomTopic(''); }}
                    style={{ padding: '8px 12px' }}
                  >
                    <div className="trend-rank" style={{ width: 18, height: 18, fontSize: '0.6rem' }}>{i+1}</div>
                    <div className="trend-info">
                      <div className="trend-topic" style={{ fontSize: '0.8rem' }}>{t.topic}</div>
                      <div className="trend-meta" style={{ fontSize: '0.65rem' }}>{t.source}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            className="btn btn-primary btn-lg"
            style={{ width: '100%', justifyContent: 'center', position: 'sticky', bottom: 16, zIndex: 10, boxShadow: 'var(--shadow-glow)' }}
            onClick={generate}
            disabled={generating || (!customTopic && !selectedTrend)}
          >
            {generating ? <><span className="spinner" />Generating...</> : '✨ Generate Content'}
          </button>
        </div>

        {/* ── Right Panel: Canvas (Previews) ──────────────────────────── */}
        <div className="studio-canvas">
          {generatedItems.length === 0 ? (
            <div className="empty-state" style={{ margin: 'auto' }}>
              <div className="empty-icon" style={{ fontSize: '3rem' }}>✨</div>
              <h3>Canvas is empty</h3>
              <p>Configure your post on the left and click Generate to see the preview here.</p>
            </div>
          ) : (
            generatedItems.map(item => (
              <PostPreviewCard 
                key={item.id} 
                item={item} 
                account={accounts.find(a => a.id.toString() === item.account_id?.toString())}
                onApprove={approve} 
                onPublishNow={publishNow} 
                onDelete={deleteItem} 
                onUpdateBody={updateBody} 
              />
            ))
          )}
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

/* ── Post Preview Card (Realistic Mockup) ────────────────────────────────── */
function PostPreviewCard({ item, account, onApprove, onPublishNow, onDelete, onUpdateBody }) {
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(item.body);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await onUpdateBody(item, body);
    setSaving(false);
    setEditing(false);
  };

  const hashtags = (() => { try { return JSON.parse(item.hashtags || '[]'); } catch { return []; } })();

  // Determine user display info
  const displayName = account?.account_name || 'Your Brand';
  const displayHandle = account ? `@${account.account_username || account.account_name.toLowerCase().replace(/\s+/g,'_')}` : '@yourbrand';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="studio-preview-card">
      {/* Header */}
      <div className="studio-preview-header">
        <div className="studio-preview-user">
          {account?.profile_picture ? (
            <img src={account.profile_picture} alt="" className="studio-preview-avatar" />
          ) : (
            <div className="studio-preview-avatar">{initial}</div>
          )}
          <div>
            <div className="studio-preview-name">{displayName}</div>
            <div className="studio-preview-handle">{displayHandle} · just now</div>
          </div>
        </div>
        <div>
          <PlatformIcon platform={item.platform} size={20} />
        </div>
      </div>

      {/* Image Preview (if generated) */}
      {item.image_url && !editing && (
        <div style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
          <img 
            src={item.image_url.startsWith('http') ? item.image_url : `${API}${item.image_url}`} 
            alt="AI Generated" 
            style={{ width: '100%', maxHeight: 400, objectFit: 'contain', display: 'block' }} 
          />
        </div>
      )}

      {/* Text Content */}
      <div className="studio-preview-body">
        {editing ? (
          <textarea
            className="form-textarea"
            value={body}
            onChange={e => setBody(e.target.value)}
            style={{ minHeight: 120, width: '100%', padding: 12 }}
            autoFocus
          />
        ) : (
          <div>{item.body}</div>
        )}

        {hashtags.length > 0 && !editing && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
            {hashtags.map(h => (
              <span key={h} style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>{h}</span>
            ))}
          </div>
        )}

        {item.image_prompt && !editing && !item.image_url && (
          <div style={{ marginTop: 16, padding: '12px', background: 'var(--bg-input)', borderRadius: 'var(--r-md)', fontSize: '0.78rem', color: 'var(--text-secondary)', borderLeft: '3px solid var(--primary)' }}>
            <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: 4 }}>🎨 Suggested Image:</strong> 
            {item.image_prompt}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="studio-preview-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className={`badge badge-${item.status}`}>{item.status}</span>
          {item.ai_model && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{item.ai_model}</span>}
        </div>

        <div className="studio-preview-actions">
          {editing ? (
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => { setBody(item.body); setEditing(false); }}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>{saving ? 'Saving...' : '💾 Save Edit'}</button>
            </>
          ) : (
            <>
              {item.status === 'draft' && (
                <>
                  <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)} title="Edit copy">✏️</button>
                  <button className="btn btn-danger btn-sm" onClick={() => onDelete(item)} title="Discard">🗑️</button>
                  <div style={{ width: 1, background: 'var(--border)', margin: '0 4px' }} />
                  <button className="btn btn-success btn-sm" onClick={() => onApprove(item)}>Queue</button>
                  <button className="btn btn-primary btn-sm" onClick={() => onPublishNow(item)}>Post Now</button>
                </>
              )}
              {item.status === 'queued' && (
                <>
                  <button className="btn btn-danger btn-sm" onClick={() => onDelete(item)} title="Remove from queue">🗑️</button>
                  <button className="btn btn-primary btn-sm" onClick={() => onPublishNow(item)}>Post Now</button>
                </>
              )}
              {item.status === 'published' && (
                <button className="btn btn-ghost btn-sm" disabled>✓ Published</button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
