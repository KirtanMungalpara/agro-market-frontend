import React, { useContext, useState } from 'react';
import axios from 'axios';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { TranslationContext } from '../utils/translations';

const Login = ({ onAuth }) => {
  const nav      = useNavigate();
  const location = useLocation();
  const { strings } = useContext(TranslationContext);

  // Pick up success message + pre-filled email passed from Register page
  const successMsg   = location.state?.successMsg   || '';
  const prefillEmail = location.state?.prefillEmail || '';

  const [email,    setEmail]    = useState(prefillEmail);
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await axios.post(`${process.env.REACT_APP_API_URL}/auth/login`, { email, password });
      onAuth(data);
      const role = data.user.role;
      nav(
        role === 'farmer'     ? '/farmer'     :
        role === 'retailer'   ? '/retailer'   :
        role === 'wholesaler' ? '/wholesaler' :
        '/admin'
      );
    } catch (err) {
      setError(err.response?.data?.message || strings.loginFailed || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-video-bg">
      {/* Background video */}
      <video autoPlay loop muted playsInline>
        <source src="https://videos.pexels.com/video-files/3370063/3370063-hd_1280_720_25fps.mp4" type="video/mp4" />
      </video>

      {/* Floating particles */}
      <span className="auth-particle" />
      <span className="auth-particle" />
      <span className="auth-particle" />
      <span className="auth-particle" />
      <span className="auth-particle" />

      <div className="layer">
        <div className="auth-split">

          {/* ── Left branding panel ── */}
          <div className="auth-left">
            <div className="auth-left-logo">
              <div className="auth-left-logo-icon">🌾</div>
              <span className="auth-left-logo-text">Agro Market</span>
            </div>
            <h1>
              Welcome back
              <span>to the farm.</span>
            </h1>
            <p>
              Connect directly with farmers, wholesalers, and retailers.
              Real-time prices, seamless payments, and full transparency.
            </p>
            <div className="auth-features">
              <div className="auth-feature-pill"><span className="pill-icon">📈</span> Live market rates updated every minute</div>
              <div className="auth-feature-pill"><span className="pill-icon">💳</span> Instant UPI payments with receipts</div>
              <div className="auth-feature-pill"><span className="pill-icon">🤝</span> Trusted by farmers across India</div>
            </div>
          </div>

          {/* ── Right form card ── */}
          <div className="auth-right">
            <form className="card" onSubmit={submit}>
              <h2 style={{ marginTop: 0 }}>{strings.login}</h2>
              <p className="card-subtitle">Sign in to your account to continue</p>

              {successMsg && (
                <div className="register-success-msg" style={{ marginBottom: 16 }}>
                  ✅ {successMsg}
                </div>
              )}
              {error && (
                <div className="out-stock" style={{ marginBottom: 14 }}>{error}</div>
              )}

              <div className="field">
                <label>{strings.email}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                />
              </div>

              <div className="field">
                <label>{strings.password}</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                />
              </div>

              <button className="btn-primary" type="submit" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
                {loading ? '⏳ Signing in…' : `🔑 ${strings.login}`}
              </button>

              <p style={{ textAlign: 'center', marginTop: 18, fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>
                {strings.dontHaveAccount || "Don't have an account?"}{' '}
                <Link to="/register" style={{ color: '#4ade80', fontWeight: 600 }}>{strings.register}</Link>
              </p>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;