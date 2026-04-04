import React, { useState, useMemo, useEffect, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import FarmerDashboard from './pages/FarmerDashboard';
import RetailerDashboard from './pages/RetailerDashboard';
import WholesalerDashboard from './pages/WholesalerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import PaymentSuccess from './pages/PaymentSuccess';
import MandiRates from './pages/MandiRates';
import { TranslationContext, translations } from './utils/translations';
import './App.css';

/* ── Stats counter animation ── */
const CountUp = ({ end, suffix = '' }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(end / 60);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(start);
    }, 25);
    return () => clearInterval(timer);
  }, [end]);
  return <span>{count.toLocaleString()}{suffix}</span>;
};

/* ── Product type → emoji ── */
const typeEmoji = (type, name) => {
  if (type === 'seeds') return '🌱';
  const n = (name || '').toLowerCase();
  if (n.includes('rice'))   return '🌾';
  if (n.includes('wheat'))  return '🌾';
  if (n.includes('cotton')) return '🪴';
  if (n.includes('maize') || n.includes('corn')) return '🌽';
  if (n.includes('soybean') || n.includes('soy')) return '🫘';
  if (n.includes('tomato')) return '🍅';
  if (n.includes('onion'))  return '🧅';
  if (n.includes('potato')) return '🥔';
  return '🌿';
};

const FALLBACK_CARDS = [
  { name: 'Wheat',  retailPrice: 2200, type: 'inventory', cssClass: 'card-wheat'  },
  { name: 'Rice',   retailPrice: 2000, type: 'inventory', cssClass: 'card-rice'   },
  { name: 'Cotton', retailPrice: 6800, type: 'inventory', cssClass: 'card-cotton' },
];
const CARD_CLASSES = ['card-wheat', 'card-rice', 'card-cotton'];

