import React, { useContext, useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TranslationContext } from '../utils/translations';

const roleColor = {
  farmer:     '#4ade80',
  retailer:   '#60a5fa',
  wholesaler: '#f59e0b',
  admin:      '#f87171',
};

const FALLBACK_RATES = [
  { crop: 'Wheat',   price: '₹2200/qtl' },
  { crop: 'Rice',    price: '₹2000/qtl' },
  { crop: 'Cotton',  price: '₹6800/qtl' },
  { crop: 'Maize',   price: '₹1850/qtl' },
  { crop: 'Soybean', price: '₹4100/qtl' },
];

const Navbar = ({ user, onLogout, darkMode, setDarkMode }) => {
  const { language, setLanguage, strings } = useContext(TranslationContext);
  const [drawerOpen,  setDrawerOpen]  = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [liveRates,   setLiveRates]   = useState(FALLBACK_RATES);
  const profileRef = useRef(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/products`)
        if (!res.ok) return;
        const products = await res.json();
        const inStock = products.filter(p => p.quantity > 0);
        if (!inStock.length) return;
        const rates = inStock.map(p => ({ crop: p.name, price: `₹${p.retailPrice}/unit` }));
        setLiveRates(rates.length < 6 ? [...rates, ...rates] : rates);
      } catch { /* keep fallback */ }
    };
    fetchProducts();
    const id = setInterval(fetchProducts, 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const closeDrawer = () => setDrawerOpen(false);

  return (
    <>
      <div className="ticker-wrap">
        <div className="ticker-badge">
          <span className="ticker-live-dot" />
          <span className="ticker-live-text">LIVE</span>
        </div>
        <div className="ticker-window">
          <div className="ticker-scroll">
            {liveRates.map((r, i) => (
              <span key={i} className="ticker-item">
                <span className="ticker-crop">{r.crop}</span>
                <span className="ticker-price">{r.price}</span>
                <span className="ticker-sep">|</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <nav className="navbar">
        <Link to="/" className="brand">
          <span className="brand-icon">🌾</span>
          <span className="brand-text">Agro Market</span>
        </Link>
        
        <div className="nav-center-links" style={{display: 'flex', gap: '30px', fontWeight: 600, fontSize: '15px'}}>
          <Link to="/" style={{color: '#64748b', textDecoration: 'none'}}>Home</Link>
          <span style={{color: '#059669', borderBottom: '2px solid #059669', paddingBottom: '4px'}}>Market</span>
          <Link to={`/${user?.role || 'login'}`} style={{color: '#64748b', textDecoration: 'none'}}>Dashboard</Link>
          <Link to="/mandi-rates" style={{color: '#64748b', textDecoration: 'none'}}>Mandi Rates</Link>
        </div>

        <div className="nav-right">
          <div className="nav-pill">
            <span>🌐</span>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} className="pill-select">
              <option value="en">EN</option>
              <option value="hi">हिंदी</option>
            </select>
          </div>

          <button className="nav-icon-btn" onClick={() => setDarkMode(d => !d)} title={darkMode ? strings.switchToLight : strings.switchToDark}>
            <span>{darkMode ? '☀️' : '🌙'}</span>
            <span className="theme-label">{darkMode ? strings.light : strings.dark}</span>
          </button>

          {!user && (
            <div className="nav-auth-btns">
              <Link to="/login"    className="nav-auth-btn login-btn">{strings.login}</Link>
              <Link to="/register" className="nav-auth-btn register-btn">{strings.register}</Link>
            </div>
          )}

          {user && (
            <div className="profile-wrap" ref={profileRef}>
              <button className="profile-trigger" onClick={() => setProfileOpen(o => !o)}>
                <div className="profile-avatar" style={{ background: `${roleColor[user.role]||'#94a3b8'}22`, borderColor: roleColor[user.role]||'#94a3b8' }}>
                  {user.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="profile-info">
                  <span className="profile-name">{user.name}</span>
                  <span className="profile-role" style={{ color: roleColor[user.role] }}>{user.role}</span>
                </div>
                <span className="profile-chevron">{profileOpen ? '▲' : '▼'}</span>
              </button>
              {profileOpen && (
                <div className="profile-dropdown">
                  <div className="dropdown-header">
                    <div className="dropdown-avatar" style={{ background: `${roleColor[user.role]||'#94a3b8'}22`, borderColor: roleColor[user.role]||'#94a3b8' }}>
                      {user.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <div className="dropdown-name">{user.name}</div>
                      <div className="dropdown-role" style={{ color: roleColor[user.role] }}>{user.role}</div>
                    </div>
                  </div>
                  <div className="dropdown-divider" />
                  <button className="dropdown-item logout-item" onClick={() => { onLogout(); setProfileOpen(false); }}>
                    🚪 {strings.logout}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <button className="nav-hamburger" onClick={() => setDrawerOpen(true)} aria-label="Open menu">
          <span /><span /><span />
        </button>
      </nav>

      {drawerOpen && <div className="drawer-overlay" onClick={closeDrawer} />}

      <div className={`nav-drawer ${drawerOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <span className="brand" style={{ fontSize: 16 }}>🌾 Agro Market</span>
          <button className="drawer-close-btn" onClick={closeDrawer}>✕</button>
        </div>
        {user && (
          <div className="drawer-user-card">
            <div className="drawer-avatar" style={{ background: `${roleColor[user.role]||'#94a3b8'}22`, borderColor: roleColor[user.role]||'#94a3b8', color: roleColor[user.role]||'#94a3b8' }}>
              {user.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <div className="drawer-username">{user.name}</div>
              <div className="drawer-userrole" style={{ color: roleColor[user.role] }}>{user.role}</div>
            </div>
          </div>
        )}
        <div className="drawer-divider" />
        <div className="drawer-row">
          <span className="drawer-label">🌐 Language</span>
          <select value={language} onChange={(e) => setLanguage(e.target.value)} className="drawer-select">
            <option value="en">English</option>
            <option value="hi">हिंदी</option>
          </select>
        </div>
        <button className="drawer-item-btn" onClick={() => setDarkMode(d => !d)}>
          {darkMode ? `☀️ ${strings.switchToLight}` : `🌙 ${strings.switchToDark}`}
        </button>
        <div className="drawer-divider" />
        {user ? (
          <button className="drawer-item-btn danger" onClick={() => { onLogout(); closeDrawer(); }}>
            🚪 {strings.logout}
          </button>
        ) : (
          <>
            <Link to="/login"    className="drawer-item-btn" onClick={closeDrawer}>🔑 {strings.login}</Link>
            <Link to="/register" className="drawer-item-btn" onClick={closeDrawer}>📝 {strings.register}</Link>
          </>
        )}
      </div>
    </>
  );
};

export default Navbar;