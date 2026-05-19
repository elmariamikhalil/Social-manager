import { useState, useEffect } from 'react';
import { API } from '../App';

const PLATFORM_ICONS = { instagram: '📸', facebook: '📘', twitter: '🐦', linkedin: '💼', tiktok: '🎵' };

// Parse raw strategy text into visual sections
function parsePlanSections(strategy = '') {
  const lines = strategy.split('\n');
  const sections = [];
  let current = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Detect headings: ## Heading or # Heading
    if (/^#{1,3}\s/.test(trimmed)) {
      if (current) sections.push(current);
      const level = trimmed.match(/^#+/)[0].length;
      current = {
        type: level === 1 ? 'title' : level === 2 ? 'phase' : 'subphase',
        heading: trimmed.replace(/^#+\s*/, ''),
        items: [],
      };
    } else if (/^[-*•]\s/.test(trimmed)) {
      if (!current) current = { type: 'phase', heading: 'Details', items: [] };
      current.items.push(trimmed.replace(/^[-*•]\s*/, ''));
    } else if (/^\d+\.\s/.test(trimmed)) {
      if (!current) current = { type: 'phase', heading: 'Details', items: [] };
      current.items.push(trimmed.replace(/^\d+\.\s*/, ''));
    } else if (trimmed) {
      if (!current) current = { type: 'phase', heading: 'Overview', items: [] };
      current.items.push(trimmed);
    }
  }
  if (current) sections.push(current);
  return sections;
}

const SECTION_ICONS = {
  'executive': '🎯', 'summary': '🎯', 'goal': '🎯',
  'week 1': '📅', 'week 2': '📅', 'week 3': '📅', 'week 4': '📅',
  'content': '✍️', 'calendar': '📆', 'schedule': '📆',
  'hashtag': '#️⃣', 'engagement': '💬', 'community': '🤝',
  'kpi': '📊', 'metric': '📊', 'track': '📊',
  'growth': '📈', 'hack': '⚡', 'platform': '📱',
  'collab': '🤝', 'influencer': '⭐', 'giveaway': '🎁',
};

function getSectionIcon(heading = '') {
  const lower = heading.toLowerCase();
  for (const [key, icon] of Object.entries(SECTION_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return '📌';
}

function PlanDetailView({ plan, onLaunch, launching }) {
  const sections = parsePlanSections(plan.strategy);
  const platforms = (() => { try { return JSON.parse(plan.platforms || '[]'); } catch { return []; } })();

  return (
    <div className="plan-detail">
      {/* Plan header */}
      <div className="plan-detail-header">
        <div>
          <h2 className="plan-detail-title">{plan.title}</h2>
          <div className="plan-detail-meta">
            <span>📅 {plan.period}</span>
            <span>·</span>
            <span>{new Date(plan.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
          <div className="plan-detail-platforms">
            {platforms.map(p => (
              <span key={p} className={`badge badge-${p}`}>{PLATFORM_ICONS[p] || '📱'} {p}</span>
            ))}
            <span className={`badge ${plan.status === 'launched' ? 'badge-published' : 'badge-draft'}`}>
              {plan.status === 'launched' ? '✅ Launched' : '📋 Draft'}
            </span>
          </div>
        </div>
      </div>

      {/* Launch CTA */}
      {plan.status !== 'launched' && (
        <div className="plan-launch-cta">
          <div className="plan-launch-cta-text">
            <div className="plan-launch-cta-title">Ready to execute this plan?</div>
            <div className="plan-launch-cta-sub">AI will create {platforms.length * 5}+ ready-to-post content drafts from this strategy</div>
          </div>
          <button
            className="btn-launch"
            onClick={() => onLaunch(plan)}
            disabled={launching}
          >
            {launching ? (
              <><span className="spinner" /> Generating Content...</>
            ) : (
              <><span>🚀</span> Launch Plan</>
            )}
          </button>
        </div>
      )}

      {plan.status === 'launched' && (
        <div className="alert alert-success" style={{ marginBottom: 20 }}>
          ✅ This plan has been launched! Check Content Studio or Scheduler to see the generated drafts.
        </div>
      )}

      {/* Structured sections */}
      <div className="plan-sections">
        {sections.filter(s => s.type !== 'title').map((section, idx) => (
          <div key={idx} className={`plan-section plan-section--${section.type}`}>
            <div className="plan-section-header">
              <span className="plan-section-icon">{getSectionIcon(section.heading)}</span>
              <span className="plan-section-heading">{section.heading}</span>
            </div>
            {section.items.length > 0 && (
              <ul className="plan-section-items">
                {section.items.map((item, i) => (
                  <li key={i} className="plan-section-item">{item}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function PlanCard({ plan, isSelected, onClick, onDelete }) {
  const platforms = (() => { try { return JSON.parse(plan.platforms || '[]'); } catch { return []; } })();
  const isLaunched = plan.status === 'launched';

  return (
    <div
      className={`plan-card ${isSelected ? 'selected' : ''} ${isLaunched ? 'launched' : ''}`}
      onClick={onClick}
    >
      <div className="plan-card-accent" />
      <div className="plan-card-content">
        <div className="plan-card-top">
          <div>
            <div className="plan-card-title">{plan.title}</div>
            <div className="plan-card-meta">
              <span className="plan-period-badge">📅 {plan.period}</span>
              <span className="plan-card-date">{new Date(plan.created_at).toLocaleDateString()}</span>
            </div>
          </div>
          <button
            className="btn btn-danger btn-icon btn-sm"
            onClick={(e) => { e.stopPropagation(); onDelete(plan.id); }}
            title="Delete plan"
          >
            🗑️
          </button>
        </div>

        <div className="plan-card-platforms">
          {platforms.map(p => (
            <span key={p} className={`badge badge-${p}`}>{PLATFORM_ICONS[p] || '📱'} {p}</span>
          ))}
        </div>

        <div className="plan-card-status">
          {isLaunched ? (
            <span className="badge badge-published">✅ Launched</span>
          ) : (
            <span className="badge badge-draft">📋 Draft</span>
          )}
          {isSelected && <span style={{ fontSize: '0.7rem', color: 'var(--primary-light)' }}>← Viewing</span>}
        </div>
      </div>
    </div>
  );
}

export default function MarketingPlans() {
  const [plans, setPlans] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    period: '30 days',
    platforms: ['instagram', 'facebook'],
    goals: '',
  });

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 4000); };

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

  const launchPlan = async (plan) => {
    if (!confirm(`Launch "${plan.title}"? This will generate ~10 draft posts from your plan.`)) return;
    setLaunching(true);
    try {
      const res = await fetch(`${API}/api/marketing/${plan.id}/launch`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast(`🚀 Plan launched! Created ${data.created} draft posts — check Content Studio!`);
        load();
        // Refresh selected plan to show launched state
        setSelected(prev => prev?.id === plan.id ? { ...prev, status: 'launched' } : prev);
      } else throw new Error(data.error);
    } catch (err) {
      showToast(`❌ ${err.message}`, 'error');
    } finally {
      setLaunching(false);
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
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Marketing Plans</h1>
          <p className="page-subtitle">AI-generated growth strategies — build and launch your content calendar</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            ✨ Generate Plan
          </button>
        </div>
      </div>

      {/* Generation Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: 28 }}>
          <div className="card-header">
            <div className="card-title">📋 Configure Your Plan</div>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>✕</button>
          </div>
          <div className="two-col">
            <div>
              <div className="form-group">
                <label className="form-label">Time Period</label>
                <select className="form-select" value={form.period} onChange={e => setForm(p => ({ ...p, period: e.target.value }))}>
                  <option value="7 days">⚡ 7-Day Sprint</option>
                  <option value="30 days">📅 30-Day Plan</option>
                  <option value="90 days">🗓️ 90-Day Strategy</option>
                  <option value="6 months">📆 6-Month Roadmap</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Goals (optional)</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  style={{ minHeight: 90 }}
                  placeholder="e.g. Reach 10K followers, launch new product, build community..."
                  value={form.goals}
                  onChange={e => setForm(p => ({ ...p, goals: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <div className="form-group">
                <label className="form-label">Target Platforms</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {Object.entries(PLATFORM_ICONS).map(([id, icon]) => (
                    <label key={id} className="toggle-wrapper" style={{ cursor: 'pointer' }}>
                      <button
                        type="button"
                        className={`toggle ${form.platforms.includes(id) ? 'on' : ''}`}
                        onClick={() => togglePlatform(id)}
                      />
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{icon} {id.charAt(0).toUpperCase() + id.slice(1)}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button className="btn btn-primary" onClick={generate} disabled={generating}>
              {generating ? <><span className="spinner" /> Generating with AI...</> : '🗺️ Generate Plan'}
            </button>
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Main layout */}
      <div className="plans-layout">
        {/* Plans List */}
        <div className="plans-list">
          <div className="plans-list-header">
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              {plans.length} Plan{plans.length !== 1 ? 's' : ''}
            </span>
          </div>

          {plans.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-icon">🗺️</div>
                <h3>No marketing plans yet</h3>
                <p>Generate your first AI-powered marketing plan based on current trends</p>
                <button className="btn btn-primary" onClick={() => setShowForm(true)}>Generate First Plan</button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {plans.map(plan => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  isSelected={selected?.id === plan.id}
                  onClick={() => setSelected(plan)}
                  onDelete={deletePlan}
                />
              ))}
            </div>
          )}
        </div>

        {/* Plan Detail */}
        <div className="plans-detail">
          {selected ? (
            <div style={{ position: 'sticky', top: 24 }}>
              <PlanDetailView plan={selected} onLaunch={launchPlan} launching={launching} />
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '60px 24px' }}>
              <div style={{ fontSize: '3rem', marginBottom: 16, opacity: 0.4 }}>🗺️</div>
              <h3 style={{ color: 'var(--text-secondary)', marginBottom: 10 }}>Select a Plan</h3>
              <p style={{ fontSize: '0.9rem' }}>Click any plan on the left to view its strategy and launch it as content</p>
            </div>
          )}
        </div>
      </div>

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
