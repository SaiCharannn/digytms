import { useState, useEffect } from 'react';
import { checkSuperAdminStatus, validateInstitutionId, createSuperAdmin } from './api';

/* ── Helpers ── */
const PWD_REGEX = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]).{8,20}$/;
const EMAIL_REGEX = /^\S+@\S+\.\S+$/;
const MOB_REGEX = /^[0-9]{10,15}$/;

function pwdStrength(p) {
  if (!p) return 0;
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p)) s++;
  if (/[0-9]/.test(p)) s++;
  if (/[!@#$%^&*]/.test(p)) s++;
  return s;
}

const STRENGTH_COLORS = ['#ef4444','#f59e0b','#3b82f6','#10b981'];
const STRENGTH_LABELS = ['Weak','Fair','Good','Strong'];

/* ── Sub-components ── */
function StrengthBar({ password }) {
  const s = pwdStrength(password);
  return (
    <div>
      <div className="strength-bar">
        {[0,1,2,3].map(i => (
          <div key={i} className="strength-seg"
            style={{ background: i < s ? STRENGTH_COLORS[s-1] : undefined }} />
        ))}
      </div>
      {password && (
        <div className="strength-label" style={{ color: STRENGTH_COLORS[s-1] }}>
          {STRENGTH_LABELS[s-1]}
        </div>
      )}
    </div>
  );
}

/* ── Locked Screen ── */
function AlreadySetupScreen() {
  return (
    <div className="locked-screen">
      <div className="locked-icon">🔒</div>
      <h1>Setup Complete</h1>
      <p>
        A Super Admin account has already been created for this system.
        This setup portal is now <strong>locked</strong> for security.
        Please use the <strong>Main Application</strong> to log in.
      </p>
      <div className="locked-badge">
        <span>✅</span>
        <span>System successfully configured</span>
      </div>
    </div>
  );
}

/* ── Loading Screen ── */
function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-spinner-lg" />
      <p className="loading-text">Checking system status…</p>
    </div>
  );
}

/* ── Success Screen ── */
function SuccessScreen({ data }) {
  return (
    <div className="success-screen">
      <div className="success-icon">✓</div>
      <h3>Super Admin Created!</h3>
      <p>Your system is now configured. Use these credentials to log in.</p>
      <div className="info-pill"><strong>Institution ID:</strong> {data.institutionId}</div>
      <div className="info-pill"><strong>User ID:</strong> {data.userId}</div>
      <div className="info-pill"><strong>Name:</strong> {data.userName}</div>
      <div className="info-pill"><strong>Email:</strong> {data.emailId}</div>
      <div className="alert alert-info" style={{ marginTop: 20, textAlign:'left' }}>
        <span>ℹ️</span>
        <span>This page is now locked. Navigate to the <strong>Main App</strong> (port 5174) to log in as Super Admin.</span>
      </div>
    </div>
  );
}

