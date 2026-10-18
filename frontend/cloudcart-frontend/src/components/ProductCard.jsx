import { Check, Plus, Star } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '../context/CartContext.jsx';

const money = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  const imageUrl = product.imageUrl || product.image_url || '';
  const image =
    imageUrl && !imageFailed ? (
      <img
        src={product.imageUrl || product.image_url}
        alt={product.name}
        className="product-image"
        onError={(e) => {
            e.currentTarget.style.display = "none";
       }}
      />
    ) : (
      <span aria-hidden="true">{product.image || '📦'}</span>
    );

  function handleAdd() {
    addItem(product);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1100);
  }

  const stock = product.stock ?? product.stockQuantity ?? product.quantity;

  return (
    <article className="product-card">
      <div className={`product-art art-${String(product.id).slice(-1)}`}>{image}</div>
      <div className="product-info">
        <div className="product-meta">
          <span>{product.category || 'Essentials'}</span>
          <span className="rating"><Star size={13} fill="currentColor" />{' '}{product.rating || '4.5'}</span>
        </div>
        <h3>{product.name}</h3>
        <p className="product-description">
          {product.description || 'A customer favourite, made for everyday use.'}
        </p>
        <div className="product-bottom">
          <strong>{money(Number(product.price) || 0)}</strong>
          <button
            className={`add-button ${added ? 'added' : ''}`}
            onClick={handleAdd}
            disabled={stock === 0}
          >
            {stock === 0
              ? 'Sold out'
              : added
                ? <><Check size={16} /> Added</>
                : <><Plus size={16} /> Add</>}
          </button>
        </div>
      </div>
    </article>
  );
}