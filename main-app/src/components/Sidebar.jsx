import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const MENU = [
  { icon:'🏠', label:'Dashboard',    path:'/dashboard',    roles:'all' },
  { icon:'👥', label:'Manage Users', path:'/users',        roles:['SUPERADMIN','SYSTEM_ADMINISTRATOR','ADMIN'] },
  { icon:'🎓', label:'Students',     path:'/students',     roles:'all' },
  { icon:'🔢', label:'Numbering',    path:'/numbering',    roles:['SUPERADMIN','SYSTEM_ADMINISTRATOR','ADMIN'] },
  { icon:'👤', label:'My Profile',   path:'/profile',      roles:'all' },
];

function initials(name='') {
  return name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
}

export default function Sidebar({ activePath }) {
  const { user, clearSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  function canSee(roles) {
    if (roles === 'all') return true;
    return roles.includes(user?.designation);
  }

  function logout() {
    clearSession();
    navigate('/login');
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">🏛️</div>
        <div>
          <div className="sidebar-brand-name">Samcomm</div>
          <div className="sidebar-brand-sub">Management System</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Navigation</div>
        {MENU.filter(m => canSee(m.roles)).map(m => (
          <button
            key={m.path}
            className={`nav-item ${location.pathname === m.path ? 'active' : ''}`}
            onClick={() => navigate(m.path)}
          >
            <span className="nav-item-icon">{m.icon}</span>
            {m.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-card">
          <div className="user-avatar">{initials(user?.userName)}</div>
          <div className="user-info">
            <div className="user-name">{user?.userName || 'User'}</div>
            <div className="user-role">{user?.designation || 'Staff'}</div>
          </div>
          <button className="btn-logout" onClick={logout} title="Logout">⏻</button>
        </div>
      </div>
    </aside>
  );
}
