import { useState, useEffect } from 'react';
import { API } from '../App';

export default function Settings() {
  const [brand, setBrand] = useState(null);
  const [apiStatus, setApiStatus] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({
    name: '', niche: '', tone: '', target_audience: '',
    keywords: [], posting_frequency: 'daily', auto_publish: false,
  });
  const [keywordInput, setKeywordInput] = useState('');

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/settings/brand`).then(r => r.json()),
      fetch(`${API}/api/settings/api-status`).then(r => r.json()),
    ]).then(([b, s]) => {
      setBrand(b);
      setApiStatus(s);
      setForm({
        name: b.name || '',
        niche: b.niche || '',
        tone: b.tone || '',
        target_audience: b.target_audience || '',
        keywords: b.keywords || [],
        posting_frequency: b.posting_frequency || 'daily',
        auto_publish: !!b.auto_publish,
      });
    });
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/settings/brand`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      setBrand(data);
      showToast('✅ Brand profile saved!');
    } catch (err) {
      showToast(`❌ ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const addKeyword = (e) => {
    if (e.key === 'Enter' && keywordInput.trim()) {
      setForm(p => ({ ...p, keywords: [...p.keywords, keywordInput.trim()] }));
      setKeywordInput('');
    }
  };

  const removeKeyword = (k) => {
    setForm(p => ({ ...p, keywords: p.keywords.filter(x => x !== k) }));
  };

  const API_CONFIGS = [
    {
      key: 'gemini', label: 'Google Gemini AI', icon: '🤖',
      desc: 'Primary AI engine for content generation (Free tier available)',
      link: 'https://aistudio.google.com/apikey',
      envKey: 'GEMINI_API_KEY',
    },
    {
      key: 'meta', label: 'Meta (Instagram + Facebook)', icon: '📱',
      desc: 'Connect and publish to Instagram Business & Facebook Pages',
      link: 'https://developers.facebook.com',
      envKey: 'META_APP_ID + META_APP_SECRET',
    },
    {
      key: 'reddit', label: 'Reddit API', icon: '🔴',
      desc: 'Real-time trend discovery from Reddit communities (Free)',
      link: 'https://www.reddit.com/prefs/apps',
      envKey: 'REDDIT_CLIENT_ID + REDDIT_CLIENT_SECRET',
    },
    {
      key: 'serpapi', label: 'SerpApi (Google Trends)', icon: '🔍',
      desc: 'Google Trends data for trend discovery (100 free searches/month)',
      link: 'https://serpapi.com',
      envKey: 'SERPAPI_KEY',
    },
    {
      key: 'openai', label: 'OpenAI (GPT-4)', icon: '🧠',
      desc: 'Alternative AI engine to Gemini for content generation',
      link: 'https://platform.openai.com',
      envKey: 'OPENAI_API_KEY',
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">⚙️ Settings</h1>
          <p className="page-subtitle">Brand profile, API configuration, and automation settings</p>
        </div>
      </div>

      {/* Brand Profile */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-title" style={{ marginBottom: 20 }}>🏷️ Brand Profile</div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 20 }}>
          These settings shape all AI-generated content and marketing plans
        </p>

        <div className="two-col">
          <div className="form-group">
            <label className="form-label">Brand Name</label>
            <input className="form-input" placeholder="e.g. My Lifestyle Brand" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Niche / Industry</label>
            <input className="form-input" placeholder="e.g. fitness, tech, fashion, food" value={form.niche} onChange={e => setForm(p => ({ ...p, niche: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Brand Tone</label>
            <select className="form-select" value={form.tone} onChange={e => setForm(p => ({ ...p, tone: e.target.value }))}>
              <option value="engaging and relatable">Engaging & Relatable</option>
              <option value="professional">Professional</option>
              <option value="humorous">Humorous</option>
              <option value="inspirational">Inspirational</option>
              <option value="educational">Educational</option>
              <option value="casual">Casual</option>
              <option value="bold and edgy">Bold & Edgy</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Target Audience</label>
            <input className="form-input" placeholder="e.g. young adults 18-35, entrepreneurs" value={form.target_audience} onChange={e => setForm(p => ({ ...p, target_audience: e.target.value }))} />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Brand Keywords / Topics (press Enter to add)</label>
          <input className="form-input" placeholder="Add keyword..." value={keywordInput} onChange={e => setKeywordInput(e.target.value)} onKeyDown={addKeyword} />
          {form.keywords.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {form.keywords.map(k => (
                <span key={k} style={{
                  background: 'var(--primary-glow)', color: 'var(--primary-hover)',
                  border: '1px solid rgba(99,102,241,0.3)', borderRadius: 99,
                  padding: '3px 10px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer'
                }} onClick={() => removeKeyword(k)}>
                  {k} ×
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="two-col">
          <div className="form-group">
            <label className="form-label">Posting Frequency</label>
            <select className="form-select" value={form.posting_frequency} onChange={e => setForm(p => ({ ...p, posting_frequency: e.target.value }))}>
              <option value="multiple_daily">Multiple times daily</option>
              <option value="daily">Once daily</option>
              <option value="3x_week">3x per week</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Auto-Publish</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}>
              <label className="toggle-wrapper">
                <button type="button" className={`toggle ${form.auto_publish ? 'on' : ''}`} onClick={() => setForm(p => ({ ...p, auto_publish: !p.auto_publish }))} />
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  {form.auto_publish ? '🟢 Auto-publishing enabled' : '⚪ Manual approval required'}
                </span>
              </label>
            </div>
            {form.auto_publish && (
              <div className="alert alert-warning" style={{ marginTop: 10, marginBottom: 0 }}>
                <span>⚠️</span> Auto-publish will post content without review. Use with caution.
              </div>
            )}
          </div>
        </div>

        <button className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? <><span className="spinner" />Saving...</> : '💾 Save Brand Profile'}
        </button>
      </div>

      {/* API Configuration Guide */}
      <div className="card">
        <div className="card-title" style={{ marginBottom: 8 }}>🔑 API Configuration</div>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 20 }}>
          Add API keys to <code>server/.env</code> file and restart the server to enable real integrations.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {API_CONFIGS.map(cfg => {
            const isConfigured = apiStatus?.[cfg.key];
            return (
              <div key={cfg.key} style={{
                display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px',
                background: 'var(--bg-input)', border: `1px solid ${isConfigured ? 'rgba(16,185,129,0.2)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-md)',
              }}>
                <span style={{ fontSize: '1.5rem' }}>{cfg.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: 2 }}>{cfg.label}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>{cfg.desc}</div>
                  <code style={{ fontSize: '0.7rem', color: 'var(--accent-amber)' }}>{cfg.envKey}</code>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span className={`badge ${isConfigured ? 'badge-published' : 'badge-draft'}`}>
                    {isConfigured ? '✅ Configured' : '○ Not set'}
                  </span>
                  <a href={cfg.link} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">Get Key →</a>
                </div>
              </div>
            );
          })}
        </div>

        <div className="alert alert-info" style={{ marginTop: 20 }}>
          <span>ℹ️</span>
          <div>
            The app works in <strong>demo mode</strong> without any API keys — using simulated AI responses and mock data.
            Add a <strong>Gemini API key</strong> (free) to enable real AI content generation.
          </div>
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
