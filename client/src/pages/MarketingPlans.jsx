import { useState, useEffect } from 'react';
import { API } from '../App';

export default function MarketingPlans() {
  const [plans, setPlans] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    period: '30 days',
    platforms: ['instagram', 'facebook'],
    goals: '',
  });

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  const load = () => {
    fetch(`${API}/api/marketing`)
      .then(r => r.json())
      .then(d => setPlans(d.plans || []));
  };

  useEffect(() => { load(); }, []);

  const generate = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`${API}/api/marketing/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.plan) {
        showToast('✅ Marketing plan generated!');
        load();
        setSelected(data.plan);
        setShowForm(false);
      } else throw new Error(data.error);
    } catch (err) {
      showToast(`❌ ${err.message}`, 'error');
    } finally {
      setGenerating(false);
    }
  };

  const deletePlan = async (id) => {
    if (!confirm('Delete this plan?')) return;
    await fetch(`${API}/api/marketing/${id}`, { method: 'DELETE' });
    if (selected?.id === id) setSelected(null);
    load();
    showToast('Plan deleted');
  };

  const togglePlatform = (p) => {
    setForm(prev => ({
      ...prev,
      platforms: prev.platforms.includes(p) ? prev.platforms.filter(x => x !== p) : [...prev.platforms, p],
    }));
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">🗺️ Marketing Plans</h1>
          <p className="page-subtitle">AI-generated growth strategies based on real-time trends</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            ✨ Generate New Plan
          </button>
        </div>
      </div>

      {/* Generation Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-title" style={{ marginBottom: 16 }}>📋 Plan Configuration</div>
          <div className="two-col">
            <div>
              <div className="form-group">
                <label className="form-label">Time Period</label>
                <select className="form-select" value={form.period} onChange={e => setForm(p => ({ ...p, period: e.target.value }))}>
                  <option value="7 days">7-Day Sprint</option>
                  <option value="30 days">30-Day Plan</option>
                  <option value="90 days">90-Day Strategy</option>
                  <option value="6 months">6-Month Roadmap</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Goals (optional)</label>
                <textarea className="form-textarea" rows={3} style={{ minHeight: 80 }} placeholder="e.g. Reach 10K followers, launch product, build community..."
                  value={form.goals} onChange={e => setForm(p => ({ ...p, goals: e.target.value }))} />
              </div>
            </div>
            <div>
              <div className="form-group">
                <label className="form-label">Target Platforms</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[['instagram','📸','Instagram'], ['facebook','📘','Facebook'], ['twitter','🐦','Twitter/X'], ['linkedin','💼','LinkedIn'], ['tiktok','🎵','TikTok']].map(([id, icon, label]) => (
                    <label key={id} className="toggle-wrapper" style={{ cursor: 'pointer' }}>
                      <button type="button" className={`toggle ${form.platforms.includes(id) ? 'on' : ''}`} onClick={() => togglePlatform(id)} />
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{icon} {label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button className="btn btn-primary" onClick={generate} disabled={generating}>
              {generating ? <><span className="spinner" />Generating with AI...</> : '🗺️ Generate Plan'}
            </button>
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="sidebar-layout">
        {/* Plan List */}
        <div>
          {plans.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-icon">🗺️</div>
                <h3>No marketing plans yet</h3>
                <p>Generate your first AI marketing plan based on current trends</p>
                <button className="btn btn-primary" onClick={() => setShowForm(true)}>Generate First Plan</button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {plans.map(plan => (
                <div
                  key={plan.id}
                  className="card glow-hover"
                  style={{ cursor: 'pointer', borderColor: selected?.id === plan.id ? 'var(--primary)' : 'var(--border)' }}
                  onClick={() => setSelected(plan)}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem', marginBottom: 4 }}>{plan.title}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 10 }}>
                        📅 {plan.period} · {new Date(plan.created_at).toLocaleDateString()}
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {(JSON.parse(plan.platforms || '[]')).map(p => (
                          <span key={p} className={`badge badge-${p}`}>{p}</span>
                        ))}
                      </div>
                    </div>
                    <button className="btn btn-danger btn-sm btn-icon" onClick={(e) => { e.stopPropagation(); deletePlan(plan.id); }}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Plan Detail */}
        <div>
          {selected ? (
            <div className="card" style={{ position: 'sticky', top: 24 }}>
              <div className="card-header">
                <div className="card-title">📄 {selected.title}</div>
              </div>
              <div style={{
                maxHeight: '70vh',
                overflowY: 'auto',
                fontSize: '0.875rem',
                lineHeight: 1.8,
                color: 'var(--text-secondary)',
                whiteSpace: 'pre-wrap',
              }}>
                {selected.strategy}
              </div>
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: '2rem', marginBottom: 12 }}>👈</div>
              <p>Select a plan to view its full strategy</p>
            </div>
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
