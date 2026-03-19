import React, { useContext, useEffect, useState } from 'react';
import { TranslationContext } from '../utils/translations';

/**
 * QRPaymentModal
 * Props:
 *   open       – boolean
 *   onClose    – fn()
 *   order      – order object  { _id, totalPrice, product, farmer, quantity }
 *   onConfirm  – fn(orderId) — called when user clicks the final "Pay Now" button
 *   loading    – boolean (parent sets true while API call is in progress)
 */
const QRPaymentModal = ({ open, onClose, order, onConfirm, loading }) => {
  const { strings } = useContext(TranslationContext);
  const [confirmed, setConfirmed] = useState(false);

  // reset state every time modal opens for a new order
  useEffect(() => {
    if (open) setConfirmed(false);
  }, [open, order?._id]);

  // close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open || !order) return null;

  const amount     = order.totalPrice || 0;
  const upiId      = 'agromarket@upi';          // ← change to real UPI ID
  const payeeName  = encodeURIComponent('Agro Market');
  const amountStr  = amount.toFixed(2);
  const tn         = encodeURIComponent(`Order ${order._id}`);

  // Standard UPI deep-link — any UPI QR scanner will read this
  const upiString  = `upi://pay?pa=${upiId}&pn=${payeeName}&am=${amountStr}&cu=INR&tn=${tn}`;

  // We generate the QR via a free public API (no library needed)
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiString)}`;

  const handlePay = () => {
    setConfirmed(true);
    onConfirm(order._id);
  };

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div
        className="modal qr-modal"
        onMouseDown={(e) => e.stopPropagation()}
        style={{ maxWidth: 400, textAlign: 'center' }}
      >
        {/* Header */}
        <div className="modal-head">
          <h3 style={{ margin: 0 }}>💳 {strings.paymentReceipt || 'Payment'}</h3>
          <button className="nav-btn" onClick={onClose}>✕</button>
        </div>

        {/* Order summary */}
        <div className="modal-body">
          <div className="qr-order-summary">
            <div className="qr-summary-row">
              <span className="muted">{strings.product || 'Product'}</span>
              <strong>{order.product?.name || '—'}</strong>
            </div>
            <div className="qr-summary-row">
              <span className="muted">{strings.farmerCol || 'Farmer'}</span>
              <strong>{order.farmer?.name || '—'}</strong>
            </div>
            <div className="qr-summary-row">
              <span className="muted">{strings.qty || 'Qty'}</span>
              <strong>{order.quantity}</strong>
            </div>
            <div className="qr-summary-row qr-total-row">
              <span className="muted">{strings.totalAmount || 'Total'}</span>
              <strong className="qr-amount">₹{amount.toLocaleString()}</strong>
            </div>
          </div>

          {/* QR Code */}
          <div className="qr-code-wrap">
            <p className="qr-instruction">
              📱 Scan with any UPI app<br />
              <span className="muted" style={{ fontSize: 12 }}>
                GPay · PhonePe · Paytm · BHIM
              </span>
            </p>
            <div className="qr-frame">
              <img
                src={qrUrl}
                alt="UPI QR Code"
                width={200}
                height={200}
                style={{ display: 'block', borderRadius: 8 }}
              />
            </div>
            <p className="qr-upi-id">
              UPI ID: <code>{upiId}</code>
            </p>
          </div>

          <p className="qr-note">
            After scanning and paying on your UPI app,<br />
            click <b>Confirm Payment</b> below to update your order.
          </p>
        </div>

        {/* Actions */}
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose} disabled={loading}>
            {strings.cancel || 'Cancel'}
          </button>
          <button
            className="btn-primary qr-pay-btn"
            onClick={handlePay}
            disabled={loading || confirmed}
            style={{ minWidth: 160 }}
          >
            {loading || confirmed
              ? '⏳ Processing…'
              : `✅ Confirm Payment  ₹${amount.toLocaleString()}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRPaymentModal;