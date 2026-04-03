import React, { useContext, useEffect, useMemo, useState, useCallback } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { TranslationContext } from '../utils/translations';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const api = axios.create({ baseURL: process.env.REACT_APP_API_URL });

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'rgba(15,23,42,0.95)', border:'1px solid rgba(148,163,184,0.25)', borderRadius:10, padding:'10px 14px', fontSize:13 }}>
      {label && <p style={{ margin:'0 0 6px', opacity:0.7, fontWeight:600 }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ margin:'2px 0', color:p.color }}>{p.name}: <b>₹{Number(p.value).toLocaleString()}</b></p>
      ))}
    </div>
  );
};

const COLORS = ['#4ade80','#60a5fa','#f59e0b','#f87171','#a78bfa','#34d399'];

function buildMonthlyData(orders) {
  const map = {};
  orders.forEach(o => {
    if (o.status !== 'Delivered') return;
    const d = new Date(o.createdAt || o.updatedAt || Date.now());
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    const label = d.toLocaleString('default', { month:'short', year:'2-digit' });
    if (!map[key]) map[key] = { month:label, Inventory:0, Seeds:0, Total:0 };
    const type = o.product?.type === 'seeds' ? 'Seeds' : 'Inventory';
    map[key][type] += o.totalPrice;
    map[key].Total  += o.totalPrice;
  });
  return Object.keys(map).sort().map(k => map[k]);
}

const FarmerDashboard = ({ token, user }) => {
  const { strings } = useContext(TranslationContext);
  const [active,   setActive]   = useState('inventory');
  const [products, setProducts] = useState([]);
  const [orders,   setOrders]   = useState([]);
  const [msg,      setMsg]      = useState('');

  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const load = useCallback(async () => {
  const [p, o] = await Promise.all([
    api.get('/products/farmer/me', { headers }),
    api.get(`/orders/farmer/${user.id}`, { headers }),
  ]);
  setProducts(p.data);
  setOrders(o.data);
}, [headers, user.id]);

  useEffect(() => { load().catch(() => {}); }, [load]);

  const createOrUpdateProduct = async (form, id) => {
    setMsg('');
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') fd.append(k, v); });
    try {
      if (id) await api.put(`/products/${id}`, fd, { headers });
      else    await api.post('/products', fd, { headers });
      setMsg(id ? strings.productUpdated : strings.productAdded);
      await load();
    } catch (e) { setMsg(e.response?.data?.message || strings.failed); }
  };

  const del = async (id) => { await api.delete(`/products/${id}`, { headers }); await load(); };

  const setOrderStatus = async (id, status) => {
    await api.put(`/orders/${id}/status`, { status }, { headers });
    await load();
  };

  const items = [
    { id: 'inventory', label: `📦 ${strings.inventory}` },
    { id: 'seeds',     label: `🌱 ${strings.seeds}`     },
    { id: 'orders',    label: `🛒 ${strings.orders}`    },
    { id: 'revenue',   label: `💰 ${strings.revenue}`   },
    { id: 'add',       label: `➕ ${strings.addEdit}`   },
  ];

  const inventory = products.filter(p => p.type === 'inventory');
  const seeds     = products.filter(p => p.type === 'seeds');

  const revenue = useMemo(() => {
    const delivered    = orders.filter(o => o.status === 'Delivered');
    const totalRevenue = delivered.reduce((s, o) => s + o.totalPrice, 0);
    const invRevenue   = delivered.filter(o => o.product?.type === 'inventory').reduce((s, o) => s + o.totalPrice, 0);
    const seedRevenue  = delivered.filter(o => o.product?.type === 'seeds').reduce((s, o) => s + o.totalPrice, 0);
    return {
      totalOrders: orders.length,
      pending:     orders.filter(o => o.status === 'Pending').length,
      delivered:   delivered.length,
      totalRevenue, invRevenue, seedRevenue,
      monthlyData: buildMonthlyData(orders),
      pieData: [
        { name: strings.inventory, value: invRevenue  },
        { name: strings.seeds,     value: seedRevenue },
      ].filter(d => d.value > 0),
    };
  }, [orders, strings]);

  return (
    <div className="grid">
      <Sidebar items={items} active={active} setActive={setActive} />
      <div>
        <h2 style={{ marginTop:0 }}>{strings.farmerDashboard}</h2>
        {msg ? <div className="stat" style={{ marginBottom:12 }}>{msg}</div> : null}

        {active === 'inventory' && <ProductList title={strings.inventory} products={inventory} onDelete={del} strings={strings} />}
        {active === 'seeds'     && <ProductList title={strings.seeds}     products={seeds}     onDelete={del} strings={strings} />}
        {active === 'orders'    && (
          <OrdersTable orders={orders} strings={strings}
            onAccept={id => setOrderStatus(id, 'Accepted')}
            onReject={id => setOrderStatus(id, 'Rejected')}
            onDeliver={id => setOrderStatus(id, 'Delivered')}
          />
        )}
        {active === 'revenue' && <RevenueSection revenue={revenue} strings={strings} />}
        {active === 'add'     && <ProductForm onSubmit={createOrUpdateProduct} products={products} strings={strings} />}
      </div>
    </div>
  );
};

