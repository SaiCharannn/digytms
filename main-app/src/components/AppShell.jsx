import Sidebar from './Sidebar';

export default function AppShell({ title, badge, children }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <header className="topbar">
          <div className="topbar-title">{title}</div>
          {badge && <span className="topbar-badge">{badge}</span>}
        </header>
        <main className="page-body">{children}</main>
      </div>
    </div>
  );
}
