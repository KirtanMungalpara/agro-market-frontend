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
      <video autoPlay loop muted playsInline>
        <source src="https://videos.pexels.com/video-files/2818546/2818546-hd_1280_720_25fps.mp4" type="video/mp4" />
      </video>
      <div className="layer">
        <form className="card" onSubmit={submit}>
          <h2 style={{ marginTop: 0 }}>{strings.register}</h2>

          {error && <div className="out-stock" style={{ marginBottom: 12 }}>{error}</div>}

          <div className="field">
            <label>{strings.name}</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
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
            />
          </div>

          <div className="field">
            <label>{strings.role}</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="farmer">{strings.farmer}</option>
              <option value="retailer">{strings.retailer}</option>
              <option value="wholesaler">{strings.wholesaler}</option>
              <option value="admin">{strings.admin}</option>
            </select>
          </div>

          <button className="btn-primary" type="submit" style={{ width: '100%' }} disabled={loading}>
            {loading ? '⏳ …' : strings.register}
          </button>

          <p style={{ textAlign: 'center', marginTop: 14, fontSize: 14, opacity: 0.75 }}>
            {strings.alreadyHaveAccount || 'Already have an account?'}{' '}
            <Link to="/login" style={{ color: '#4ade80' }}>{strings.login}</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;