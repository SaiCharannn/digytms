import { useState, useEffect } from 'react';
import AppShell from '../../components/AppShell';
import { operatorPending, operatorAll, operatorApprove, enrollmentLogs } from '../../api/client';

/* ── Audit Log Modal ── */
function LogModal({ enrollmentId, onClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    enrollmentLogs(enrollmentId)
      .then(r => setLogs(r.data.logs || []))
      .catch(() => { })
        .finally(() => setLoading(false));  
       }, [enrollmentId]);
 
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">📋 Audit Log — Enrollment #{enrollmentId}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 32 }}>
            <div className="loading-spinner-lg" style={{ margin: '0 auto' }} />
          </div>
        ) : logs.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">📋</div><h3>No log entries yet</h3></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>From</th><th>To</th><th>By</th><th>Date & Time</th><th>Remarks</th></tr>
              </thead>
              <tbody>
                {logs.map(l => (
                  <tr key={l.log_id}>
                    <td><span className="badge badge-pending">{l.old_status || '—'}</span></td>
                    <td><span className={`badge ${l.new_status === 'active' ? 'badge-active' : 'badge-inactive'}`}>{l.new_status}</span></td>
                    <td style={{ fontWeight: 500 }}>{l.changed_by_name}</td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {new Date(l.changed_at).toLocaleString('en-IN')}
                    </td>
                    <td style={{ fontSize: '0.8rem' }}>{l.remarks || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/*Approve / Reject Modal*/
function ReviewModal({ enrollment, onClose, onDone }) {
  const [action, setAction] = useState('approve');
  const [bankRef, setBankRef] = useState('');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    if (action === 'approve' && !bankRef.trim()) {
      setError('Bank reference number is required for approval.'); return;
    }
    if (action === 'reject' && !remarks.trim()) {
      setError('Please provide a reason for rejection.'); return;
    }
    setLoading(true); setError('');
    try {
      await operatorApprove(enrollment.enrollment_id, {
        action,
        bank_reference_number: bankRef,
        remarks,
      });
      onDone(action);
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">Review Enrollment #{enrollment.enrollment_id}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Student + course info */}
        <div className="course-info-grid" style={{ marginBottom: 20 }}>
          <InfoRow label="Student" value={`${enrollment.student_name} (${enrollment.student_id})`} />
          <InfoRow label="Email" value={enrollment.student_email} />
          <InfoRow label="Course" value={enrollment.course_name} />
          <InfoRow label="Fee" value={`${enrollment.currency_code} ${parseFloat(enrollment.course_fee).toLocaleString('en-IN')}`} /> 
          <InfoRow label="Pay Ref" value={enrollment.payment_reference_number || '—'} />
          <InfoRow label="Pay Date" value={enrollment.payment_date || '—'} />
          <InfoRow label="Proof" value={enrollment.has_payment_proof ? '✅ Uploaded' : '❌ Not uploaded'} />
          <InfoRow label="Enrolled" value={new Date(enrollment.enrolled_at).toLocaleDateString('en-IN')} />
        </div>

        {error && <div className="alert alert-error"><span>⚠️</span><span>{error}</span></div>}

        {/* Action toggle */}
        <div className="action-toggle">
          <button
            className={`action-toggle-btn ${action === 'approve' ? 'approve-active' : ''}`}
            onClick={() => { setAction('approve'); setError(''); }}
          >
            ✅ Approve
          </button>
          <button
            className={`action-toggle-btn ${action === 'reject' ? 'reject-active' : ''}`}
            onClick={() => { setAction('reject'); setError(''); }}
          >
            ❌ Reject
          </button>
        </div>
 
        {action === 'approve' && (
          <div className="field" style={{ marginTop: 16 }}>
            <label>Bank Reference Number *</label>
            <div className="field-wrap">
              <input
                type="text" 
                value={bankRef}
                onChange={e => { setBankRef(e.target.value); setError(''); }}
                placeholder="Bank / UPI transaction reference"
                className={error && !bankRef ? 'error' : ''}
              />
            </div>
            <span className="field-hint">This will be stored as the official payment confirmation</span>
          </div>
        )}
        
        <div className="field" style={{ marginTop: action === 'reject' ? 16 : 0 }}>
          <label>Remarks {action === 'reject' ? '*' : '(optional)'}</label>
          <div className="field-wrap">
            <textarea
              value={remarks}
              onChange={e => { setRemarks(e.target.value); setError(''); }}
              placeholder={action === 'reject' ? 'Reason for rejection — student will see this…' : 'Any notes for the record…'}
              style={{ padding: '10px 13px', minHeight: 72 }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 16 }}>
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
          <button
            className={`btn ${action === 'approve' ? 'btn-primary' : 'btn-danger'}`}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading
              ? <><div className="spinner" />Processing…</>
              : action === 'approve' ? '✅ Approve Enrollment' : '❌ Reject Enrollment'}
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="info-row">
      <span className="info-label">{label}</span>
      <span className="info-val">{value}</span>
    </div>
  );
}

/* ── Main Page  */
export default function OperatorDashboardPage() {
  const [tab, setTab] = useState('pending');
  const [pending, setPending] = useState([]);
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatus] = useState('');
  const [reviewTarget, setReview] = useState(null);
  const [logTarget, setLog] = useState(null);
  const [toast, setToast] = useState('');

  function load() {
    setLoading(true);
    Promise.all([operatorPending(), operatorAll()])
      .then(([pr, ar]) => {
        setPending(pr.data.pending || []);
        setAll(ar.data.enrollments || []);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  }

  function onActionDone(action) {
    setReview(null);
    showToast(action === 'approve' ? '✅ Enrollment approved successfully!' : '❌ Enrollment rejected.');
    load();
  }

  const filteredAll = all.filter(e => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      e.student_name?.toLowerCase().includes(q) ||
      e.course_name?.toLowerCase().includes(q) ||
      e.student_id?.toLowerCase().includes(q);
    const matchStatus = !statusFilter || e.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <AppShell title="Operator Dashboard" badge={`${pending.length} Pending`}>

      {toast && (
        <div className={`alert ${toast.startsWith('✅') ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 16 }}>
          <span>{toast}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="tab-bar">
        <button className={`tab-btn ${tab === 'pending' ? 'active' : ''}`} onClick={() => setTab('pending')}>
          Pending Approvals <span className="tab-count">{pending.length}</span>
        </button>
        <button className={`tab-btn ${tab === 'all' ? 'active' : ''}`} onClick={() => setTab('all')}>
          All Enrollments <span className="tab-count">{all.length}</span>
        </button>
      </div>

      {/* ── PENDING TAB ── */}
      {tab === 'pending' && (
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Pending Payment Verifications</div>
              <div className="card-sub">Review and approve student payments for your institution's courses</div>
            </div>
          </div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div className="loading-spinner-lg" style={{ margin: '0 auto' }} />
            </div>
          ) : pending.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🎉</div>
              <h3>All caught up!</h3>
              <p>No enrollments are pending review right now.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Student</th>
                    <th>Course</th>
                    <th>Fee</th>
                    <th>Pay Ref</th>
                    <th>Proof</th>
                    <th>Enrolled</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.map(e => (
                    <tr key={e.enrollment_id}>
                      <td><code style={{ fontSize: '0.78rem' }}>#{e.enrollment_id}</code></td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{e.student_name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{e.student_email}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{e.course_name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          ID: {e.student_id}
                        </div>
                      </td>
                      <td style={{ whiteSpace: 'nowrap', fontWeight: 600 }}>
                        {e.currency_code} {parseFloat(e.course_fee).toLocaleString('en-IN')}
                      </td>
                      <td style={{ fontSize: '0.82rem' }}>
                        {e.payment_reference_number
                          ? <code>{e.payment_reference_number}</code>
                          : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </td>
                      <td>
                        {e.has_payment_proof
                          ? <span className="badge badge-active">✅ Yes</span>
                          : <span className="badge badge-inactive">❌ No</span>}
                      </td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {new Date(e.enrolled_at).toLocaleDateString('en-IN')}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <button className="btn btn-primary btn-sm" onClick={() => setReview(e)}>
                            Review
                          </button>
                          <button className="btn btn-secondary btn-sm" onClick={() => setLog(e.enrollment_id)}>
                            Log
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── ALL ENROLLMENTS TAB ── */}
      {tab === 'all' && (
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">All Enrollments</div>
              <div className="card-sub">Complete enrollment history for your institution</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>🔍</span>
              <input
                type="text"
                placeholder="Search student, course or ID…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: '9px 14px 9px 36px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-body)', fontSize: '0.88rem', outline: 'none', background: 'var(--surface)' }}
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatus(e.target.value)}
              style={{ padding: '9px 14px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-body)', fontSize: '0.88rem', outline: 'none', background: 'var(--surface-2)', cursor: 'pointer' }}
            >
              <option value="">All Statuses</option>
              <option value="active">✅ Active</option>
              <option value="for_approval">⏳ Pending</option>
              <option value="rejected">❌ Rejected</option>
            </select>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div className="loading-spinner-lg" style={{ margin: '0 auto' }} />
            </div>
          ) : filteredAll.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <h3>No enrollments found</h3>
              <p>{search || statusFilter ? 'Try clearing filters' : 'No enrollments in your institution yet'}</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th><th>Student</th><th>Course</th><th>Fee</th>
                    <th>Status</th><th>Enrolled</th><th>Approved</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAll.map(e => (
                    <tr key={e.enrollment_id}>
                      <td><code style={{ fontSize: '0.78rem' }}>#{e.enrollment_id}</code></td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{e.student_name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{e.student_id}</div>
                      </td>
                      <td style={{ maxWidth: 160 }}>{e.course_name}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {e.currency_code} {parseFloat(e.course_fee || 0).toLocaleString('en-IN')}
                      </td>
                      <td>
                        <span className={`badge ${e.status === 'active' ? 'badge-active' : e.status === 'rejected' ? 'badge-inactive' : 'badge-pending'}`}>
                          {e.status === 'active' ? '✅' : e.status === 'rejected' ? '❌' : '⏳'} {e.status}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {new Date(e.enrolled_at).toLocaleDateString('en-IN')}
                      </td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {e.approved_at ? new Date(e.approved_at).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td>
                        <button className="btn btn-secondary btn-sm" onClick={() => setLog(e.enrollment_id)}>
                          Log
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {reviewTarget && (
        <ReviewModal enrollment={reviewTarget} onClose={() => setReview(null)} onDone={onActionDone} />
      )}
      {logTarget && (
        <LogModal enrollmentId={logTarget} onClose={() => setLog(null)} />
      )}
    </AppShell>
  );
}