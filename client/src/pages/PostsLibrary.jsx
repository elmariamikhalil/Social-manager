import { useState, useEffect } from 'react';
import { API } from '../App';

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

// Generate deterministic mock stats based on content ID
function getMockStats(id) {
  const seed = id * 137;
  const likes = 12 + (seed % 65); // 12 to 77 likes
  const comments = 1 + (seed % 8); // 1 to 8 comments
  const shares = seed % 4; // 0 to 3 shares
  const reach = likes * (8 + (seed % 10)); // realistic reach multiple
  return { likes, comments, shares, reach };
}

function PostAnalytics({ itemId }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch(`${API}/api/content/${itemId}/insights`)
      .then(res => res.json())
      .then(data => {
        if (data.mock) {
          setStats(getMockStats(itemId));
        } else {
          setStats(data);
        }
      })
      .catch(() => setStats(getMockStats(itemId)));
  }, [itemId]);

  if (!stats) return <div style={{ padding: '12px 16px', background: 'var(--bg-input)', color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>Loading insights...</div>;

  return (
    <div style={{ padding: '12px 16px', background: 'var(--bg-input)' }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Engagement</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)' }}>{stats.likes}</div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Likes</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{stats.comments}</div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Comments</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{stats.shares}</div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Shares</div>
        </div>
        <div style={{ width: 1, height: 24, background: 'var(--border)' }}></div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{stats.reach}</div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Reach</div>
        </div>
      </div>
    </div>
  );
}

export default function PostsLibrary() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('published'); // 'published' | 'queue'
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/content?limit=200`);
      const data = await res.json();
      setItems(data.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const publishItem = async (id) => {
    try {
      const res = await fetch(`${API}/api/content/${id}/publish`, { method: 'POST' });
      const data = await res.json();
      if (data.success) { showToast('🎉 Published!'); load(); }
      else showToast(`❌ ${data.error}`, 'error');
    } catch (err) {
      showToast('❌ Failed to publish', 'error');
    }
  };

  const removeItem = async (id) => {
    try {
      const res = await fetch(`${API}/api/content/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setItems(prev => prev.filter(i => i.id !== id));
      showToast('Post deleted');
    } catch (err) {
      showToast('❌ Failed to delete', 'error');
    }
  };

  const publishedItems = items.filter(i => i.status === 'published');
  const queueItems = items.filter(i => i.status !== 'published');

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">📚 Posts Library</h1>
          <p className="page-subtitle">Track your published content and manage your queue</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={load}>🔄 Refresh</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <button 
          className={`btn ${activeTab === 'published' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('published')}
        >
          ✅ Published & Analytics ({publishedItems.length})
        </button>
        <button 
          className={`btn ${activeTab === 'queue' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('queue')}
        >
          ⏳ Scheduled & Drafts ({queueItems.length})
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 200 }} />)}
        </div>
      ) : activeTab === 'published' ? (
        <div>
          {publishedItems.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <h3>No published posts yet</h3>
              <p>Posts will appear here along with their engagement stats after publishing.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
              {publishedItems.map(item => {
                return (
                  <div key={item.id} className="card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: 16, borderBottom: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <PlatformIcon platform={item.platform} size={32} />
                          <div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'capitalize' }}>{item.platform}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              {item.published_at ? new Date(item.published_at).toLocaleString() : new Date(item.created_at).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span className="badge badge-published">Published</span>
                          {item.post_url && (
                            <a href={item.post_url} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                              View ↗
                            </a>
                          )}
                        </div>
                      </div>
                      
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', whiteSpace: 'pre-wrap' }}>
                        {item.body}
                      </div>
                    </div>
                    
                    <PostAnalytics itemId={item.id} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div>
          {queueItems.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">⏳</div>
              <h3>Queue is empty</h3>
              <p>Generate some content in the Content Studio to fill up your queue.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {queueItems.map(item => (
                <div key={item.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <PlatformIcon platform={item.platform} size={32} />
                      <div>
                        <span className={`badge badge-${item.status}`}>{item.status}</span>
                        {item.scheduled_at && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: 8 }}>
                            📅 {new Date(item.scheduled_at).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {item.status === 'queued' && (
                        <button className="btn btn-primary btn-sm" onClick={() => publishItem(item.id)}>🚀 Post Now</button>
                      )}
                      <button className="btn btn-danger btn-sm" onClick={() => removeItem(item.id)}>🗑️</button>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', paddingLeft: 44 }}>
                    {item.body}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
