import React, { useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { TranslationContext } from '../utils/translations';
import socket from '../utils/socket';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area,
} from 'recharts';

const api = axios.create({ baseURL: process.env.REACT_APP_API_URL });
const COLORS = ['#4ade80','#60a5fa','#f59e0b','#f87171','#a78bfa','#34d399'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'rgba(15,23,42,0.95)', border:'1px solid rgba(148,163,184,0.25)', borderRadius:10, padding:'10px 14px', fontSize:13 }}>
      {label && <p style={{ margin:'0 0 6px', opacity:0.7, fontWeight:600 }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ margin:'2px 0', color:p.color }}>
          {p.name}: <b>{p.name.includes('Revenue') || p.name === 'Amount' ? `₹${Number(p.value).toLocaleString()}` : p.value}</b>
        </p>
      ))}
    </div>
  );
};

function buildOrderMonthly(orders) {
  const map = {};
  orders.forEach(o => {
    const d = new Date(o.createdAt || Date.now());
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    const label = d.toLocaleString('default', { month:'short', year:'2-digit' });
    if (!map[key]) map[key] = { month:label, Orders:0, Revenue:0 };
    map[key].Orders++;
    if (o.status === 'Delivered') map[key].Revenue += o.totalPrice;
  });
  return Object.keys(map).sort().map(k => map[k]);
}

