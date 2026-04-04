import React, { useEffect, useState, useContext } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { TranslationContext } from '../utils/translations';
import '../index.css'; // Assuming styling is there

const api = axios.create({ baseURL: process.env.REACT_APP_API_URL });

const PaymentSuccess = ({ token }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { strings } = useContext(TranslationContext);
  
  const [status, setStatus] = useState('loading');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const rzpPaymentId = searchParams.get('razorpay_payment_id');
    const rzpOrderId = searchParams.get('razorpay_order_id');
    const rzpSignature = searchParams.get('razorpay_signature');
    const orderId = searchParams.get('order_id');

    if (!rzpPaymentId || !rzpOrderId || !rzpSignature || !orderId) {
      setStatus('error');
      setMsg('Invalid payment verification parameters.');
      return;
    }

    const verifyPayment = async () => {
      try {
        const res = await api.post(
          '/orders/verify-payment',
          { 
            razorpay_payment_id: rzpPaymentId, 
            razorpay_order_id: rzpOrderId, 
            razorpay_signature: rzpSignature, 
            order_id: orderId 
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data.success) {
          setStatus('success');
        } else {
          setStatus('error');
          setMsg('Payment verification failed.');
        }
      } catch (err) {
        setStatus('error');
        setMsg(err.response?.data?.message || 'Error verifying payment.');
      }
    };

    verifyPayment();
  }, [searchParams, token]);

  return (
    <div className="container" style={{ textAlign: 'center', marginTop: '10%' }}>
      {status === 'loading' && (
        <div>
          <h2>⏳ Verifying your payment...</h2>
          <p>Please wait while we confirm your transaction securely.</p>
        </div>
      )}
      
      {status === 'success' && (
        <div className="stat" style={{ backgroundColor: '#e6ffe6', color: '#006600', padding: '40px', borderRadius: '12px' }}>
          <h1 style={{ fontSize: '48px', margin: '0 0 20px 0' }}>✅</h1>
          <h2>{strings.paymentSuccess || 'Payment Successful!'}</h2>
          <p>Your order has been paid securely via Stripe.</p>
          <button 
            className="btn-primary" 
            style={{ marginTop: '20px' }}
            onClick={() => navigate('/dashboard')}
          >
            Return to Dashboard
          </button>
        </div>
      )}

      {status === 'error' && (
        <div className="stat" style={{ backgroundColor: '#ffe6e6', color: '#cc0000', padding: '40px', borderRadius: '12px' }}>
          <h1 style={{ fontSize: '48px', margin: '0 0 20px 0' }}>❌</h1>
          <h2>{strings.paymentFailed || 'Payment Failed'}</h2>
          <p>{msg}</p>
          <button 
            className="btn-secondary" 
            style={{ marginTop: '20px' }}
            onClick={() => navigate('/dashboard')}
          >
            Return to Dashboard
          </button>
        </div>
      )}
    </div>
  );
};

export default PaymentSuccess;
