import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login } from '../api/client';

export default function LoginPage() {
  const [form, setForm] = useState({ userId: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { saveSession } = useAuth();
  const navigate = useNavigate();

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setError(''); };

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.userId || !form.password) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    try {
      const res = await login(form);
      const d = res.data;
      if (d.forcePasswordChange) {
        saveSession(d.user, d.tempToken, d.refreshToken);
        navigate('/change-password');
        return;
      }
      saveSession(d.user, d.accessToken, d.refreshToken);
      navigate('/dashboard');
    } catch (err) {
      const msgs = err.response?.data?.errors;
      if (Array.isArray(msgs)) setError(msgs[0]);
      else setError(err.response?.data?.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-left-brand">
          <div className="login-left-brand-icon">🏛️</div>
          <div className="login-left-brand-name">Samcomm</div>
        </div>
        <div className="login-left-content">
          <h1>Welcome<span>Back.</span></h1>
          <p>
            Your institution's all-in-one management system. Log in with your
            assigned credentials to access your dashboard.
          </p>
        </div>
      </div>
      <div className="login-right">
        <div className="login-card">
          <h2>Sign In</h2>
          <p className="subtitle">Enter your User ID and password to continue</p>

          {error && (
            <div className="alert alert-error">
              <span>⚠️</span><span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label>User ID</label>
              <div className="field-wrap">
                <input
                  type="text"
                  value={form.userId}
                  onChange={e => set('userId', e.target.value)}
                  placeholder="Your assigned user ID"
                  autoComplete="username"
                />
                <span className="field-icon">👤</span>
              </div>
            </div>

            <div className="field">
              <label>Password</label>
              <div className="field-wrap">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                  placeholder="Your password"
                  autoComplete="current-password"
                />
                <span className="field-icon clickable" onClick={() => setShowPwd(p => !p)}>
                  {showPwd ? '🙈' : '👁️'}
                </span>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8, justifyContent: 'center' }} disabled={loading}>
              {loading ? <><div className="spinner" />Signing in…</> : '🔑 Sign In'}
            </button>
          </form>

          <p style={{ marginTop: 24, textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            New student?{' '}
            <a href="/register" style={{ color: 'var(--primary-light)', fontWeight: 600 }}>
              Register here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
