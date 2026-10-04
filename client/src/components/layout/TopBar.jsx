import './TopBar.css';

export default function TopBar({ title, subtitle, onMenuClick, children }) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="topbar-menu" onClick={onMenuClick} aria-label="Open menu">☰</button>
        <div className="topbar-title-group">
          <h1 className="topbar-title">{title}</h1>
          {subtitle && <span className="topbar-subtitle">{subtitle}</span>}
        </div>
      </div>
      {children && <div className="topbar-actions">{children}</div>}
    </header>
  );
}