/* ── Main Form ── */
export default function App() {
  const [status, setStatus] = useState('loading'); // loading | locked | form | done
  const [form, setForm] = useState({
    institutionId: '', institutionName: '', userName: '',
    userDesignation: '', mobileNumber: '', emailId: '', password: '', confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [instAvail, setInstAvail] = useState(null); // null | true | false | 'checking'
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [successData, setSuccessData] = useState(null);

  useEffect(() => {
    checkSuperAdminStatus()
      .then(res => {
        if (res.data.superAdminExists) setStatus('locked');
        else setStatus('form');
      })
      .catch(() => setStatus('form'));
  }, []);

  /* Live institution ID check */
  useEffect(() => {
    if (!form.institutionId) { setInstAvail(null); return; }
    if (!/^[A-Za-z0-9]+$/.test(form.institutionId)) { setInstAvail(false); return; }
    const t = setTimeout(async () => {
      setInstAvail('checking');
      try {
        const r = await validateInstitutionId(form.institutionId);
        setInstAvail(r.data.available ? true : false);
      } catch { setInstAvail(null); }
    }, 500);
    return () => clearTimeout(t);
  }, [form.institutionId]);

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: '' }));
    setGlobalError('');
  };

  function validate() {
    const e = {};
    if (!form.institutionId) e.institutionId = 'Required';
    else if (instAvail === false) e.institutionId = 'ID already taken';
    if (!form.institutionName) e.institutionName = 'Required';
    if (!form.userName) e.userName = 'Required';
    if (form.mobileNumber && !MOB_REGEX.test(form.mobileNumber)) e.mobileNumber = '10–15 digits only';
    if (!form.emailId) e.emailId = 'Required';
    else if (!EMAIL_REGEX.test(form.emailId)) e.emailId = 'Invalid email';
    if (!form.password) e.password = 'Required';
    else if (!PWD_REGEX.test(form.password)) e.password = '8–20 chars, 1 uppercase, 1 special';
    if (!form.confirmPassword) e.confirmPassword = 'Required';
    else if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);
    setGlobalError('');
    try {
      const res = await createSuperAdmin({
        institutionId: form.institutionId,
        institutionName: form.institutionName,
        userName: form.userName,
        userDesignation: form.userDesignation,
        mobileNumber: form.mobileNumber,
        emailId: form.emailId,
        password: form.password,
        confirmPassword: form.confirmPassword,
      });
      setSuccessData(res.data.data);
      setStatus('done');
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong. Try again.';
      const srvErrs = err.response?.data?.errors || {};
      setGlobalError(msg);
      setErrors(srvErrs);
    } finally {
      setSubmitting(false);
    }
  }

  if (status === 'loading') return <LoadingScreen />;
  if (status === 'locked') return <AlreadySetupScreen />;

  return (
    <div className="page">
      {/* Left Panel */}
      <div className="panel-left">
        <div className="brand-mark">
          <div className="brand-icon">🏛️</div>
          <div className="brand-name">Samcomm</div>
        </div>
        <div className="panel-left-content">
          <h1>Initial<span>System Setup</span></h1>
          <p>
            Create your institution's Super Admin account. This one-time setup
            secures your system and grants full administrative control.
          </p>
          <div className="step-list">
            {['Enter institution details','Set administrator credentials','Activate your system','Log in via Main App'].map((s,i) => (
              <div className="step-item" key={i}>
                <div className="step-num">{i+1}</div>
                <div className="step-text">{s}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="panel-right">
        <div className="form-card">
          {status === 'done' ? (
            <SuccessScreen data={successData} />
          ) : (
            <>
              <h2>Create Super Admin</h2>
              <p className="subtitle">One-time setup — this form locks after completion</p>

              {globalError && (
                <div className="alert alert-error">
                  <span>⚠️</span><span>{globalError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                {/* Institution */}
                <div className="section-label">Institution Details</div>

                <div className="form-row">
                  <div className="field">
                    <label>Institution ID *</label>
                    <div className="field-wrap">
                      <input
                        type="text"
                        value={form.institutionId}
                        onChange={e => set('institutionId', e.target.value.toUpperCase())}
                        placeholder="e.g. SAMCOMM001"
                        className={errors.institutionId ? 'error' : instAvail === true ? 'valid' : ''}
                        maxLength={20}
                      />
                      <span className="field-icon">
                        {instAvail === 'checking' && <span style={{fontSize:'0.7rem'}}>⏳</span>}
                        {instAvail === true && <span style={{color:'var(--success)'}}>✓</span>}
                        {instAvail === false && <span style={{color:'var(--error)'}}>✗</span>}
                      </span>
                    </div>
                    {errors.institutionId && <span className="field-error">{errors.institutionId}</span>}
                    {!errors.institutionId && <span className="field-hint">Alphanumeric, unique identifier</span>}
                  </div>

                  <div className="field">
                    <label>Institution Name *</label>
                    <div className="field-wrap">
                      <input
                        type="text"
                        value={form.institutionName}
                        onChange={e => set('institutionName', e.target.value)}
                        placeholder="Full institution name"
                        className={errors.institutionName ? 'error' : ''}
                      />
                    </div>
                    {errors.institutionName && <span className="field-error">{errors.institutionName}</span>}
                  </div>
                </div>

                <div className="divider" />
                <div className="section-label">Administrator Details</div>

                <div className="field">
                  <label>Full Name *</label>
                  <div className="field-wrap">
                    <input
                      type="text"
                      value={form.userName}
                      onChange={e => set('userName', e.target.value)}
                      placeholder="Administrator's full name"
                      className={errors.userName ? 'error' : ''}
                    />
                  </div>
                  {errors.userName && <span className="field-error">{errors.userName}</span>}
                </div>

                <div className="form-row">
                  <div className="field">
                    <label>Designation</label>
                    <div className="field-wrap">
                      <select value={form.userDesignation} onChange={e => set('userDesignation', e.target.value)}>
                        <option value="">Super Admin (default)</option>
                        <option value="SYSTEM_ADMINISTRATOR">System Administrator</option>
                      </select>
                      <span className="field-icon">▾</span>
                    </div>
                  </div>

                  <div className="field">
                    <label>Mobile Number</label>
                    <div className="field-wrap">
                      <input
                        type="tel"
                        value={form.mobileNumber}
                        onChange={e => set('mobileNumber', e.target.value)}
                        placeholder="10–15 digits"
                        className={errors.mobileNumber ? 'error' : ''}
                        maxLength={15}
                      />
                    </div>
                    {errors.mobileNumber && <span className="field-error">{errors.mobileNumber}</span>}
                  </div>
                </div>

                <div className="field">
                  <label>Email Address *</label>
                  <div className="field-wrap">
                    <input
                      type="email"
                      value={form.emailId}
                      onChange={e => set('emailId', e.target.value)}
                      placeholder="admin@institution.edu"
                      className={errors.emailId ? 'error' : ''}
                    />
                  </div>
                  {errors.emailId && <span className="field-error">{errors.emailId}</span>}
                </div>

                <div className="divider" />
                <div className="section-label">Security</div>

                <div className="field">
                  <label>Password *</label>
                  <div className="field-wrap">
                    <input
                      type={showPwd ? 'text' : 'password'}
                      value={form.password}
                      onChange={e => set('password', e.target.value)}
                      placeholder="Create a strong password"
                      className={errors.password ? 'error' : ''}
                      maxLength={20}
                    />
                    <span className="field-icon clickable" onClick={() => setShowPwd(p => !p)}>
                      {showPwd ? '🙈' : '👁️'}
                    </span>
                  </div>
                  {form.password && <StrengthBar password={form.password} />}
                  {errors.password
                    ? <span className="field-error">{errors.password}</span>
                    : <span className="field-hint">8–20 chars · 1 uppercase · 1 special character</span>}
                </div>

                <div className="field">
                  <label>Confirm Password *</label>
                  <div className="field-wrap">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={form.confirmPassword}
                      onChange={e => set('confirmPassword', e.target.value)}
                      placeholder="Re-enter your password"
                      className={errors.confirmPassword ? 'error' : ''}
                      maxLength={20}
                    />
                    <span className="field-icon clickable" onClick={() => setShowConfirm(p => !p)}>
                      {showConfirm ? '🙈' : '👁️'}
                    </span>
                  </div>
                  {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
                </div>

                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? <><div className="spinner" />Creating Account…</> : '🚀 Create Super Admin'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
