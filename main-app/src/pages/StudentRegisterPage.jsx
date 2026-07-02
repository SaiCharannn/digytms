import { useState } from 'react';
import { registerStudent } from '../api/client';

const MOB_REGEX = /^[0-9]{10,15}$/;
const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

export default function StudentRegisterPage() {
  const [form, setForm] = useState({ studentName:'', emailId:'', mobileNumber:'', password:'', confirmPassword:'' });
  const [errors, setErrors] = useState({});  
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [globalErr, setGlobalErr] = useState('');
  const [success, setSuccess] = useState(null);

  const set = (k,v) => { setForm(f=>({...f,[k]:v})); setErrors(e=>({...e,[k]:''})); setGlobalErr(''); };

  function validate() {
    const e = {};
    if (!form.studentName) e.studentName='Required';
    if (!form.emailId) e.emailId='Required';
    else if (!EMAIL_REGEX.test(form.emailId)) e.emailId='Invalid email';
    if (!form.mobileNumber) e.mobileNumber='Required'; 
    else if (!MOB_REGEX.test(form.mobileNumber)) e.mobileNumber='10–15 digits only';
    if (!form.password) e.password='Required';
    else if (form.password.length<8) e.password='Minimum 8 characters';
    if (!form.confirmPassword) e.confirmPassword='Required';
    else if (form.password!==form.confirmPassword) e.confirmPassword='Passwords do not match';
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {setErrors(errs); return;}
    setLoading(true);
    try {
      const res = await registerStudent(form);
      setSuccess(res.data.studentId);
    } catch (err) {
      const srvErrs = err.response?.data?.errors || {};
      setErrors(srvErrs);
      setGlobalErr(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="register-page">
        <div className="register-card" style={{textAlign:'center'}}>
          <div style={{fontSize:'3rem',marginBottom:16}}>🎉</div>
          <h2 style={{fontFamily:'var(--font-display)',fontSize:'1.6rem',color:'var(--primary)',marginBottom:8}}>
            Registration Successful!
          </h2>
          <p style={{color:'var(--text-secondary)',marginBottom:24}}>
            Your student account has been created. Use your Student ID to log in.
          </p>
          <div style={{background:'var(--surface-2)',border:'1.5px solid var(--border)',borderRadius:'var(--radius-sm)',padding:'16px 24px',marginBottom:24}}>
            <div style={{fontSize:'0.75rem',color:'var(--text-muted)',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:4}}>Your Student ID</div>
            <div style={{fontSize:'1.5rem',fontWeight:700,color:'var(--primary)',letterSpacing:'0.05em'}}>{success}</div>
          </div>
          <div className="alert alert-info" style={{textAlign:'left'}}>
            <span>ℹ️</span>
            <span>Save your Student ID — you'll need it to log in to the system.</span>
          </div>
          <a href="/login" className="btn btn-primary" style={{marginTop:16,display:'inline-flex',justifyContent:'center'}}>
            🔑 Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="register-page">
      <div className="register-card">
        <div className="register-card-header">
          <div className="logo">🎓</div>
          <h2>Student Registration</h2>
          <p>Create your student account to get started</p>
        </div>

        {globalErr && <div className="alert alert-error"><span>⚠️</span><span>{globalErr}</span></div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label>Full Name *</label>
            <div className="field-wrap">
              <input type="text" value={form.studentName} onChange={e=>set('studentName',e.target.value)}
                placeholder="Your full name" className={errors.studentName?'error':''} />
            </div>
            {errors.studentName&&<span className="field-error">{errors.studentName}</span>}
          </div>
    <div></div>
          <div className="form-grid">
            <div className="field">
              <label>Email Address *</label>
              <div className="field-wrap">
                <input type="email" value={form.emailId} onChange={e=>set('emailId',e.target.value)}
                  placeholder="your@email.com" className={errors.emailId?'error':''} />
              </div>
              {errors.emailId&&<span className="field-error">{errors.emailId}</span>}
            </div>

            <div className="field">
              <label>Mobile Number *</label>
              <div className="field-wrap">
                <input type="tel" value={form.mobileNumber} onChange={e=>set('mobileNumber',e.target.value)}
                  placeholder="10–15 digits" className={errors.mobileNumber?'error':''} maxLength={15} />
              </div>
              {errors.mobileNumber&&<span className="field-error">{errors.mobileNumber}</span>}
            </div>
          </div>

          <div className="divider" />
          <div className="form-grid">
            <div className= "field">
              <label>Password *</label>
              <div className="field-wrap">
                <input type={showPwd?'text':'password'} value={form.password} onChange={e=>set('password',e.target.value)}
                  placeholder="Min 8 characters" className={errors.password?'error':''} />
                <span className="field-icon clickable" onClick={()=>setShowPwd(p=>!p)}>{showPwd?'🙈':'👁️'}</span>
              </div>
              {errors.password&&<span className="field-error">{errors.password}</span>}
            </div>

            <div className="field">
              <label>Confirm Password *</label>
              <div className="field-wrap">
                <input type="password" value={form.confirmPassword} onChange={e=>set('confirmPassword',e.target.value)}
                  placeholder="Re-enter password" className={errors.confirmPassword?'error':''} />
              </div>
              {errors.confirmPassword&&<span className="field-error">{errors.confirmPassword}</span>}
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{width:'100%',justifyContent:'center',marginTop:8}} disabled={loading}>
            {loading?<><div className="spinner"/>Registering…</>:'🎓 Create Student Account'}
          </button>
          
          <p style={{marginTop:20,textAlign:'center',fontSize:'0.82rem',color:'var(--text-muted)'}}>
            Already registered?{' '}
            <a href="/login" style={{color:'var(--primary-light)',fontWeight:600}}>Sign in here</a>
          </p>
        </form>
      </div>
    </div>
  );
}
 

