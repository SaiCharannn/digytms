import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import { useAuth } from '../context/AuthContext';
import { getUsers, operatorPending, myEnrollments } from '../api/client';

const OPERATOR_ROLES = ['SUPERADMIN', 'SYSTEM_ADMINISTRATOR', 'ADMIN'];

function StatCard({ icon, value, label, color, onClick }) {
  return (
    <div className={`stat-card ${onClick ? 'stat-card-clickable' : ''}`} onClick={onClick}>
      <div className="stat-icon" style={{ background: color + '18' }}>
        <span style={{ fontSize: '1.3rem' }}>{icon}</span>
      </div>
      <div className="stat-info">
        <div className="stat-val">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
      {onClick && <div className="stat-arrow">→</div>}
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

// ── SuperAdmin Dashboard ──────────────────────────────────────────────────────
function SuperAdminDashboard({ user }) {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getUsers(), operatorPending()])
      .then(([ur, pr]) => {
        setUsers(ur.data.data || []);
        setPending(pr.data.pending || []);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const total = users.length;
  const active = users.filter(u => u.user_status === 'Active').length;
  const students = users.filter(u => u.user_designation === 'STUDENT').length;

  return (
    <>
      <div className="stats-row">
        <StatCard icon="👥" value={loading ? '…' : total} label="Total Users" color="#2563eb" onClick={() => navigate('/users')} />
        <StatCard icon="✅" value={loading ? '…' : active} label="Active Users" color="#10b981" />
        <StatCard icon="🎓" value={loading ? '…' : students} label="Students" color="#f59e0b" />
        <StatCard icon="⏳" value={loading ? '…' : pending.length} label="Pending Approvals" color="#ef4444" onClick={() => navigate('/operator')} />
      </div>

      {/* Pending approvals alert */}
      {!loading && pending.length > 0 && (
        <div className="alert alert-info" style={{ marginBottom: 20, cursor: 'pointer' }} onClick={() => navigate('/operator')}>
          <span>🔔</span>
          <span><strong>{pending.length} enrollment{pending.length > 1 ? 's' : ''}</strong> awaiting your approval. <u>Review now →</u></span>
        </div>
      )}


      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Recent Users</div>
            <div className="card-sub">Latest accounts created in your institution</div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/users')}>Manage Users</button>
        </div>
        <div className="table-wrap">
          {loading ? (
            <div style={{ textAlign: 'center', padding: 32 }}>
              <div className="loading-spinner-lg" style={{ margin: '0 auto' }} />
            </div>
          ) : users.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">👥</div>
              <h3>No users yet</h3>
              <p>Create your first staff account from Manage Users</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr><th>User ID</th><th>Name</th><th>Role</th><th>Email</th><th>Status</th></tr>
              </thead>
              <tbody>
                {users.slice(0, 8).map(u => (
                  <tr key={u.user_id}>
                    <td><code style={{ fontSize: '0.8rem' }}>{u.user_id}</code></td>
                    <td style={{ fontWeight: 500 }}>{u.user_name}</td>
                    <td><span className="badge badge-role">{u.user_designation}</span></td>
                    <td style={{ fontSize: '0.82rem' }}>{u.email_id}</td>
                    <td>
                      <span className={`badge ${u.user_status === 'Active' ? 'badge-active' : 'badge-inactive'}`}>
                        {u.user_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}

// ── Regular User Dashboard    
function UserDashboard({ user }) {
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const isOperator = OPERATOR_ROLES.includes(user?.designation);

  useEffect(() => {
    const calls = [myEnrollments()];
    if (isOperator) calls.push(operatorPending());

    Promise.all(calls)
      .then(([er, pr]) => {
        const list = er.data.enrollments || [];
        setEnrollments(list);
        if (pr) setPendingCount(pr.data.pending?.length || 0);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [isOperator]);

  const activeCount = enrollments.filter(e => e.status === 'active').length;
  const pendingOwn = enrollments.filter(e => e.status === 'for_approval').length;
  const recentEnroll = enrollments.slice(0, 5);

  return (
    <>
      <div className="stats-row">
        <StatCard icon="📚" value={activeCount} label="Active Courses" color="#2563eb" onClick={() => navigate('/my-enrollments')} />
        <StatCard icon="⏳" value={pendingOwn} label="Pending Payment" color="#f59e0b" onClick={() => navigate('/my-enrollments')} />
        {isOperator && (
          <StatCard icon="🛡️" value={loading ? '…' : pendingCount} label="Awaiting Approval" color="#ef4444" onClick={() => navigate('/operator')} />
        )}
      </div>

      {isOperator && !loading && pendingCount > 0 && (
        <div className="alert alert-info" style={{ marginBottom: 20, cursor: 'pointer' }} onClick={() => navigate('/operator')}>
          <span>🔔</span>
          <span><strong>{pendingCount} enrollment{pendingCount > 1 ? 's' : ''}</strong> waiting for your approval. <u>Go to Operator Dashboard →</u></span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Quick actions */}
        <div className="card">
          <div className="card-header" style={{ marginBottom: 16 }}>
            <div className="card-title">Quick Actions</div>
          </div>
          <div className="quick-actions">
            <button className="quick-action-btn" onClick={() => navigate('/courses')}>
              <span className="quick-action-icon">📚</span>
              <span className="quick-action-label">Browse Courses</span>
              <span className="quick-action-arrow">→</span>
            </button>
            <button className="quick-action-btn" onClick={() => navigate('/my-enrollments')}>
              <span className="quick-action-icon">🎓</span>
              <span className="quick-action-label">My Enrollments</span>
              <span className="quick-action-arrow">→</span>
            </button>
            {isOperator && (
              <button className="quick-action-btn" onClick={() => navigate('/operator')}>
                <span className="quick-action-icon">🛡️</span>
                <span className="quick-action-label">Operator Dashboard</span>
                <span className="quick-action-arrow">→</span>
              </button>
            )}
            <button className="quick-action-btn" onClick={() => navigate('/profile')}>
              <span className="quick-action-icon">👤</span>
              <span className="quick-action-label">My Profile</span>
              <span className="quick-action-arrow">→</span>
            </button>
          </div>
        </div>

        {/* Recent enrollments */}
        <div className="card">
          <div className="card-header" style={{ marginBottom: 16 }}>
            <div className="card-title">Recent Enrollments</div>
          </div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 20 }}>
              <div className="loading-spinner-lg" style={{ margin: '0 auto' }} />
            </div>
          ) : recentEnroll.length === 0 ? (
            <div className="empty-state" style={{ padding: '20px 0' }}>
              <div className="empty-state-icon">📚</div>
              <h3>No enrollments yet</h3>
              <p>Browse courses to get started</p>
              <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={() => navigate('/courses')}>
                Browse Courses
              </button>
            </div>
          ) : (
            <div className="mini-enrollment-list">
              {recentEnroll.map(e => (
                <div className="mini-enrollment-row" key={e.enrollment_id}>
                  <div className="mini-enrollment-name">{e.course_name}</div>
                  <span className={`badge ${e.status === 'active' ? 'badge-active' : e.status === 'rejected' ? 'badge-inactive' : 'badge-pending'}`}>
                    {e.status === 'active' ? '✅' : e.status === 'rejected' ? '❌' : '⏳'} {e.status}
                  </span>
                </div>
              ))}
              {enrollments.length > 5 && (
                <button className="btn btn-secondary btn-sm" style={{ marginTop: 10, width: '100%' }} onClick={() => navigate('/my-enrollments')}>
                  View all {enrollments.length} enrollments
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <AppShell title="Dashboard" badge={user?.institutionId || ''}>
      <div className="welcome-banner">
        <div>
          <h2>{greeting()}, {user?.userName?.split(' ')[0] || 'User'}!</h2>
          <p>
            Welcome back to Samcomm ·{' '}
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="welcome-banner-emoji">👋</div>
      </div>

      {user?.isSuperAdmin
        ? <SuperAdminDashboard user={user} />
        : <UserDashboard user={user} />
      }
    </AppShell>
  );
}