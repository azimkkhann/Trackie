import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

const navItems = [
  { path: '/', label: 'Overview', icon: '▣' },
  { path: '/expenses', label: 'Expenses', icon: '↗' },
  { path: '/analytics', label: 'Analytics', icon: '◈' },
  { path: '/budget', label: 'Budget', icon: '◎' },
  { path: '/categories', label: 'Categories', icon: '▤' },
  { path: '/reports', label: 'Reports', icon: '▧' },
  { path: '/settings', label: 'Settings', icon: '⚙' },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="sidebar-logo-mark">◆</span>
            <span className="sidebar-logo-text">Expense Manager</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
              onClick={onClose}
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              <span className="sidebar-link-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
              {user?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{user?.name || 'User'}</span>
              <span className="sidebar-user-email">{user?.email || ''}</span>
            </div>
          </div>
          <button className="sidebar-logout" onClick={logout} title="Logout">↪</button>
        </div>
      </aside>
    </>
  );
}
