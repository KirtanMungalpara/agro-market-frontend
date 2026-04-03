import React, { useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import ProductCard from '../components/ProductCard';
import Sidebar from '../components/Sidebar';
import ReceiptModal from '../components/ReceiptModal';
import QRPaymentModal from '../components/QRPaymentModal';
import { TranslationContext } from '../utils/translations';
import socket from '../utils/socket';

const api = axios.create({ baseURL: process.env.REACT_APP_API_URL });

const WholesalerDashboard = ({ token, user }) => {
  const { strings } = useContext(TranslationContext);
  const [products,        setProducts]        = useState([]);
  const [orders,          setOrders]          = useState([]);
  const [payments,        setPayments]        = useState([]);
  const [msg,             setMsg]             = useState('');
  const [active,          setActive]          = useState('products');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [qrOrder,         setQrOrder]         = useState(null);
  const [payLoading,      setPayLoading]      = useState(false);

  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const load = async () => {
    const [p, o, pay] = await Promise.all([
      api.get('/products'),
      api.get(`/orders/buyer/${user.id}`, { headers }),
      api.get(`/orders/payments/buyer/${user.id}`, { headers }),
    ]);
    setProducts(p.data);
    setOrders(o.data);
    setPayments(pay.data);
  };

  useEffect(() => {
    load().catch(() => {});

    // Join this wholesaler's personal room
    socket.emit('join', user.id);

    // Order placed by this wholesaler
    const onOrderPlaced = (order) => {
      setOrders(prev => {
        if (prev.find(o => o._id === order._id)) return prev;
        return [order, ...prev];
      });
      setProducts(prev => prev.map(p =>
        p._id === (order.product?._id || order.product)
          ? { ...p, quantity: p.quantity - order.quantity }
          : p
      ));
    };

    // Farmer accepted/rejected/delivered the order
    const onOrderStatusChanged = (updatedOrder) => {
      setOrders(prev => prev.map(o => o._id === updatedOrder._id ? updatedOrder : o));
      if (updatedOrder.status === 'Accepted') {
        setMsg(`✅ Your order for ${updatedOrder.product?.name || 'a product'} was accepted! You can now pay.`);
        setTimeout(() => setMsg(''), 5000);
      }
      if (updatedOrder.status === 'Delivered') {
        setMsg(`🚚 Your order for ${updatedOrder.product?.name || 'a product'} has been delivered!`);
        setTimeout(() => setMsg(''), 5000);
      }
    };

    // Payment confirmed
    const onPaymentDone = ({ orderId, isPaid }) => {
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, isPaid } : o));
    };

    // Product stock/details updated
    const onProductUpdated = (updatedProduct) => {
      setProducts(prev => prev.map(p =>
        p._id === updatedProduct._id ? { ...p, ...updatedProduct } : p
      ));
    };

    // New product added by a farmer
    const onProductAdded = (newProduct) => {
      setProducts(prev => {
        if (prev.find(p => p._id === newProduct._id)) return prev;
        return [newProduct, ...prev];
      });
    };

    // Product deleted
    const onProductDeleted = ({ _id }) => {
      setProducts(prev => prev.filter(p => p._id !== _id));
    };

    socket.on('order_placed', onOrderPlaced);
    socket.on('order_status_changed', onOrderStatusChanged);
    socket.on('payment_done', onPaymentDone);
    socket.on('product_updated', onProductUpdated);
    socket.on('product_added', onProductAdded);
    socket.on('product_deleted', onProductDeleted);

    return () => {
      socket.off('order_placed', onOrderPlaced);
      socket.off('order_status_changed', onOrderStatusChanged);
      socket.off('payment_done', onPaymentDone);
      socket.off('product_updated', onProductUpdated);
      socket.off('product_added', onProductAdded);
      socket.off('product_deleted', onProductDeleted);
    };
  }, [user.id]);

  const placeOrder = async ({ productId, quantity, pricePerUnit }) => {
    setMsg('');
    try {
      await api.post('/orders', { productId, quantity, pricePerUnit }, { headers });
      setMsg(strings.orderPlaced);
    } catch (e) { setMsg(e.response?.data?.message || strings.failed); }
  };

  const openQR = (order) => { setMsg(''); setQrOrder(order); };

  const confirmPay = async (orderId) => {
    setPayLoading(true);
    try {
      const { data } = await api.post(`/orders/${orderId}/pay`, {}, { headers });
      setMsg(strings.paymentSuccess);
      setQrOrder(null);
      if (data.payment) {
        setPayments(prev => [data.payment, ...prev]);
      }
    } catch (e) {
      setMsg(e.response?.data?.message || strings.paymentFailed);
      setQrOrder(null);
    } finally { setPayLoading(false); }
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
        <h2 style={{ marginTop: 0 }}>{strings.wholesalerDashboard}</h2>
        {msg ? <div className="stat">{msg}</div> : null}

        <ReceiptModal open={!!selectedPayment} payment={selectedPayment} onClose={() => setSelectedPayment(null)} />
        <QRPaymentModal open={!!qrOrder} order={qrOrder} onClose={() => setQrOrder(null)} onConfirm={confirmPay} loading={payLoading} />

        {active === 'products' && (
          <>
            <h3>{strings.allProducts}</h3>
            <div className="product-grid">
              {products.map(p => <ProductCard key={p._id} product={p} role="wholesaler" showOrderControls onOrder={placeOrder} />)}
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
                    <td>{o.status}</td>
                    <td>{o.isPaid ? strings.yes : strings.no}</td>
                    <td>
                      {o.isPaid ? (
                        <span className="muted">{o.status === 'Delivered' ? strings.delivered : strings.paidLabel}</span>
                      ) : o.status === 'Accepted' ? (
                        <button className="btn-primary" onClick={() => openQR(o)}>
                          📱 {strings.pay}
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

export default WholesalerDashboard;