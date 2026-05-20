import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, PenSquare, Library, BarChart2,
  Map, Link2, Settings2, Plus, Search, Bell, ChevronDown, Zap
} from 'lucide-react';
import Dashboard from './pages/Dashboard';
import ContentStudio from './pages/ContentStudio';
import PostsLibrary from './pages/PostsLibrary';
import Automations from './pages/Automations';
import Analytics from './pages/Analytics';
import SocialAccounts from './pages/SocialAccounts';
import MarketingPlans from './pages/MarketingPlans';
import Settings from './pages/Settings';
import './index.css';

// VITE_API_URL overrides the base URL so the dev client can talk to the
// deployed server directly (e.g. https://agent.kael.es).
// When the variable is not set, Vite's dev proxy forwards /api → localhost:3001.
const API = import.meta.env.VITE_API_URL || '';
export { API };

const NAV = [
  { path: '/',          icon: LayoutDashboard, label: 'Dashboard',       group: 'main' },
  { path: '/studio',    icon: PenSquare,        label: 'Content planner', group: 'main' },
  { path: '/library',   icon: Library,          label: 'Posts library',   group: 'main' },
  { path: '/analytics', icon: BarChart2,        label: 'Analytics',       group: 'main' },
  { path: '/plans',     icon: Map,              label: 'Marketing Plans',  group: 'strategy' },
  { path: '/automations', icon: Zap,            label: 'Automations',      group: 'strategy' },
  { path: '/accounts',  icon: Link2,            label: 'Social Accounts',  group: 'settings' },
  { path: '/settings',  icon: Settings2,        label: 'Settings',         group: 'settings' },
];

/* ── Top Bar ──────────────────────────────────────────────────── */
function Topbar() {
  return (
    <header className="topbar">
      <div className="topbar-search">
        <span className="topbar-search-icon">
          <Search size={14} />
        </span>
        <input
          type="text"
          placeholder="Search…"
          className="topbar-search-input"
          readOnly
        />
      </div>

      <div className="topbar-right">
        <button className="topbar-icon-btn" title="Notifications" aria-label="Notifications">
          <Bell size={15} />
        </button>

        <div className="topbar-divider" />

        <div className="topbar-user" role="button" tabIndex={0}>
          <div className="topbar-avatar">A</div>
          <div className="topbar-user-info">
            <div className="topbar-name">Admin</div>
            <div className="topbar-role">Personal account</div>
          </div>
          <span className="topbar-chevron"><ChevronDown size={13} /></span>
        </div>
      </div>
    </header>
  );
}

/* ── Sidebar ──────────────────────────────────────────────────── */
function Sidebar({ apiStatus, queueCount, isOpen, onClose }) {
  const navigate = useNavigate();

  const handleNewPost = () => {
    navigate('/studio');
    if (onClose) onClose();
  };

  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon">🚀</div>
        <div>
          <div className="logo-text">SocialAI</div>
          <div className="logo-sub">Marketing Manager</div>
        </div>
        {onClose && (
          <button className="sidebar-close-btn" onClick={onClose} aria-label="Close menu">✕</button>
        )}
      </div>

      {/* + New Post */}
      <div className="sidebar-new-post">
        <button className="btn-new-post" onClick={handleNewPost} id="sidebar-new-post-btn">
          <Plus size={14} />
          New Post
        </button>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Workspace</div>
        {NAV.filter(n => n.group === 'main').map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={handleLinkClick}
            >
              <span className="nav-icon"><Icon size={16} /></span>
              <span>{item.label}</span>
              {item.path === '/scheduler' && queueCount > 0 && (
                <span className="nav-badge">{queueCount}</span>
              )}
            </NavLink>
          );
        })}

        <div className="sidebar-section-label">Strategy</div>
        {NAV.filter(n => n.group === 'strategy').map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={handleLinkClick}
            >
              <span className="nav-icon"><Icon size={16} /></span>
              <span>{item.label}</span>
            </NavLink>
          );
        })}

        <div className="sidebar-section-label">Configuration</div>
        {NAV.filter(n => n.group === 'settings').map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={handleLinkClick}
            >
              <span className="nav-icon"><Icon size={16} /></span>
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="api-status-pill">
          <span className={`status-dot ${apiStatus?.gemini || apiStatus?.openai ? '' : 'demo'}`} />
          <span>{apiStatus?.gemini || apiStatus?.openai ? 'AI Connected' : 'Demo Mode'}</span>
        </div>
      </div>
    </aside>
  );
}

/* ── App Root ─────────────────────────────────────────────────── */
export default function App() {
  const [apiStatus, setApiStatus]   = useState(null);
  const [queueCount, setQueueCount] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

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
    const interval = setInterval(loadQueue, 30_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <BrowserRouter>
      <div className="app-layout">
        {/* Mobile top bar */}
        <header className="mobile-header">
          <button
            className="hamburger-btn"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            id="mobile-menu-btn"
          >
            ☰
          </button>
          <div className="mobile-logo">
            <span>🚀</span> SocialAI
          </div>
        </header>

        {/* Sidebar overlay backdrop (mobile) */}
        {mobileOpen && (
          <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)} />
        )}

        <Sidebar
          apiStatus={apiStatus}
          queueCount={queueCount}
          isOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
        />

        <div className="main-content">
          <Topbar />
          <div className="page-container">
            <Routes>
              <Route path="/"          element={<Dashboard apiStatus={apiStatus} />} />
              <Route path="/studio"    element={<ContentStudio />} />
              <Route path="/library"   element={<PostsLibrary />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/plans"     element={<MarketingPlans />} />
              <Route path="/automations" element={<Automations />} />
              <Route path="/accounts"  element={<SocialAccounts />} />
              <Route path="/settings"  element={<Settings />} />
            </Routes>
          </div>
        </div>
      </div>
    </BrowserRouter>
  );
}