const RevenueSection = ({ revenue, strings }) => {
  const hasMonthly = revenue.monthlyData.length > 0;
  const hasPie     = revenue.pieData.length > 0;
  return (
    <div>
      <h3 style={{ marginTop:0 }}>💰 {strings.revenue}</h3>
      <div className="stat-row" style={{ marginBottom:24 }}>
        {[
          [strings.totalOrders,      revenue.totalOrders,               '#60a5fa'],
          ['Pending',                revenue.pending,                   '#f59e0b'],
          [strings.delivered,        revenue.delivered,                 '#4ade80'],
          [strings.totalRevenue,     `₹${revenue.totalRevenue.toLocaleString()}`, '#a78bfa'],
          [`${strings.inventory} Rev`, `₹${revenue.invRevenue.toLocaleString()}`, '#34d399'],
          [`${strings.seeds} Rev`,     `₹${revenue.seedRevenue.toLocaleString()}`, '#f87171'],
        ].map(([label, val, color]) => (
          <div key={label} className="stat">
            <div className="muted" style={{ fontSize:12, marginBottom:4 }}>{label}</div>
            <b style={{ fontSize:22, color }}>{val}</b>
          </div>
        ))}
      </div>
      {!hasMonthly ? (
        <div className="chart-empty"><span>📊</span><p>{strings.noOrderData}</p></div>
      ) : (
        <div className="charts-grid">
          <div className="chart-card">
            <h4 className="chart-title">📊 {strings.revenue}</h4>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={revenue.monthlyData} margin={{ top:10, right:10, left:0, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                <XAxis dataKey="month" tick={{ fontSize:12, fill:'#94a3b8' }} />
                <YAxis tick={{ fontSize:12, fill:'#94a3b8' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize:13 }} />
                <Bar dataKey="Inventory" fill="#4ade80" radius={[4,4,0,0]} />
                <Bar dataKey="Seeds"     fill="#60a5fa" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-card">
            <h4 className="chart-title">📈 {strings.revenue} Trend</h4>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={revenue.monthlyData} margin={{ top:10, right:10, left:0, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                <XAxis dataKey="month" tick={{ fontSize:12, fill:'#94a3b8' }} />
                <YAxis tick={{ fontSize:12, fill:'#94a3b8' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="Total" stroke="#a78bfa" strokeWidth={3} dot={{ fill:'#a78bfa', r:5 }} activeDot={{ r:7 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {hasPie && (
            <div className="chart-card chart-card-narrow">
              <h4 className="chart-title">🥧 {strings.revenue} Split</h4>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={revenue.pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4}
                    dataKey="value" label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                    {revenue.pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={val => [`₹${Number(val).toLocaleString()}`, '']} />
                  <Legend wrapperStyle={{ fontSize:13 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ProductList = ({ title, products, onDelete, strings }) => (
  <div>
    <h3>{title}</h3>
    <div className="product-grid">
      {products.map(p => (
        <div key={p._id} className="product-card">
          <div className="product-image">
            {p.image ? <img src={`${process.env.REACT_APP_API_URL}${p.image}`} alt={p.name} /> : <div className="image-placeholder">{strings.noImage}</div>}
          </div>
          <div className="product-body">
            <div className="product-title">
              <h3 style={{ margin:0 }}>{p.name}</h3>
              {p.quantity < 5 ? <span className="low-stock">{strings.lowStock}</span> : null}
            </div>
            <p className="muted">{p.category}</p>
            <div className="price-row">
              <span>{strings.retail}: <b>₹{p.retailPrice}</b></span>
              <span>{strings.wholesale}: <b>₹{p.wholesalePrice}</b></span>
            </div>
            <p>{strings.qty}: <b>{p.quantity}</b></p>
            <div style={{ marginTop:8 }}>
              <button className="btn-secondary" onClick={() => onDelete(p._id)}>{strings.delete}</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const OrdersTable = ({ orders, onAccept, onReject, onDeliver, strings }) => (
  <div>
    <h3>{strings.orders}</h3>
    <div className="table-wrapper">
      <table className="table">
        <thead>
          <tr>
            <th>{strings.buyer}</th><th>{strings.buyerRole}</th><th>{strings.product}</th>
            <th>{strings.qty}</th><th>{strings.total}</th><th>{strings.status}</th><th>{strings.action}</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(o => (
            <tr key={o._id}>
              <td>{o.buyer?.name || '—'}</td>
              <td>{o.buyerRole}</td>
              <td>{o.product?.name || '—'}</td>
              <td>{o.quantity}</td>
              <td>₹{o.totalPrice}</td>
              <td>{o.status}</td>
              <td>
                {o.status === 'Pending' ? (
                  <span style={{ display:'flex', gap:6 }}>
                    <button className="btn-primary"   onClick={() => onAccept(o._id)}>{strings.accept}</button>
                    <button className="btn-secondary" onClick={() => onReject(o._id)}>{strings.reject}</button>
                  </span>
                ) : o.status === 'Accepted' ? (
                  o.isPaid
                    ? <button className="btn-primary" onClick={() => onDeliver(o._id)}>{strings.markDelivered}</button>
                    : <span className="muted">{strings.waitingPayment}</span>
                ) : <span className="muted">—</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const ProductForm = ({ onSubmit, products, strings }) => {
  const [selectedId, setSelectedId] = useState('');
  const [form, setForm] = useState({
    name:'', category:'', type:'inventory', quantity:0, retailPrice:0, wholesalePrice:0, notes:'', image:null,
  });

  useEffect(() => {
    if (!selectedId) return;
    const p = products.find(x => x._id === selectedId);
    if (!p) return;
    setForm({ name:p.name, category:p.category, type:p.type, quantity:p.quantity,
      retailPrice:p.retailPrice, wholesalePrice:p.wholesalePrice, notes:p.notes||'', image:null });
  }, [selectedId, products]);

  const set    = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const setNum = k => e => setForm(f => ({ ...f, [k]: Number(e.target.value) }));

  return (
    <div>
      <h3>{strings.addEditProduct}</h3>
      <div className="field">
        <label>{strings.editExisting}</label>
        <select value={selectedId} onChange={e => setSelectedId(e.target.value)}>
          <option value="">{strings.newProduct}</option>
          {products.map(p => <option key={p._id} value={p._id}>{p.name} ({p.type})</option>)}
        </select>
      </div>
      <div className="field"><label>{strings.name}</label><input value={form.name} onChange={set('name')} /></div>
      <div className="field"><label>{strings.category}</label><input value={form.category} onChange={set('category')} /></div>
      <div className="field">
        <label>{strings.type}</label>
        <select value={form.type} onChange={set('type')}>
          <option value="inventory">{strings.inventory}</option>
          <option value="seeds">{strings.seeds}</option>
        </select>
      </div>
      <div className="field"><label>{strings.quantity}</label><input type="number" value={form.quantity} onChange={setNum('quantity')} /></div>
      <div className="field"><label>{strings.retailPrice}</label><input type="number" value={form.retailPrice} onChange={setNum('retailPrice')} /></div>
      <div className="field"><label>{strings.wholesalePrice}</label><input type="number" value={form.wholesalePrice} onChange={setNum('wholesalePrice')} /></div>
      <div className="field"><label>{strings.notes}</label><textarea value={form.notes} onChange={set('notes')} /></div>
      <div className="field">
        <label>{strings.image}</label>
        <input type="file" onChange={e => setForm(f => ({ ...f, image: e.target.files?.[0] }))} />
      </div>
      <button className="btn-primary" onClick={() => onSubmit(form, selectedId || null)}>
        {selectedId ? strings.update : strings.add}
      </button>
    </div>
  );
};

export default FarmerDashboard;