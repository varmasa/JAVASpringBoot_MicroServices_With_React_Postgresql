import { Check, Plus, Star } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '../context/CartContext.jsx';

const money = value => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const image = product.imageUrl
    ? <img src={product.imageUrl} alt={product.name} loading="lazy" />
    : <span aria-hidden="true">{product.image || '📦'}</span>;

  function handleAdd() {
    addItem(product);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1100);
  }

  return (
    <article className="product-card">
      <div className={`product-art art-${String(product.id).slice(-1)}`}>{image}</div>
      <div className="product-info">
        <div className="product-meta"><span>{product.category || 'Essentials'}</span><span className="rating"><Star size={13} fill="currentColor" /> {product.rating || '4.5'}</span></div>
        <h3>{product.name}</h3>
        <p className="product-description">{product.description || 'A customer favourite, made for everyday use.'}</p>
        <div className="product-bottom">
          <strong>{money(Number(product.price) || 0)}</strong>
          <button className={`add-button ${added ? 'added' : ''}`} onClick={handleAdd} disabled={product.stockQuantity === 0}>
            {product.stockQuantity === 0 ? 'Sold out' : added ? <><Check size={16} /> Added</> : <><Plus size={16} /> Add</>}
          </button>
        </div>
      </div>
    </article>
  );
}
