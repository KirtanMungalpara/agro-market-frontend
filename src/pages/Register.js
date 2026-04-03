import React, { useContext, useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { TranslationContext } from '../utils/translations';

const Register = () => {
  const nav = useNavigate();
  const { strings } = useContext(TranslationContext);
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [role,     setRole]     = useState('farmer');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Register the user — but do NOT log them in automatically
      await axios.post(`${process.env.REACT_APP_API_URL}/auth/register`, { name, email, password, role });

      // Redirect to login page with a success message passed via state
      nav('/login', {
        state: {
          successMsg: strings.registerSuccess || 'Account created successfully! Please log in.',
          prefillEmail: email,
        },
      });
    } catch (err) {
      setError(err.response?.data?.message || strings.registerFailed || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-video-bg">
      <div className="auth-bg-img" style={{ backgroundImage: "url('/assets/auth_background_1775248798763.png')", backgroundPosition: 'center', backgroundSize: 'cover', backgroundRepeat: 'no-repeat' }}></div>

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
              Join India's
              <span>agri network.</span>
            </h1>
            <p>
              Whether you're a farmer, wholesaler, retailer, or admin —
              Agro Market gives you the tools to trade smarter and earn more.
            </p>
            <div className="auth-features">
              <div className="auth-feature-pill"><span className="pill-icon">🌱</span> Farmers list inventory & seeds</div>
              <div className="auth-feature-pill"><span className="pill-icon">🏪</span> Retailers buy at best retail prices</div>
              <div className="auth-feature-pill"><span className="pill-icon">📦</span> Wholesalers get bulk wholesale rates</div>
            </div>
          </div>

          {/* ── Right form card ── */}
          <div className="auth-right">
            <form className="card" onSubmit={submit}>
              <h2 style={{ marginTop: 0 }}>{strings.register}</h2>
              <p className="card-subtitle">Create your free account in seconds</p>

              {error && <div className="out-stock" style={{ marginBottom: 14 }}>{error}</div>}

              <div className="field">
                <label>{strings.name}</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                  placeholder="Your full name"
                />
              </div>

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
                  autoComplete="new-password"
                  minLength={6}
                  placeholder="At least 6 characters"
                />
              </div>

              <div className="field">
                <label>{strings.role}</label>
                <select value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="farmer">🌾 {strings.farmer}</option>
                  <option value="retailer">🏪 {strings.retailer}</option>
                  <option value="wholesaler">📦 {strings.wholesaler}</option>
                  <option value="admin">⚙️ {strings.admin}</option>
                </select>
              </div>

              <button className="btn-primary" type="submit" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
                {loading ? '⏳ Creating account…' : `✨ ${strings.register}`}
              </button>

              <p style={{ textAlign: 'center', marginTop: 18, fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>
                {strings.alreadyHaveAccount || 'Already have an account?'}{' '}
                <Link to="/login" style={{ color: '#4ade80', fontWeight: 600 }}>{strings.login}</Link>
              </p>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Register;