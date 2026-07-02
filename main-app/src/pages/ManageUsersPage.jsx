import { useState, useEffect } from 'react';
import AppShell from '../components/AppShell';
import { getUsers, createUser, getRoles } from '../api/client';
import { useAuth } from '../context/AuthContext';

const PWD_REGEX = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]).{8,20}$/;

const EMPTY_FORM = {
  userId:'', userName:'', userDesignation:'', emailId:'',
  mobileNumber:'', branchId:'', branchName:'',
  departmentId:'', departmentName:'', password:'', confirmPassword:''
};

export default function ManageUsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [globalErr, setGlobalErr] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    Promise.all([getUsers(), getRoles()])
      .then(([ur, rr]) => {
        setUsers(ur.data.data || []);
        setRoles(rr.data.roles || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const set = (k,v) => { setForm(f=>({...f,[k]:v})); setErrors(e=>({...e,[k]:''})); setGlobalErr(''); };

  function validate() {
    const e = {};
    if (!form.userId) e.userId='Required';
    if (!form.userName) e.userName='Required';
    if (!form.userDesignation) e.userDesignation='Required';
    if (!form.emailId) e.emailId='Required';
    if (!form.password) e.password='Required';
    else if (!PWD_REGEX.test(form.password)) e.password='8–20 chars, 1 uppercase, 1 special';
    if (!form.confirmPassword) e.confirmPassword='Required';
    else if (form.password!==form.confirmPassword) e.confirmPassword='Passwords do not match';
    return e;
  }

  async function handleCreate(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true); setGlobalErr('');
    try {
      const res = await createUser(form);
      setSuccessMsg(res.data.message);
      setShowModal(false);
      setForm(EMPTY_FORM);
      // Refresh list
      const ur = await getUsers();
      setUsers(ur.data.data || []);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setGlobalErr(err.response?.data?.message || 'Failed to create user.');
      setErrors(err.response?.data?.errors || {});
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = users.filter(u =>
    !filter ||
    u.user_name?.toLowerCase().includes(filter.toLowerCase()) ||
    u.user_id?.toLowerCase().includes(filter.toLowerCase()) ||
    u.user_designation?.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <AppShell title="Manage Users" badge={`${users.length} Users`}>
      {successMsg && (
        <div className="alert alert-success"><span>✅</span><span>{successMsg}</span></div>
      )}

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">All Users</div>
            <div className="card-sub">Create and manage staff accounts for your institution</div>
          </div>
          <button className="btn btn-primary" onClick={() => { setShowModal(true); setGlobalErr(''); setErrors({}); }}>
            ＋ Add User
          </button>
        </div>

        <div style={{marginBottom:16}}>
          <input
            type="text"
            placeholder="🔍  Search by name, ID or role…"
            value={filter}
            onChange={e=>setFilter(e.target.value)}
            style={{width:'100%',padding:'9px 14px',border:'1.5px solid var(--border)',borderRadius:'var(--radius-sm)',fontFamily:'var(--font-body)',fontSize:'0.88rem',outline:'none'}}
          />
        </div>

        <div className="table-wrap">
          {loading ? (
            <div style={{textAlign:'center',padding:32}}><div className="loading-spinner-lg" style={{margin:'0 auto'}}/></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">👤</div>
              <h3>{filter ? 'No matching users' : 'No users yet'}</h3>
              <p>{filter ? 'Try a different search term' : 'Click "Add User" to create the first staff account'}</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>User ID</th><th>Name</th><th>Role</th><th>Email</th>
                  <th>Mobile</th><th>Status</th><th>Created</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.user_id}>
                    <td><code style={{fontSize:'0.8rem'}}>{u.user_id}</code></td>
                    <td><strong style={{fontWeight:500}}>{u.user_name}</strong></td>
                    <td><span className="badge badge-role">{u.user_designation}</span></td>
                    <td style={{fontSize:'0.82rem'}}>{u.email_id}</td>
                    <td style={{fontSize:'0.82rem'}}>{u.mobile_number || '—'}</td>
                    <td>
                      <span className={`badge ${u.user_status==='Active'?'badge-active':'badge-inactive'}`}>
                        {u.user_status}
                      </span>
                    </td>
                    <td style={{fontSize:'0.78rem',color:'var(--text-muted)'}}>
                      {new Date(u.cr_date_time).toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create User Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => { if(e.target===e.currentTarget) setShowModal(false); }}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">Create New User</div>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            {globalErr && <div className="alert alert-error"><span>⚠️</span><span>{globalErr}</span></div>}

            <form onSubmit={handleCreate} noValidate>
              <div className="section-label">Account Details</div>
              <div className="form-grid">
                <div className="field">
                  <label>User ID *</label>
                  <div className="field-wrap">
                    <input type="text" value={form.userId} onChange={e=>set('userId',e.target.value)}
                      placeholder="Unique user ID" className={errors.userId?'error':''} />
                  </div>
                  {errors.userId&&<span className="field-error">{errors.userId}</span>}
                </div>
                <div className="field">
                  <label>Full Name *</label>
                  <div className="field-wrap">
                    <input type="text" value={form.userName} onChange={e=>set('userName',e.target.value)}
                      placeholder="Full name" className={errors.userName?'error':''} />
                  </div>
                  {errors.userName&&<span className="field-error">{errors.userName}</span>}
                </div>
              </div>

              <div className="form-grid">
                <div className="field">
                  <label>Role / Designation *</label>
                  <div className="field-wrap">
                    <select value={form.userDesignation} onChange={e=>set('userDesignation',e.target.value)}
                      className={errors.userDesignation?'error':''}>
                      <option value="">Select a role</option>
                      {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                    <span className="field-icon">▾</span>
                  </div>
                  {errors.userDesignation&&<span className="field-error">{errors.userDesignation}</span>}
                </div>
                <div className="field">
                  <label>Email Address *</label>
                  <div className="field-wrap">
                    <input type="email" value={form.emailId} onChange={e=>set('emailId',e.target.value)}
                      placeholder="Email address" className={errors.emailId?'error':''} />
                  </div>
                  {errors.emailId&&<span className="field-error">{errors.emailId}</span>}
                </div>
              </div>

              <div className="field">
                <label>Mobile Number</label>
                <div className="field-wrap">
                  <input type="tel" value={form.mobileNumber} onChange={e=>set('mobileNumber',e.target.value)}
                    placeholder="10–15 digits (optional)" maxLength={15} />
                </div>
              </div>

              <div className="divider" />
              <div className="section-label">Branch / Department (Optional)</div>
              <div className="form-grid">
                <div className="field">
                  <label>Branch ID</label>
                  <div className="field-wrap">
                    <input type="text" value={form.branchId} onChange={e=>set('branchId',e.target.value)} placeholder="Branch ID" />
                  </div>
                </div>
                <div className="field">
                  <label>Branch Name</label>
                  <div className="field-wrap">
                    <input type="text" value={form.branchName} onChange={e=>set('branchName',e.target.value)} placeholder="Branch name" />
                  </div>
                </div>
                <div className="field">
                  <label>Department ID</label>
                  <div className="field-wrap">
                    <input type="text" value={form.departmentId} onChange={e=>set('departmentId',e.target.value)} placeholder="Dept ID" />
                  </div>
                </div>
                <div className="field">
                  <label>Department Name</label>
                  <div className="field-wrap">
                    <input type="text" value={form.departmentName} onChange={e=>set('departmentName',e.target.value)} placeholder="Dept name" />
                  </div>
                </div>
              </div>

              <div className="divider" />
              <div className="section-label">Security</div>
              <div className="form-grid">
                <div className="field">
                  <label>Password *</label>
                  <div className="field-wrap">
                    <input type={showPwd?'text':'password'} value={form.password} onChange={e=>set('password',e.target.value)}
                      placeholder="Strong password" className={errors.password?'error':''} maxLength={20} />
                    <span className="field-icon clickable" onClick={()=>setShowPwd(p=>!p)}>{showPwd?'🙈':'👁️'}</span>
                  </div>
                  {errors.password?<span className="field-error">{errors.password}</span>
                    :<span className="field-hint">8–20 chars · 1 uppercase · 1 special</span>}
                </div>
                <div className="field">
                  <label>Confirm Password *</label>
                  <div className="field-wrap">
                    <input type="password" value={form.confirmPassword} onChange={e=>set('confirmPassword',e.target.value)}
                      placeholder="Re-enter password" className={errors.confirmPassword?'error':''} maxLength={20} />
                  </div>
                  {errors.confirmPassword&&<span className="field-error">{errors.confirmPassword}</span>}
                </div>
              </div>

              <div style={{display:'flex',gap:12,justifyContent:'flex-end',marginTop:8}}>
                <button type="button" className="btn btn-secondary" onClick={()=>setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting?<><div className="spinner"/>Creating…</>:'✅ Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