const AdminDashboard = ({ token }) => {
  const { strings } = useContext(TranslationContext);
  const [stats,    setStats]    = useState(null);
  const [products, setProducts] = useState([]);
  const [orders,   setOrders]   = useState([]);
  const [users,    setUsers]    = useState([]);
  const [msg,      setMsg]      = useState('');
  const [tab,      setTab]      = useState('overview');

  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const load = async () => {
    try {
      const [s, p] = await Promise.all([
        api.get('/admin/stats', { headers }),
        api.get('/products'),
      ]);
      setStats(s.data);
      setProducts(p.data);
      try {
        const [o, u] = await Promise.all([
          api.get('/orders', { headers }),
          api.get('/admin/users', { headers }),
        ]);
        setOrders(o.data || []);
        setUsers(u.data  || []);
      } catch { /* optional */ }
    } catch { /* stats failed */ }
  };

  useEffect(() => {
    load().catch(() => {});

    // Admin doesn't join a personal room — listens to broadcast events only

    // Live stats update (orders, revenue, users, products count)
    const onStatsUpdate = (update) => {
      setStats(prev => prev ? { ...prev, ...update } : update);
    };

    // New order placed anywhere on the platform
    const onNewOrder = (order) => {
      setOrders(prev => {
        if (prev.find(o => o._id === order._id)) return prev;
        return [order, ...prev];
      });
    };

    // Order status changed
    const onOrderStatusChanged = (updatedOrder) => {
      setOrders(prev => prev.map(o => o._id === updatedOrder._id ? updatedOrder : o));
    };

    // Product added
    const onProductAdded = (product) => {
      setProducts(prev => {
        if (prev.find(p => p._id === product._id)) return prev;
        return [product, ...prev];
      });
    };

    // Product updated (stock, price, etc.)
    const onProductUpdated = (updatedProduct) => {
      setProducts(prev => prev.map(p =>
        p._id === updatedProduct._id ? { ...p, ...updatedProduct } : p
      ));
    };

    // Product deleted
    const onProductDeleted = ({ _id }) => {
      setProducts(prev => prev.filter(p => p._id !== _id));
    };

    // User deleted
    const onUserDeleted = ({ _id }) => {
      setUsers(prev => prev.filter(u => u._id !== _id));
    };

    socket.on('stats_update', onStatsUpdate);
    socket.on('new_order', onNewOrder);
    socket.on('order_status_changed', onOrderStatusChanged);
    socket.on('product_added', onProductAdded);
    socket.on('product_updated', onProductUpdated);
    socket.on('product_deleted', onProductDeleted);
    socket.on('user_deleted', onUserDeleted);

    return () => {
      socket.off('stats_update', onStatsUpdate);
      socket.off('new_order', onNewOrder);
      socket.off('order_status_changed', onOrderStatusChanged);
      socket.off('product_added', onProductAdded);
      socket.off('product_updated', onProductUpdated);
      socket.off('product_deleted', onProductDeleted);
      socket.off('user_deleted', onUserDeleted);
    };
  }, []);

  const deleteProduct = async (id) => {
    setMsg('');
    try {
      await api.delete(`/products/${id}`, { headers });
      setMsg(strings.productDeleted);
      // Socket 'product_deleted' event will remove it from state
    } catch (e) { setMsg(e.response?.data?.message || strings.failed); }
  };

  const chartData = useMemo(() => {
    const monthly = buildOrderMonthly(orders);
    const typeMap = {};
    products.forEach(p => { typeMap[p.type] = (typeMap[p.type] || 0) + 1; });
    const productsByType = Object.entries(typeMap).map(([name, value]) => ({ name, value }));
    const roleMap = {};
    users.forEach(u => { roleMap[u.role] = (roleMap[u.role] || 0) + 1; });
    const usersByRole = Object.entries(roleMap).map(([name, value]) => ({ name, value }));
    const prodRev = {};
    orders.filter(o => o.status === 'Delivered').forEach(o => {
      const name = o.product?.name || 'Unknown';
      prodRev[name] = (prodRev[name] || 0) + o.totalPrice;
    });
    const topProducts = Object.entries(prodRev).sort((a,b) => b[1]-a[1]).slice(0,6).map(([name, Revenue]) => ({ name, Revenue }));
    return { monthly, productsByType, usersByRole, topProducts };
  }, [orders, products, users]);

  const adminTabs = [
    { id: 'overview', label: `📊 ${strings.overview}`  },
    { id: 'products', label: `📦 ${strings.products}`  },
    { id: 'charts',   label: `📈 ${strings.analytics}` },
  ];

  return (
    <div style={{ padding:16 }}>
      <h2 style={{ marginTop:0 }}>{strings.adminDashboard}</h2>
      {msg ? <div className="stat" style={{ marginBottom:12 }}>{msg}</div> : null}

      <div className="admin-tabs">
        {adminTabs.map(t => (
          <button key={t.id} className={`admin-tab-btn ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {tab === 'overview' && (
        <>
          {stats ? (
            <div className="stat-row" style={{ marginBottom:24 }}>
              {[
                [strings.totalUsers,    stats.totalUsers,    '#60a5fa'],
                [strings.totalProducts, stats.totalProducts, '#4ade80'],
                [strings.totalOrders,   stats.totalOrders,   '#f59e0b'],
                [strings.totalRevenue,  `₹${Number(stats.totalRevenue||0).toLocaleString()}`, '#a78bfa'],
              ].map(([label, val, color]) => (
                <div key={label} className="stat">
                  <div className="muted" style={{ fontSize:12, marginBottom:4 }}>{label}</div>
                  <b style={{ fontSize:22, color }}>{val}</b>
                </div>
              ))}
            </div>
          ) : <div className="muted">{strings.loadingStats}</div>}

          {chartData.monthly.length > 0 && (
            <div className="chart-card" style={{ marginBottom:24 }}>
              <h4 className="chart-title">📈 {strings.totalOrders} & {strings.totalRevenue}</h4>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={chartData.monthly} margin={{ top:10, right:10, left:0, bottom:0 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#a78bfa" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#a78bfa" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="ordGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#60a5fa" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#60a5fa" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" />
                  <XAxis dataKey="month" tick={{ fontSize:12, fill:'#94a3b8' }} />
                  <YAxis yAxisId="left"  tick={{ fontSize:12, fill:'#94a3b8' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize:12, fill:'#94a3b8' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize:13 }} />
                  <Area yAxisId="left"  type="monotone" dataKey="Revenue" stroke="#a78bfa" fill="url(#revGrad)" strokeWidth={2.5} />
                  <Area yAxisId="right" type="monotone" dataKey="Orders"  stroke="#60a5fa" fill="url(#ordGrad)" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          <h3>{strings.allProductsTitle}</h3>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr><th>{strings.namCol}</th><th>{strings.farmerColAdmin}</th><th>{strings.qty}</th><th>{strings.retailPrice}</th><th>{strings.wholesalePrice}</th><th>{strings.action}</th></tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p._id}>
                    <td>{p.name}</td><td>{p.farmer?.name||'—'}</td><td>{p.quantity}</td>
                    <td>₹{p.retailPrice}</td><td>₹{p.wholesalePrice}</td>
                    <td><button className="btn-secondary" onClick={() => deleteProduct(p._id)}>{strings.delete}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* PRODUCTS */}
      {tab === 'products' && (
        <>
          <div className="charts-grid" style={{ marginBottom:24 }}>
            {chartData.productsByType.length > 0 && (
              <div className="chart-card chart-card-narrow">
                <h4 className="chart-title">🥧 {strings.products}</h4>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={chartData.productsByType} cx="50%" cy="50%" outerRadius={90} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {chartData.productsByType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip /><Legend wrapperStyle={{ fontSize:13 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            {chartData.topProducts.length > 0 && (
              <div className="chart-card">
                <h4 className="chart-title">🏆 Top {strings.products}</h4>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart layout="vertical" data={chartData.topProducts} margin={{ top:10, right:20, left:10, bottom:0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize:12, fill:'#94a3b8' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize:12, fill:'#94a3b8' }} width={80} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="Revenue" radius={[0,4,4,0]}>
                      {chartData.topProducts.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
          <h3>{strings.allProductsTitle}</h3>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr><th>{strings.namCol}</th><th>{strings.farmerColAdmin}</th><th>{strings.qty}</th><th>{strings.retailPrice}</th><th>{strings.wholesalePrice}</th><th>{strings.action}</th></tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p._id}>
                    <td>{p.name}</td><td>{p.farmer?.name||'—'}</td><td>{p.quantity}</td>
                    <td>₹{p.retailPrice}</td><td>₹{p.wholesalePrice}</td>
                    <td><button className="btn-secondary" onClick={() => deleteProduct(p._id)}>{strings.delete}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ANALYTICS */}
      {tab === 'charts' && (
        <div>
          {chartData.monthly.length === 0 ? (
            <div className="chart-empty"><span>📊</span><p>{strings.noOrderData}</p></div>
          ) : (
            <div className="charts-grid">
              <div className="chart-card">
                <h4 className="chart-title">📈 {strings.totalRevenue}</h4>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={chartData.monthly} margin={{ top:10, right:10, left:0, bottom:0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" />
                    <XAxis dataKey="month" tick={{ fontSize:12, fill:'#94a3b8' }} />
                    <YAxis tick={{ fontSize:12, fill:'#94a3b8' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="Revenue" stroke="#a78bfa" strokeWidth={3} dot={{ r:5, fill:'#a78bfa' }} activeDot={{ r:7 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="chart-card">
                <h4 className="chart-title">📊 {strings.totalOrders}</h4>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={chartData.monthly} margin={{ top:10, right:10, left:0, bottom:0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" />
                    <XAxis dataKey="month" tick={{ fontSize:12, fill:'#94a3b8' }} />
                    <YAxis tick={{ fontSize:12, fill:'#94a3b8' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="Orders" fill="#60a5fa" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {chartData.usersByRole.length > 0 && (
                <div className="chart-card chart-card-narrow">
                  <h4 className="chart-title">👥 {strings.totalUsers}</h4>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={chartData.usersByRole} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={4}
                        dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                        {chartData.usersByRole.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip /><Legend wrapperStyle={{ fontSize:13 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;