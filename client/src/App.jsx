import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import ContentStudio from './pages/ContentStudio';
import Scheduler from './pages/Scheduler';
import Analytics from './pages/Analytics';
import SocialAccounts from './pages/SocialAccounts';
import MarketingPlans from './pages/MarketingPlans';
import Settings from './pages/Settings';
import './index.css';

// In production, the React app is served by Express on the same domain,
// so API calls use a relative path. In dev, Vite proxies /api to port 3001.
const API = '';

export { API };

const NAV = [
  { path: '/', icon: '⚡', label: 'Dashboard', group: 'main' },
  { path: '/studio', icon: '✍️', label: 'Content Studio', group: 'main' },
  { path: '/scheduler', icon: '📅', label: 'Scheduler', group: 'main' },
  { path: '/analytics', icon: '📊', label: 'Analytics', group: 'main' },
  { path: '/plans', icon: '🗺️', label: 'Marketing Plans', group: 'strategy' },
  { path: '/accounts', icon: '🔗', label: 'Social Accounts', group: 'settings' },
  { path: '/settings', icon: '⚙️', label: 'Settings', group: 'settings' },
];

function Sidebar({ apiStatus, queueCount }) {
  const location = useLocation();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">🚀</div>
        <div>
          <div className="logo-text">SocialAI</div>
          <div className="logo-sub">Marketing Manager</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Workspace</div>
        {NAV.filter(n => n.group === 'main').map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
            {item.path === '/scheduler' && queueCount > 0 && (
              <span className="nav-badge">{queueCount}</span>
            )}
          </NavLink>
        ))}

        <div className="sidebar-section-label">Strategy</div>
        {NAV.filter(n => n.group === 'strategy').map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}

        <div className="sidebar-section-label">Configuration</div>
        {NAV.filter(n => n.group === 'settings').map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="api-status-pill">
          <span className={`status-dot ${apiStatus?.gemini || apiStatus?.openai ? '' : 'demo'}`} />
          <span>
            {apiStatus?.gemini || apiStatus?.openai ? 'AI Connected' : 'Demo Mode'}
          </span>
        </div>
      </div>
    </aside>
  );
}

export default function App() {
  const [apiStatus, setApiStatus] = useState(null);
  const [queueCount, setQueueCount] = useState(0);

  useEffect(() => {
    fetch(`${API}/api/settings/api-status`)
      .then(r => r.json())
      .then(setApiStatus)
      .catch(() => {});

    const loadQueue = () => {
      fetch(`${API}/api/content?status=queued&limit=1`)
        .then(r => r.json())
        .then(d => setQueueCount(d.total || 0))
        .catch(() => {});
    };
    loadQueue();
    const interval = setInterval(loadQueue, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar apiStatus={apiStatus} queueCount={queueCount} />
        <main className="main-content">
          <div className="page-container">
            <Routes>
              <Route path="/" element={<Dashboard apiStatus={apiStatus} />} />
              <Route path="/studio" element={<ContentStudio />} />
              <Route path="/scheduler" element={<Scheduler />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/plans" element={<MarketingPlans />} />
              <Route path="/accounts" element={<SocialAccounts />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}
