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
      <video autoPlay loop muted playsInline>
        <source src="https://videos.pexels.com/video-files/3370063/3370063-hd_1280_720_25fps.mp4" type="video/mp4" />
      </video>
      <div className="layer">
        <form className="card" onSubmit={submit}>
          <h2 style={{ marginTop: 0 }}>{strings.login}</h2>

          {/* ✅ Success message after registration */}
          {successMsg && (
            <div className="register-success-msg" style={{ marginBottom: 12 }}>
              ✅ {successMsg}
            </div>
          )}

          {/* ❌ Error message */}
          {error && (
            <div className="out-stock" style={{ marginBottom: 12 }}>{error}</div>
          )}

          <div className="field">
            <label>{strings.email}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
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
            />
          </div>

          <button className="btn-primary" type="submit" style={{ width: '100%' }} disabled={loading}>
            {loading ? '⏳ …' : strings.login}
          </button>

          <p style={{ textAlign: 'center', marginTop: 14, fontSize: 14, opacity: 0.75 }}>
            {strings.dontHaveAccount || "Don't have an account?"}{' '}
            <Link to="/register" style={{ color: '#4ade80' }}>{strings.register}</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;