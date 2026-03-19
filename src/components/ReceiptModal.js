import React, { useContext, useEffect } from 'react';
import jsPDF from 'jspdf';
import { TranslationContext } from '../utils/translations';

function safe(v) { return v === undefined || v === null || v === '' ? '—' : String(v); }
function formatDate(d) { try { return d ? new Date(d).toLocaleString() : '—'; } catch { return '—'; } }

const ReceiptModal = ({ open, onClose, payment }) => {
  const { strings } = useContext(TranslationContext);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const order = payment?.order;
  const receiptNo = payment?._id;

  const lines = [
    [strings.receiptNo,     safe(receiptNo)],
    [strings.date,          formatDate(payment?.createdAt)],
    [strings.orderId,       safe(order?._id)],
    [strings.buyerRole,     safe(order?.buyerRole)],
    [strings.product,       safe(order?.product?.name)],
    [strings.farmerCol,     safe(order?.farmer?.name)],
    [strings.qty,           safe(order?.quantity)],
    [strings.pricePerUnit,  order?.pricePerUnit !== undefined ? `₹${order.pricePerUnit}` : '—'],
    [strings.totalAmount,   payment?.amount !== undefined ? `₹${payment.amount}` : '—'],
    [strings.paymentStatus, safe(payment?.paymentStatus)],
    [strings.orderStatus,   safe(order?.status)],
  ];

  const downloadPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Agro Market - Payment Receipt', 14, 18);
    doc.setFontSize(11);
    doc.text('This is a system-generated receipt.', 14, 26);
    let y = 38;
    lines.forEach(([k, v]) => { doc.text(`${k}: ${v}`, 14, y); y += 7; });
    const filename = `AgroMarket_Receipt_${safe(receiptNo)}.pdf`.replace(/[^\w.-]+/g, '_');
    doc.save(filename);
  };

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3 style={{ margin: 0 }}>{strings.paymentReceipt}</h3>
          <button className="nav-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="receipt-grid">
            {lines.map(([k, v]) => (
              <React.Fragment key={k}>
                <div className="muted">{k}</div>
                <div><b>{v}</b></div>
              </React.Fragment>
            ))}
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={() => window.print()}>{strings.print}</button>
          <button className="btn-primary"   onClick={downloadPdf}>{strings.downloadPdf}</button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;