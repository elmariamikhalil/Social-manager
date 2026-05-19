import { useState, useEffect } from 'react';
import { API } from '../App';

const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', icon: '📸' },
  { id: 'facebook', label: 'Facebook', icon: '📘' },
  { id: 'twitter', label: 'Twitter/X', icon: '🐦' },
  { id: 'linkedin', label: 'LinkedIn', icon: '💼' },
  { id: 'tiktok', label: 'TikTok', icon: '🎵' },
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
          <p className="page-subtitle">Generate AI-powered content from trending topics</p>
        </div>
      </div>

      <div className="sidebar-layout">
        {/* Controls Panel */}
        <div>
          {/* Platform Selector */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-title" style={{ marginBottom: 16 }}>🎯 Platform</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {PLATFORMS.map(p => (
                <button
                  key={p.id}
                  onClick={() => setPlatform(p.id)}
                  className="btn"
                  style={{
                    flex: '1 0 auto',
                    justifyContent: 'center',
                    background: platform === p.id ? 'var(--primary-glow)' : 'var(--bg-input)',
                    borderColor: platform === p.id ? 'var(--primary)' : 'var(--border)',
                    color: platform === p.id ? 'var(--primary-hover)' : 'var(--text-secondary)',
                  }}
                >
                  {p.icon} {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tone Selector */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-title" style={{ marginBottom: 12 }}>🎭 Tone</div>
            <select className="form-select" value={tone} onChange={e => setTone(e.target.value)}>
              {TONES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>

          {/* Account Selector */}
          {accounts.length > 0 && (
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-title" style={{ marginBottom: 12 }}>🔗 Post As</div>
              <select className="form-select" value={selectedAccount} onChange={e => setSelectedAccount(e.target.value)}>
                <option value="">No account linked</option>
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.account_name} ({a.platform})</option>
                ))}
              </select>
            </div>
          )}

          {/* Custom Topic */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-title" style={{ marginBottom: 12 }}>💡 Custom Topic (optional)</div>
            <textarea
              className="form-textarea"
              placeholder="Enter your own topic or idea..."
              value={customTopic}
              onChange={e => setCustomTopic(e.target.value)}
              rows={3}
              style={{ minHeight: 80 }}
            />
          </div>

          {/* Generate Button */}
          <button
            className="btn btn-primary btn-lg"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={generate}
            disabled={generating}
          >
            {generating ? <><span className="spinner" />Generating...</> : '✨ Generate Content'}
          </button>
        </div>

        {/* Trends Sidebar */}
        <div>
          <div className="card">
            <div className="card-header">
              <div className="card-title">🔥 Select a Trend</div>
              {selectedTrend && (
                <button className="btn btn-ghost btn-sm" onClick={() => setSelectedTrend(null)}>Clear</button>
              )}
            </div>
            {loadingTrends ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 60 }} />)}
              </div>
            ) : (
              <div className="trend-list">
                {trends.map((t, i) => (
                  <div
                    key={t.id}
                    className={`trend-card ${selectedTrend?.id === t.id ? 'selected' : ''}`}
                    onClick={() => { setSelectedTrend(t); setCustomTopic(''); }}
                  >
                    <div className="trend-rank">#{i+1}</div>
                    <div className="trend-info">
                      <div className="trend-topic">{t.topic}</div>
                      <div className="trend-meta">{t.source}</div>
                    </div>
                    <div className="trend-score">{t.score?.toFixed(0)}</div>
                  </div>
                ))}
                {trends.length === 0 && (
                  <div className="empty-state" style={{ padding: '20px' }}>
                    <p>No trends. Click refresh on dashboard.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Generated Content */}
      {generatedItems.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <h2 style={{ marginBottom: 16 }}>Generated Content</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {generatedItems.map(item => (
              <GeneratedCard key={item.id} item={item} onApprove={approve} onPublishNow={publishNow} onDelete={deleteItem} onUpdateBody={updateBody} />
            ))}
          </div>
        </div>
      )}

      {/* Toast */}
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

function GeneratedCard({ item, onApprove, onPublishNow, onDelete, onUpdateBody }) {
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

  return (
    <div className="content-card">
      <div className="content-meta">
        <span className={`badge badge-${item.platform}`}>
          {item.platform === 'instagram' ? '📸' : item.platform === 'facebook' ? '📘' : '📱'} {item.platform}
        </span>
        <span className={`badge badge-${item.status}`}>{item.status}</span>
        {item.ai_model && <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>via {item.ai_model}</span>}
      </div>

      {editing ? (
        <textarea
          className="form-textarea"
          value={body}
          onChange={e => setBody(e.target.value)}
          style={{ minHeight: 150, marginBottom: 10 }}
        />
      ) : (
        <div className="content-body">{item.body}</div>
      )}

      {hashtags.length > 0 && !editing && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 10 }}>
          {hashtags.slice(0, 8).map(h => (
            <span key={h} style={{ fontSize: '0.72rem', color: 'var(--primary)', background: 'var(--primary-glow)', padding: '2px 8px', borderRadius: 99 }}>{h}</span>
          ))}
        </div>
      )}

      {item.image_prompt && !editing && (
        <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', color: 'var(--text-muted)', borderLeft: '3px solid var(--accent-pink)' }}>
          <strong style={{ color: 'var(--accent-pink)' }}>🎨 Image Prompt:</strong> {item.image_prompt}
        </div>
      )}

      {item.image_url && !editing && (
        <div style={{ marginTop: 12 }}>
          <img 
            src={item.image_url.startsWith('http') ? item.image_url : `${API}${item.image_url}`} 
            alt="AI Generated" 
            style={{ width: '100%', maxHeight: 350, objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }} 
          />
        </div>
      )}

      <div className="content-actions">
        {editing ? (
          <>
            <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>{saving ? 'Saving...' : '💾 Save'}</button>
            <button className="btn btn-ghost btn-sm" onClick={() => { setBody(item.body); setEditing(false); }}>Cancel</button>
          </>
        ) : (
          <>
            {item.status === 'draft' && (
              <>
                <button className="btn btn-success btn-sm" onClick={() => onApprove(item)}>✅ Approve</button>
                <button className="btn btn-primary btn-sm" onClick={() => onPublishNow(item)}>🚀 Publish Now</button>
                <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>✏️ Edit</button>
              </>
            )}
            {item.status === 'queued' && (
              <button className="btn btn-primary btn-sm" onClick={() => onPublishNow(item)}>🚀 Publish Now</button>
            )}
            {item.status === 'published' && (
              <span style={{ fontSize: '0.8rem', color: 'var(--accent-green)' }}>🎉 Published!</span>
            )}
            <button className="btn btn-danger btn-sm" onClick={() => onDelete(item)}>🗑️</button>
          </>
        )}
      </div>
    </div>
  );
}
