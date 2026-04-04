import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { TranslationContext } from '../utils/translations';
import '../premium.css';

const api = axios.create({ baseURL: process.env.REACT_APP_API_URL });

const MandiRates = () => {
  const { strings } = useContext(TranslationContext);
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchRates = async () => {
    try {
      const res = await api.get('/mandi-rates');
      if (res.data.success) {
        setRates(res.data.data);
      }
    } catch (e) {
      console.error('Failed to load mandi rates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
    const interval = setInterval(fetchRates, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, []);

  const filteredRates = rates.filter(r => 
    r.crop.toLowerCase().includes(search.toLowerCase()) || 
    r.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="mandi-page fade-in">
      <div className="mandi-header">
        <div className="mandi-header-content">
          <span className="badge-text" style={{color: '#059669', fontSize: 12, fontWeight: 700, letterSpacing: 1.2}}>MARKET INTELLIGENCE</span>
          <h1 className="premium-title">Real-time Mandi Rates & <br/> Agricultural Price Indices.</h1>
          <p className="premium-subtitle">Access accurate, daily price points from over 1,500 regulated markets across the nation to make data-driven harvesting decisions.</p>
        </div>
      </div>

      <div className="mandi-toolbar shadow-card">
        <div className="search-wrapper">
          <span className="search-icon">🔍</span>
          <input 
            type="text" 
            placeholder="Search by crop name or mandi location..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-wrapper">
          <select>
            <option>All Categories</option>
            <option>Cereals</option>
            <option>Vegetables</option>
            <option>Oilseeds</option>
          </select>
        </div>
        <button className="btn-primary" onClick={fetchRates}>↻ Update Results</button>
      </div>

      <div className="mandi-grid">
        <div className="mandi-list">
          <div className="mandi-list-header">
            <span>CROP DETAILS</span>
            <span>MANDI LOCATION</span>
            <span>ARRIVAL QTY</span>
            <span>MIN / MAX PRICE</span>
            <span>MODAL PRICE</span>
            <span>TREND</span>
          </div>
          {loading ? (
             <div style={{padding: 40, textAlign: 'center'}}>Loading live data...</div>
          ) : (
            filteredRates.map((r, i) => (
              <div className="mandi-row shadow-card hover-lift" key={r.id || i} style={{animationDelay: `${i*0.05}s`}}>
                <div className="col-crop">
                  <div className="crop-icon-box">{r.category === 'Vegetables' ? '🍅' : r.category === 'Cereals' ? '🌾' : '🫘'}</div>
                  <div>
                    <strong>{r.crop}</strong>
                    <div style={{fontSize: 12, color: '#64748b'}}>{r.category}</div>
                  </div>
                </div>
                <div className="col-loc"><strong>{r.location.split(',')[0]}</strong><br/><span style={{fontSize: 12, color: '#64748b'}}>{r.location.split(',')[1]}</span></div>
                <div className="col-qty"><strong>{r.quantity?.toLocaleString() || 1200}</strong> <span style={{fontSize: 10, color: '#64748b'}}>MT</span></div>
                <div className="col-minmax" style={{color: '#64748b', fontSize: 13}}>₹{r.minPrice.toLocaleString()} - ₹{r.maxPrice.toLocaleString()}</div>
                <div className="col-modal"><strong style={{fontSize: 18}}>₹{r.modalPrice.toLocaleString()}</strong></div>
                <div className="col-trend">
                  {r.trend === 'up' ? (
                     <div className="trend-bar up"><span className="trend-bars">|||</span></div>
                  ) : (
                     <div className="trend-bar down"><span className="trend-bars">|||</span></div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mandi-sidebar">
          <div className="mandi-insights shadow-card dark-green-card">
            <span style={{fontSize: 24, display: 'block', marginBottom: 15}}>💡</span>
            <h3>Market Insights</h3>
            
            <div className="insight-item">
              <h4>CEREALS UPDATE</h4>
              <p>Wheat arrivals are peaking in Indore. Experts predict a 5% price stabilization over the next 10 days due to surplus stock.</p>
            </div>
            
            <div className="insight-item">
              <h4>WEATHER ALERT</h4>
              <p>Unseasonal rain in Maharashtra might affect onion curing processes, potentially driving short-term price spikes in Lasalgaon.</p>
            </div>

            <div className="insight-item">
              <h4>GLOBAL TRADE</h4>
              <p>Oilseed demand in European markets remains high. Expect mustard seed to maintain its premium modal price this week.</p>
            </div>

            <button className="btn-secondary" style={{width: '100%', marginTop: 20, backgroundColor: '#86efac', border: 'none', color: '#064e3b'}}>Get Full Report</button>
          </div>

          <div className="mandi-hotspots shadow-card" style={{marginTop: 20}}>
            <h4 style={{display: 'flex', alignItems: 'center', gap: 8, marginBottom: 15}}>🗺️ Regional Hotspots</h4>
            <div className="hotspot-row">
              <span>North Region</span>
              <span className="badge-up">+2.4%</span>
            </div>
            <div className="hotspot-row">
              <span>South Region</span>
              <span className="badge-down">-1.2%</span>
            </div>
            <div className="hotspot-row">
              <span>Western Coast</span>
              <span className="badge-stable">Stable</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MandiRates;
