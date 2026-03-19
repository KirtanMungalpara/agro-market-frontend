import React, { useContext } from 'react';
import { TranslationContext } from '../utils/translations';

const ProductCard = ({ product, onOrder, showOrderControls, role }) => {
  const { strings } = useContext(TranslationContext);
  const outOfStock = product.quantity <= 0;
  const lowStock   = product.quantity > 0 && product.quantity < 5;

  return (
    <div className="product-card">
      <div className="product-image">
        {product.image
          ? <img src={`${process.env.REACT_APP_API_URL}${product.image}`} alt={product.name} />
          : <div className="image-placeholder">{strings.noImage}</div>}
      </div>
      <div className="product-body">
        <div className="product-title">
          <h3>{product.name}</h3>
          <span className={`badge ${product.type === 'seeds' ? 'badge-seed' : 'badge-inv'}`}>
            {product.type}
          </span>
        </div>
        <p className="muted">{strings.farmer}: {product.farmer?.name || '—'}</p>
        <p>
          {strings.qty}: <b>{product.quantity}</b>{' '}
          {lowStock ? <span className="low-stock">{strings.lowStock}</span> : null}
        </p>
        <div className="price-row">
          <span>{strings.retail}: <b>₹{product.retailPrice}</b></span>
          <span>{strings.wholesale}: <b>₹{product.wholesalePrice}</b></span>
        </div>
        {outOfStock ? <div className="out-stock">{strings.outOfStock}</div> : null}
        {showOrderControls && !outOfStock
          ? <OrderControls product={product} role={role} onOrder={onOrder} />
          : null}
      </div>
    </div>
  );
};

const OrderControls = ({ product, onOrder, role }) => {
  const { strings } = useContext(TranslationContext);
  const [qty, setQty] = React.useState(1);
  const pricePerUnit = role === 'wholesaler' ? product.wholesalePrice : product.retailPrice;

  return (
    <div className="order-controls">
      <input
        type="number" min="1" max={product.quantity}
        value={qty} onChange={(e) => setQty(Number(e.target.value))}
      />
      <button className="btn-primary" onClick={() => onOrder({ productId: product._id, quantity: qty, pricePerUnit })}>
        {strings.placeOrder}
      </button>
    </div>
  );
};

export default ProductCard;