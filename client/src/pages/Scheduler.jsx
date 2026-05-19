import { useState, useEffect } from 'react';
import { API } from '../App';

export default function Scheduler() {
  const [queue, setQueue] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  const load = async () => {
    const [q, j] = await Promise.allSettled([
      fetch(`${API}/api/schedule/queue`).then(r => r.json()),
      fetch(`${API}/api/schedule`).then(r => r.json()),
    ]);
    if (q.status === 'fulfilled') setQueue(q.value.queue || []);
    if (j.status === 'fulfilled') setJobs(j.value.jobs || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const triggerJob = async (id, name) => {
    setTriggering(id);
    try {
      const res = await fetch(`${API}/api/schedule/${id}/trigger`, { method: 'POST' });
      const data = await res.json();
      showToast(`✅ "${name}" completed!`);
      setTimeout(load, 1000);
    } catch (err) {
      showToast(`❌ ${err.message}`, 'error');
    } finally {
      setTriggering(null);
    }
  };

  const publishItem = async (id) => {
    const res = await fetch(`${API}/api/content/${id}/publish`, { method: 'POST' });
    const data = await res.json();
    if (data.success) { showToast('🎉 Published!'); load(); }
    else showToast(`❌ ${data.error}`, 'error');
  };

  const removeFromQueue = async (id) => {
    await fetch(`${API}/api/content/${id}`, { method: 'DELETE' });
    setQueue(prev => prev.filter(i => i.id !== id));
    showToast('Removed from queue');
  };

  const CRON_LABELS = {
    '0 */2 * * *': 'Every 2 hours',
    '*/15 * * * *': 'Every 15 minutes',
    '0 9 * * *': 'Daily at 9 AM',
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">📅 Scheduler</h1>
          <p className="page-subtitle">Manage automated jobs and your publish queue</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={load}>🔄 Refresh</button>
        </div>
      </div>

      {/* Automation Jobs */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div className="card-title">⏰ Automation Jobs</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Running in background</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {jobs.map(job => (
            <div key={job.id} style={{
              display: 'flex', alignItems: 'center', gap: 16, padding: '14px 16px',
              background: 'var(--bg-input)', borderRadius: 'var(--radius-md)',
              border: `1px solid ${job.is_active ? 'var(--border)' : 'var(--border)'}`,
              opacity: job.is_active ? 1 : 0.5,
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: job.is_active ? 'var(--accent-green)' : 'var(--text-muted)', flexShrink: 0, boxShadow: job.is_active ? '0 0 6px var(--accent-green)' : 'none' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: 2 }}>{job.name}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {CRON_LABELS[job.cron_expression] || job.cron_expression}
                  {job.last_run && ` · Last run: ${new Date(job.last_run).toLocaleString()}`}
                </div>
              </div>
              <span className={`badge ${job.is_active ? 'badge-published' : 'badge-draft'}`}>
                {job.is_active ? 'Active' : 'Paused'}
              </span>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => triggerJob(job.id, job.name)}
                disabled={triggering === job.id}
              >
                {triggering === job.id ? <><span className="spinner" />Running</> : '▶ Run Now'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Publish Queue */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">📤 Publish Queue</div>
          <span className="badge badge-queued">{queue.length} items</span>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 80 }} />)}
          </div>
        ) : queue.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>Queue is empty</h3>
            <p>Generate content in the Content Studio and approve posts to add them to the queue</p>
            <a href="/studio" className="btn btn-primary" style={{ textDecoration: 'none' }}>Go to Content Studio</a>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {queue.map(item => (
              <div key={item.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: 16, padding: '14px 16px',
                background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
              }}>
                <div style={{ fontSize: '1.5rem' }}>
                  {item.platform === 'instagram' ? '📸' : item.platform === 'facebook' ? '📘' : '📱'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: 4, lineHeight: 1.5 }}>
                    {item.body?.substring(0, 140)}{item.body?.length > 140 ? '...' : ''}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span className={`badge badge-${item.platform}`}>{item.platform}</span>
                    <span className={`badge badge-${item.status}`}>{item.status}</span>
                    {item.account_name && <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>→ {item.account_name}</span>}
                    {item.scheduled_at && <span style={{ fontSize: '0.72rem', color: 'var(--accent-amber)' }}>⏰ {new Date(item.scheduled_at).toLocaleString()}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button className="btn btn-success btn-sm" onClick={() => publishItem(item.id)}>🚀 Publish</button>
                  <button className="btn btn-danger btn-sm" onClick={() => removeFromQueue(item.id)}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )}
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
