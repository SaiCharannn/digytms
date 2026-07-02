import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../../components/AppShell';
import { myEnrollments } from '../../api/client';

const STATUS_CONFIG = {
  active: { label: 'Active', cls: 'badge-active', icon: '✅', desc: 'You have full access' },
  for_approval: { label: 'Pending', cls: 'badge-pending', icon: '⏳', desc: 'Awaiting operator approval' },
  rejected: { label: 'Rejected', cls: 'badge-inactive', icon: '❌', desc: 'Payment was rejected' },
};

export default function MyEnrollmentsPage() {
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');

  useEffect(() => {
    myEnrollments()
      .then(r => setEnrollments(r.data.enrollments || []))
      .catch(() => setError('Failed to load enrollments.'))
      .finally(() => setLoading(false));
  }, []);

  const counts = {
    all: enrollments.length,
    active: enrollments.filter(e => e.status === 'active').length,
    for_approval: enrollments.filter(e => e.status === 'for_approval').length,
    rejected: enrollments.filter(e => e.status === 'rejected').length,
  };

  const filtered = filter === 'all' ? enrollments : enrollments.filter(e => e.status === filter);

  return (
    <AppShell title="My Enrollments" badge={`${counts.all} Total`}>

      {/* Tab bar */}
      <div className="tab-bar">
        {[
          { key: 'all', label: 'All' },
          { key: 'active', label: '✅ Active' },
          { key: 'for_approval', label: '⏳ Pending' },
          { key: 'rejected', label: '❌ Rejected' },
        ].map(t => (
          <button
            key={t.key}
            className={`tab-btn ${filter === t.key ? 'active' : ''}`}
            onClick={() => setFilter(t.key)}
          >
            {t.label}
            <span className="tab-count">{counts[t.key]}</span>
          </button>
        ))}
      </div>

      {error && <div className="alert alert-error"><span>⚠️</span><span>{error}</span></div>}

      {loading ? (
        <div className="loading-screen" style={{ minHeight: 280 }}>
          <div className="loading-spinner-lg" /><p className="loading-text">Loading enrollments…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 32 }}>
          <div className="empty-state-icon">
            {filter === 'all' ? '📚' : STATUS_CONFIG[filter]?.icon}
          </div>
          <h3>
            {filter === 'all' ? 'No enrollments yet' : `No ${STATUS_CONFIG[filter]?.label.toLowerCase()} enrollments`}
          </h3>
          <p>{filter === 'all' ? 'Browse courses and enroll to start learning' : 'Check a different filter above'}</p>
          {filter === 'all' && (
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/courses')}>
              Browse Courses
            </button>
          )}
        </div>
      ) : (
        <div className="enrollment-list">
          {filtered.map(e => {
            const sc = STATUS_CONFIG[e.status] || STATUS_CONFIG.for_approval;
            const isFree = !e.course_fee || parseFloat(e.course_fee) === 0;
            const needsPayment = e.status === 'for_approval' && !e.payment_uploaded_at;

            return (
              <div
                  className="enrollment-row"
                  key={e.enrollment_id}
                  onClick={e.status === 'active' ? () => navigate(`/courses/${e.course_id}`) : undefined}
                  style={e.status === 'active' ? { cursor: 'pointer' } : undefined}
                >
                <div className="enrollment-row-body">
                  <div className="enrollment-course-name">{e.course_name}</div>
                  {e.status === 'active' && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--primary-light)', marginTop: 2, fontWeight: 600 }}>
                      Click to continue learning →
                    </div>
                  )}
                  <div className="enrollment-meta">
                    <span>🏛️ {e.institution_name}</span>
                    <span>·</span>
                    {isFree
                      ? <span className="fee-free" style={{ fontSize: '0.75rem' }}>FREE</span>
                      : <span>{e.currency_code} {parseFloat(e.course_fee).toLocaleString('en-IN')}</span>
                    }
                    <span>·</span>
                    <span>Enrolled {new Date(e.enrolled_at).toLocaleDateString('en-IN')}</span>
                  </div>

                  {/* Status message */}
                  {e.status === 'for_approval' && (
                    <div className="enrollment-status-msg">
                      {e.payment_uploaded_at
                        ? `💳 Payment submitted on ${new Date(e.payment_uploaded_at).toLocaleDateString('en-IN')} — awaiting operator review`
                        : '⚠️ Payment proof not yet uploaded — please upload to proceed'
                      }
                    </div>
                  )}
                  {e.status === 'rejected' && e.rejection_remarks && (
                    <div className="enrollment-status-msg rejected">
                      Rejection reason: {e.rejection_remarks}
                    </div>
                  )}
                  {e.status === 'active' && e.approved_at && (
                    <div className="enrollment-status-msg active">
                      Approved on {new Date(e.approved_at).toLocaleDateString('en-IN')}
                    </div>
                  )}
                </div>

                <div className="enrollment-row-actions">
                  <span className={`badge ${sc.cls}`}>{sc.icon} {sc.label}</span>
                  {needsPayment && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => navigate(`/courses/${e.course_id}/enroll`)}
                    >
                      Upload Payment
                    </button>
                  )}
                  {e.status === 'rejected' && (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => navigate(`/courses/${e.course_id}/enroll`, { state: { retry: true } })}
                    >
                      Re-apply
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Browse CTA */}
      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <button className="btn btn-secondary" onClick={() => navigate('/courses')}>
          + Browse More Courses
        </button>
      </div>
    </AppShell>
  );
}