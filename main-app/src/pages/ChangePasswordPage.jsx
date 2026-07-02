import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { changePassword } from '../api/client';

const PWD_REGEX = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]).{8,20}$/;

function pwdStrength(p) {
  if (!p) return 0;
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p)) s++;
  if (/[0-9]/.test(p)) s++;
  if (/[!@#$%^&*]/.test(p)) s++;
  return s;
}
const COLS = ['#ef4444','#f59e0b','#3b82f6','#10b981'];
const LABS = ['Weak','Fair','Good','Strong'];

export default function ChangePasswordPage() {
  const { user, saveSession } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' });
  const [show1, setShow1] = useState(false);
  const [show2, setShow2] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [globalErr, setGlobalErr] = useState('');

  const set = (k, v) => { setForm(f => ({...f,[k]:v})); setErrors(e=>({...e,[k]:''})); setGlobalErr(''); };
  const s = pwdStrength(form.newPassword);

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = {};
    if (!form.newPassword) errs.newPassword = 'Required';
    else if (!PWD_REGEX.test(form.newPassword)) errs.newPassword = '8–20 chars, 1 uppercase, 1 special';
    if (!form.confirmPassword) errs.confirmPassword = 'Required';
    else if (form.newPassword !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const res = await changePassword(form);
      const d = res.data;
      saveSession(user, d.accessToken, d.refreshToken);
      navigate('/dashboard');
    } catch (err) {
      setGlobalErr(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="force-pwd-page">
      <div className="force-pwd-card">
        <div style={{fontSize:'2rem',marginBottom:16}}>🔐</div>
        <h2>Change Your Password</h2>
        <p>For security, you must set a new password before continuing. This is a one-time requirement.</p>

        {globalErr && <div className="alert alert-error"><span>⚠️</span><span>{globalErr}</span></div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label>New Password *</label>
            <div className="field-wrap">
              <input
                type={show1?'text':'password'}
                value={form.newPassword}
                onChange={e=>set('newPassword',e.target.value)}
                placeholder="Create a strong password"
                className={errors.newPassword?'error':''}
                maxLength={20}
              />
              <span className="field-icon clickable" onClick={()=>setShow1(p=>!p)}>{show1?'🙈':'👁️'}</span>
            </div>
            {form.newPassword && (
              <div>
                <div className="strength-bar">
                  {[0,1,2,3].map(i=>(
                    <div key={i} className="strength-seg" style={{background:i<s?COLS[s-1]:undefined}} />
                  ))}
                </div>
                <div className="strength-label" style={{color:COLS[s-1]}}>{LABS[s-1]}</div>
              </div>
            )}
            {errors.newPassword?<span className="field-error">{errors.newPassword}</span>
              :<span className="field-hint">8–20 chars · 1 uppercase · 1 special character</span>}
          </div>

          <div className="field">
            <label>Confirm Password *</label>
            <div className="field-wrap">
              <input
                type={show2?'text':'password'}
                value={form.confirmPassword}
                onChange={e=>set('confirmPassword',e.target.value)}
                placeholder="Re-enter new password"
                className={errors.confirmPassword?'error':''}
                maxLength={20}
              />
              <span className="field-icon clickable" onClick={()=>setShow2(p=>!p)}>{show2?'🙈':'👁️'}</span>
            </div>
            {errors.confirmPassword&&<span className="field-error">{errors.confirmPassword}</span>}
          </div>

          <button type="submit" className="btn btn-primary" style={{width:'100%',justifyContent:'center',marginTop:8}} disabled={loading}>
            {loading?<><div className="spinner"/>Updating…</>:'✅ Set New Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
