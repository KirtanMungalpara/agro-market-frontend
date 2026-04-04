import React, { useContext, useEffect, useMemo, useState, useCallback } from 'react';
import axios from 'axios';
import ProductCard from '../components/ProductCard';
import Sidebar from '../components/Sidebar';
import ReceiptModal from '../components/ReceiptModal';
import { TranslationContext } from '../utils/translations';

const api = axios.create({ baseURL: process.env.REACT_APP_API_URL });

const RetailerDashboard = ({ token, user }) => {
  const { strings } = useContext(TranslationContext);
  const [products,        setProducts]        = useState([]);
  const [orders,          setOrders]          = useState([]);
  const [payments,        setPayments]        = useState([]);
  const [msg,             setMsg]             = useState('');
  const [active,          setActive]          = useState('products');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [payLoading,      setPayLoading]      = useState(false);

  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const load = useCallback(async () => {
    const [p, o, pay] = await Promise.all([
      api.get('/products'),
      api.get(`/orders/buyer/${user.id}`, { headers }),
      api.get(`/orders/payments/buyer/${user.id}`, { headers }),
    ]);
    setProducts(p.data);
    setOrders(o.data);
    setPayments(pay.data);  
  }, [headers, user?.id]);

  useEffect(() => { load().catch(() => {}); }, [load]);

  const placeOrder = async ({ productId, quantity, pricePerUnit }) => {
    setMsg('');
    try {
      await api.post('/orders', { productId, quantity, pricePerUnit }, { headers });
      setMsg(strings.orderPlaced);
      await load();
    } catch (e) { setMsg(e.response?.data?.message || strings.failed); }
  };

  const handlePay = async (orderId) => {
    setPayLoading(true);
    setMsg('');
    try {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      document.body.appendChild(script);

      script.onload = async () => {
        const response = await api.post(`/orders/${orderId}/create-razorpay-order`, {}, { headers });
        const orderData = response.data;
        
        const options = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency,
          name: "Agro Market",
          description: "Order Payment",
          order_id: orderData.id,
          handler: function (res) {
            window.location.href = `/payment-success?razorpay_payment_id=${res.razorpay_payment_id}&razorpay_order_id=${res.razorpay_order_id}&razorpay_signature=${res.razorpay_signature}&order_id=${orderId}`;
          },
          prefill: {
            name: user.name || "Customer",
          },
          theme: {
            color: "#059669",
          },
        };
        
        const paymentObject = new window.Razorpay(options);
        paymentObject.on('payment.failed', function (resp) {
            setMsg(strings.paymentFailed || 'Payment Failed');
        });
        paymentObject.open();
        setPayLoading(false);
      };

      script.onerror = () => {
        setMsg("Razorpay SDK failed to load");
        setPayLoading(false);
      };
    } catch (e) {
      setMsg(e.response?.data?.message || strings.paymentFailed);
      setPayLoading(false);
    } 
  };

  const items = [
    { id: 'products', label: strings.allProducts    },
    { id: 'orders',   label: strings.orderHistory   },
    { id: 'payments', label: strings.paymentHistory },
  ];

  return (
    <div className="grid">
      <Sidebar items={items} active={active} setActive={setActive} />
      <div>
        <h2 style={{ marginTop: 0 }}>{strings.retailerDashboard}</h2>
        {msg ? <div className="stat">{msg}</div> : null}

        <ReceiptModal open={!!selectedPayment} payment={selectedPayment} onClose={() => setSelectedPayment(null)} />

        {active === 'products' && (
          <>
            <h3>{strings.allProducts}</h3>
            <div className="product-grid">
              {products.map(p => <ProductCard key={p._id} product={p} role="retailer" showOrderControls onOrder={placeOrder} />)}
            </div>
          </>
        )}

        {active === 'orders' && (
          <>
            <h3 style={{ marginTop: 8 }}>{strings.orderHistory}</h3>
            <table className="table">
              <thead>
                <tr>
                  <th>{strings.product}</th><th>{strings.farmerCol}</th><th>{strings.qty}</th>
                  <th>{strings.total}</th><th>{strings.status}</th><th>{strings.paid}</th><th>{strings.action}</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o._id}>
                    <td>{o.product?.name}</td>
                    <td>{o.farmer?.name}</td>
                    <td>{o.quantity}</td>
                    <td>₹{o.totalPrice}</td>
                    <td><span className={"status-pill " + (o.status ? o.status.toLowerCase() : "")}>{o.status}</span></td>
                    <td>{o.isPaid ? strings.yes : strings.no}</td>
                    <td>
                      {o.isPaid ? (
                        <span className="muted">{o.status === 'Delivered' ? strings.delivered : strings.paidLabel}</span>
                      ) : o.status === 'Accepted' ? (
                        <button className="btn-primary" onClick={() => handlePay(o._id)} disabled={payLoading}>
                          💳 {payLoading ? '⏳' : strings.pay}
                        </button>
                      ) : (
                        <div className="muted" style={{ fontSize: 12 }}>{strings.waitFarmer}</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {active === 'payments' && (
          <>
            <h3 style={{ marginTop: 8 }}>{strings.paymentHistory}</h3>
            <table className="table">
              <thead>
                <tr>
                  <th>{strings.date}</th><th>{strings.order}</th><th>{strings.product}</th>
                  <th>{strings.farmerCol}</th><th>{strings.amount}</th><th>{strings.status}</th><th>{strings.receipt}</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p._id}>
                    <td>{p.createdAt ? new Date(p.createdAt).toLocaleString() : '—'}</td>
                    <td>{p.order?._id}</td>
                    <td>{p.order?.product?.name || '—'}</td>
                    <td>{p.order?.farmer?.name  || '—'}</td>
                    <td>₹{p.amount}</td>
                    <td>{p.paymentStatus}</td>
                    <td><button className="btn-secondary" onClick={() => setSelectedPayment(p)}>{strings.view}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
};

export default RetailerDashboard;