/* ══ HomePage ══════════════════════════════════════════════ */
const HomePage = () => {
  const { strings } = useContext(TranslationContext);
  const [visible,    setVisible]    = useState(false);
  const [floatCards, setFloatCards] = useState(FALLBACK_CARDS);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/products`) ;
        if (!res.ok) return;
        const products = await res.json();
        const inStock = products.filter(p => p.quantity > 0);
        if (!inStock.length) return;
        setFloatCards(
          inStock.slice(0, 3).map((p, i) => ({
            name: p.name, retailPrice: p.retailPrice,
            type: p.type, cssClass: CARD_CLASSES[i],
          }))
        );
      } catch { /* keep fallback */ }
    };
    fetchProducts();
    const id = setInterval(fetchProducts, 60_000);
    return () => clearInterval(id);
  }, []);

  const features = [
    { icon: '🌾', title: strings.feat1Title, desc: strings.feat1Desc },
    { icon: '📦', title: strings.feat2Title, desc: strings.feat2Desc },
    { icon: '🛒', title: strings.feat3Title, desc: strings.feat3Desc },
    { icon: '📊', title: strings.feat4Title, desc: strings.feat4Desc },
    { icon: '🔒', title: strings.feat5Title, desc: strings.feat5Desc },
    { icon: '🌍', title: strings.feat6Title, desc: strings.feat6Desc },
  ];

  const stats = [
    { value: 1200, suffix: '+', label: strings.statFarmers     },
    { value: 850,  suffix: '+', label: strings.statProducts    },
    { value: 5400, suffix: '+', label: strings.statOrders      },
    { value: 98,   suffix: '%', label: strings.statSatisfaction },
  ];

  const steps = [
    { step: '01', icon: '📝', title: strings.step1Title, desc: strings.step1Desc },
    { step: '02', icon: '🌾', title: strings.step2Title, desc: strings.step2Desc },
    { step: '03', icon: '🛒', title: strings.step3Title, desc: strings.step3Desc },
    { step: '04', icon: '💰', title: strings.step4Title, desc: strings.step4Desc },
  ];

  const testimonials = [
    { name: 'Ramesh Patel',  role: 'Farmer, Gujarat',     text: 'Agro Market helped me sell my wheat directly to retailers at 20% better prices than the local mandi.', avatar: '👨‍🌾' },
    { name: 'Sunita Sharma', role: 'Retailer, Rajasthan', text: 'I get fresh produce at wholesale rates. The payment system is simple and receipts are very professional.', avatar: '👩‍💼' },
    { name: 'Vikram Singh',  role: 'Wholesaler, Punjab',  text: 'Bulk ordering has never been easier. I can compare prices and place large orders in just a few clicks.', avatar: '👨‍💼' },
  ];

  return (
    <div className="home-page">

      {/* ══ HERO ══════════════════════════════════════════════ */}
      <section className="hero-section">
        <div className="hero-slideshow">
          <div className="hero-slide" style={{ backgroundImage: "url('/assets/wheat_sunset_1775248656092.png')" }}></div>
          <div className="hero-slide" style={{ backgroundImage: "url('/assets/modern_farming_1775248687280.png')" }}></div>
          <div className="hero-slide" style={{ backgroundImage: "url('/assets/soil_sprout_1775248670262.png')" }}></div>
          <div className="hero-slide" style={{ backgroundImage: "url('/assets/lush_terraces_1775250561985.png')" }}></div>
          <div className="hero-slide" style={{ backgroundImage: "url('/assets/auth_background_1775248798763.png')" }}></div>
        </div>
        <div className="hero-overlay" />

        <div className={`hero-content ${visible ? 'hero-visible' : ''}`}>
          <div className="hero-badge">{strings.heroBadge}</div>
          <h1 className="hero-title">
            {strings.heroTitle1} <span className="hero-highlight">{strings.heroHighlight}</span><br />
            {strings.heroTitle2}
          </h1>
          <p className="hero-subtitle">{strings.heroSubtitle}</p>
          <div className="hero-btns">
            <a href="/register" className="hero-btn-primary">{strings.heroGetStarted}</a>
            <a href="/login"    className="hero-btn-secondary">{strings.heroLoginDashboard}</a>
          </div>
          <div className="hero-trust">
            <span>{strings.heroTrust1}</span>
            <span>{strings.heroTrust2}</span>
            <span>{strings.heroTrust3}</span>
          </div>
        </div>

        {/* Dynamic Floating Price Cards */}
        {floatCards.map((card, i) => (
          <div key={i} className={`hero-float-card ${card.cssClass}`}>
            <span>{typeEmoji(card.type, card.name)}</span>
            <div>
              <div className="float-label">{card.name}</div>
              <div className="float-price">₹{Number(card.retailPrice).toLocaleString()}/unit</div>
            </div>
          </div>
        ))}
      </section>

      {/* ══ STATS ════════════════════════════════════════════ */}
      <section className="stats-section">
        <div className="stats-grid">
          {stats.map((s, i) => (
            <div key={i} className="stat-item">
              <div className="stat-number"><CountUp end={s.value} suffix={s.suffix} /></div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ FEATURES ═════════════════════════════════════════ */}
      <section className="features-section">
        <div className="section-header">
          <div className="section-badge">{strings.whyBadge}</div>
          <h2 className="section-title">{strings.whyTitle}</h2>
          <p className="section-sub">{strings.whySub}</p>
        </div>
        <div className="features-grid">
          {features.map((f, i) => (
            <div key={i} className="feature-card glow-hover" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="feature-icon-wrapper">
                <div className="feature-icon">{f.icon}</div>
              </div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ KNOWLEDGE CENTER ═══════════════════════════════════ */}
      <section className="knowledge-section" style={{ padding: '80px 20px', background: 'var(--bg-knowledge, #f8fafc)' }}>
        <div className="section-header">
          <div className="section-badge">{strings.knowledgeBadge || 'Insights'}</div>
          <h2 className="section-title">{strings.knowledgeTitle || 'Agricultural Knowledge Center'}</h2>
          <p className="section-sub">{strings.knowledgeSub || 'Latest practices and information for modern farming and sustainable growth.'}</p>
        </div>
        <div className="knowledge-grid">
          
          <div className="knowledge-card">
            <div className="knowledge-img-wrap">
              <img src="/assets/modern_farming_1775248687280.png" alt="Modern Farming" className="knowledge-img" />
              <div className="knowledge-tag">Technology</div>
            </div>
            <div className="knowledge-body">
              <h3 className="knowledge-title">Sustainable Agriculture & Tech</h3>
              <p className="knowledge-desc">Modern farming integrates advanced technologies to improve yield while maintaining soil health and conserving critical water resources.</p>
            </div>
          </div>

          <div className="knowledge-card">
            <div className="knowledge-img-wrap">
              <img src="/assets/soil_sprout_1775248670262.png" alt="Soil Health" className="knowledge-img" />
              <div className="knowledge-tag">Environment</div>
            </div>
            <div className="knowledge-body">
              <h3 className="knowledge-title">Soil Health & Nutrition</h3>
              <p className="knowledge-desc">Healthy soil is the foundation of the food system. Organic practices and crop rotation ensure long-term viability and nutrient-rich crops.</p>
            </div>
          </div>

          <div className="knowledge-card">
            <div className="knowledge-img-wrap">
              <img src="/assets/wheat_sunset_1775248656092.png" alt="Golden Harvest" className="knowledge-img" />
              <div className="knowledge-tag">Best Practices</div>
            </div>
            <div className="knowledge-body">
              <h3 className="knowledge-title">Maximizing Golden Harvests</h3>
              <p className="knowledge-desc">Timing the harvest perfectly guarantees the highest quality produce, ensuring better prices in the market and reducing agricultural waste.</p>
            </div>
          </div>

        </div>
      </section>

      {/* ══ HOW IT WORKS ═════════════════════════════════════ */}
      <section className="how-section">
        <div className="how-bg-video">
          <video autoPlay loop muted playsInline>
            <source src="https://videos.pexels.com/video-files/2818546/2818546-hd_1280_720_25fps.mp4" type="video/mp4" />
          </video>
          <div className="how-overlay" />
        </div>
        <div className="how-content">
          <div className="section-header" style={{ color: '#fff' }}>
            <div className="section-badge" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}>
              {strings.howBadge}
            </div>
            <h2 className="section-title" style={{ color: '#fff' }}>{strings.howTitle}</h2>
          </div>
          <div className="steps-wrapper">
            <div className="steps-timeline-line"></div>
            <div className="steps-grid">
              {steps.map((s, i) => (
                <div key={i} className="step-card glow-hover">
                  <div className="step-number">{s.step}</div>
                  <div className="step-icon-wrapper">
                    <div className="step-icon">{s.icon}</div>
                  </div>
                  <h3 className="step-title">{s.title}</h3>
                  <p className="step-desc">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ ROLES ════════════════════════════════════════════ */}
      <section className="roles-section">
        <div className="section-header">
          <div className="section-badge">{strings.rolesBadge}</div>
          <h2 className="section-title">{strings.rolesTitle}</h2>
        </div>
        <div className="roles-grid">
          <div className="role-card role-farmer glow-hover">
            <div className="role-img">
              <img src="https://images.pexels.com/photos/1382102/pexels-photo-1382102.jpeg?auto=compress&cs=tinysrgb&w=600" alt="Farmer" />
              <div className="role-img-overlay" />
            </div>
            <div className="role-body">
              <div className="role-icon">👨‍🌾</div>
              <h3>{strings.farmer}</h3>
              <p>{strings.farmerRoleDesc}</p>
              <ul className="role-perks">
                <li>{strings.farmerPerk1}</li>
                <li>{strings.farmerPerk2}</li>
                <li>{strings.farmerPerk3}</li>
              </ul>
              <a href="/register" className="role-btn">{strings.joinFarmer}</a>
            </div>
          </div>

          <div className="role-card role-retailer glow-hover">
            <div className="role-img">
              <img src="https://images.pexels.com/photos/3962285/pexels-photo-3962285.jpeg?auto=compress&cs=tinysrgb&w=600" alt="Retailer" />
              <div className="role-img-overlay" />
            </div>
            <div className="role-body">
              <div className="role-icon">🛒</div>
              <h3>{strings.retailer}</h3>
              <p>{strings.retailerRoleDesc}</p>
              <ul className="role-perks">
                <li>{strings.retailerPerk1}</li>
                <li>{strings.retailerPerk2}</li>
                <li>{strings.retailerPerk3}</li>
              </ul>
              <a href="/register" className="role-btn">{strings.joinRetailer}</a>
            </div>
          </div>

          <div className="role-card role-wholesale glow-hover">
            <div className="role-img">
              <img src="https://images.pexels.com/photos/1267338/pexels-photo-1267338.jpeg?auto=compress&cs=tinysrgb&w=600" alt="Wholesaler" />
              <div className="role-img-overlay" />
            </div>
            <div className="role-body">
              <div className="role-icon">📦</div>
              <h3>{strings.wholesaler}</h3>
              <p>{strings.wholesalerRoleDesc}</p>
              <ul className="role-perks">
                <li>{strings.wholesalerPerk1}</li>
                <li>{strings.wholesalerPerk2}</li>
                <li>{strings.wholesalerPerk3}</li>
              </ul>
              <a href="/register" className="role-btn">{strings.joinWholesaler}</a>
            </div>
          </div>
        </div>
      </section>

      {/* ══ TESTIMONIALS ═════════════════════════════════════ */}
      <section className="testimonials-section">
        <div className="section-header">
          <div className="section-badge">{strings.testimonialsBadge}</div>
          <h2 className="section-title">{strings.testimonialsTitle}</h2>
        </div>
        <div className="testimonials-grid">
          {testimonials.map((t, i) => (
            <div key={i} className="testimonial-card glow-hover">
              <div className="testimonial-stars">⭐⭐⭐⭐⭐</div>
              <p className="testimonial-text">"{t.text}"</p>
              <div className="testimonial-author">
                <div className="testimonial-avatar">{t.avatar}</div>
                <div>
                  <div className="testimonial-name">{t.name}</div>
                  <div className="testimonial-role">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ CTA ══════════════════════════════════════════════ */}
      <section className="cta-section">
        <div className="cta-bg">
          <video autoPlay loop muted playsInline>
            <source src="https://videos.pexels.com/video-files/3370063/3370063-hd_1280_720_25fps.mp4" type="video/mp4" />
          </video>
          <div className="cta-overlay" />
        </div>
        <div className="cta-content">
          <h2 className="cta-title">{strings.ctaTitle}</h2>
          <p className="cta-sub">{strings.ctaSub}</p>
          <div className="cta-btns">
            <a href="/register" className="hero-btn-primary"   style={{ fontSize: 16, padding: '14px 32px' }}>{strings.ctaCreate}</a>
            <a href="/login"    className="hero-btn-secondary" style={{ fontSize: 16, padding: '14px 32px' }}>{strings.ctaLogin}</a>
          </div>
        </div>
      </section>

      {/* ══ NEWSLETTER ═══════════════════════════════════════ */}
      <section className="newsletter-section">
        <div className="newsletter-content">
          <div className="newsletter-icon">💌</div>
          <h2 className="newsletter-title">Stay Updated with Agro Market</h2>
          <p className="newsletter-sub">Get the latest market trends, tips, and price updates delivered directly to your inbox.</p>
          <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
            <input type="email" placeholder="Enter your email address" className="newsletter-input" required />
            <button type="submit" className="hero-btn-primary newsletter-btn">Subscribe Now</button>
          </form>
        </div>
      </section>

      {/* ══ PREMIUM FOOTER ═══════════════════════════════════ */}
      <footer className="premium-footer">
        <div className="footer-top">
          <div className="footer-col brand-col">
            <div className="footer-brand">
              <span className="footer-logo-icon">🌾</span>
              Agro Market
            </div>
            <p className="footer-desc">{strings.footerTagline || 'Empowering farmers with direct market access and real-time prices.'}</p>
            <div className="social-links">
              <a href="#/" aria-label="Facebook">🔵</a>
              <a href="#/" aria-label="Twitter">🐦</a>
              <a href="#/" aria-label="Instagram">📸</a>
              <a href="#/" aria-label="LinkedIn">💼</a>
            </div>
          </div>
          <div className="footer-col">
            <h4 className="footer-heading">Platform</h4>
            <a href="/register">Join as Farmer</a>
            <a href="/register">Join as Retailer</a>
            <a href="/register">Join as Wholesaler</a>
            <a href="/login">Login to Dashboard</a>
          </div>
          <div className="footer-col">
            <h4 className="footer-heading">Resources</h4>
            <a href="#/">Knowledge Center</a>
            <a href="#/">Market Prices</a>
            <a href="#/">Help Center</a>
            <a href="#/">Contact Us</a>
          </div>
          <div className="footer-col">
            <h4 className="footer-heading">Legal</h4>
            <a href="#/">Privacy Policy</a>
            <a href="#/">Terms of Service</a>
            <a href="#/">Cookie Policy</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p className="footer-copy">{strings.footerCopy || '© 2026 Agro Market. All rights reserved.'}</p>
          <div className="footer-badges">
             <span className="secure-badge">🔒 Secure Platform</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

/* ══ APP ══════════════════════════════════════════════════ */
const App = () => {
  const [user,     setUser]     = useState(() => { const s = localStorage.getItem('agro_user'); return s ? JSON.parse(s) : null; });
  const [token,    setToken]    = useState(() => localStorage.getItem('agro_token'));
  const [language, setLanguage] = useState('en');
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('agro_dark_mode') === 'true');

  useEffect(() => {
    document.documentElement.className = darkMode ? 'dark' : 'light';
    localStorage.setItem('agro_dark_mode', darkMode.toString());
  }, [darkMode]);

  const tValue = useMemo(() => ({
    language,
    setLanguage,
    strings: translations[language] || translations.en,
  }), [language]);

  const handleAuth = (data) => {
    setUser(data.user); setToken(data.token);
    localStorage.setItem('agro_user', JSON.stringify(data.user));
    localStorage.setItem('agro_token', data.token);
  };

  const handleLogout = () => {
    setUser(null); setToken(null);
    localStorage.removeItem('agro_user');
    localStorage.removeItem('agro_token');
  };

  const ProtectedRoute = ({ children, roles }) => {
    if (!user) return <Navigate to="/login" />;
    if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
    return children;
  };

  return (
    <TranslationContext.Provider value={tValue}>
      <Router>
        <div className={`min-h-screen ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
          <Navbar user={user} onLogout={handleLogout} darkMode={darkMode} setDarkMode={setDarkMode} />
          <Routes>
            <Route path="/"           element={<HomePage />} />
            <Route path="/login"      element={<Login    onAuth={handleAuth} />} />
            <Route path="/register"   element={<Register onAuth={handleAuth} />} />
            <Route path="/farmer"     element={<ProtectedRoute roles={['farmer']}><FarmerDashboard     token={token} user={user} /></ProtectedRoute>} />
            <Route path="/retailer"   element={<ProtectedRoute roles={['retailer']}><RetailerDashboard   token={token} user={user} /></ProtectedRoute>} />
            <Route path="/wholesaler" element={<ProtectedRoute roles={['wholesaler']}><WholesalerDashboard token={token} user={user} /></ProtectedRoute>} />
            <Route path="/admin"      element={<ProtectedRoute roles={['admin']}><AdminDashboard       token={token} user={user} /></ProtectedRoute>} />
            <Route path="/payment-success" element={<ProtectedRoute roles={['retailer', 'wholesaler']}><PaymentSuccess token={token} user={user} /></ProtectedRoute>} />
            <Route path="/mandi-rates" element={<MandiRates />} />
          </Routes>
        </div>
      </Router>
    </TranslationContext.Provider>
  );
};

export default App;