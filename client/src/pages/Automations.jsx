import { useState, useEffect } from 'react';
import { API } from '../App';

export default function Automations() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  const load = async () => {
    try {
      const res = await fetch(`${API}/api/schedule`);
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch (err) {
      console.error('Failed to load jobs:', err);
    } finally {
      setLoading(false);
    }
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

  const CRON_LABELS = {
    '0 */2 * * *': 'Every 2 hours',
    '*/15 * * * *': 'Every 15 minutes',
    '0 9 * * *': 'Daily at 9 AM',
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">⚡ Automations</h1>
          <p className="page-subtitle">Manage background tasks, data syncs, and auto-publishing</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={load}>🔄 Refresh</button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Active Background Jobs</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Managed by system cron</span>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 70 }} />)}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {jobs.map(job => (
              <div key={job.id} style={{
                display: 'flex', alignItems: 'center', gap: 16, padding: '16px',
                background: 'var(--bg-input)', borderRadius: 'var(--r-lg)',
                border: `1px solid ${job.is_active ? 'var(--border)' : 'var(--border)'}`,
                opacity: job.is_active ? 1 : 0.6,
                transition: 'all 0.2s',
              }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: job.is_active ? 'var(--green)' : 'var(--text-muted)', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: 4 }}>{job.name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    {CRON_LABELS[job.cron_expression] || job.cron_expression}
                    {job.last_run && ` · Last run: ${new Date(job.last_run).toLocaleString()}`}
                  </div>
                </div>
                <span className={`badge ${job.is_active ? 'badge-published' : 'badge-draft'}`}>
                  {job.is_active ? 'Running' : 'Paused'}
                </span>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => triggerJob(job.id, job.name)}
                  disabled={triggering === job.id}
                >
                  {triggering === job.id ? <><span className="spinner" />Running...</> : '▶ Run Now'}
                </button>
              </div>
            ))}
            {jobs.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">⚙️</div>
                <h3>No automations found</h3>
                <p>System jobs will appear here when configured.</p>
              </div>
            )}
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
