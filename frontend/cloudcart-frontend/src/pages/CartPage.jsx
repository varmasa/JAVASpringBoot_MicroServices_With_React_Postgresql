import { ArrowLeft, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';

const money = value => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);

export default function CartPage() {
  const { items, subtotal, updateQuantity, removeItem } = useCart();
  const navigate = useNavigate();
  const shipping = subtotal === 0 || subtotal >= 1999 ? 0 : 99;
  return (
    <main className="page-shell container">
      <Link to="/" className="back-link"><ArrowLeft size={16} /> Continue shopping</Link>
      <div className="page-title"><div className="eyebrow">YOUR SELECTION</div><h1>Shopping cart <span>({items.reduce((sum, item) => sum + item.quantity, 0)})</span></h1></div>
      {!items.length ? <div className="empty-cart"><div className="empty-icon"><ShoppingBag size={30} /></div><h2>Your cart is taking a break</h2><p>Add a few everyday favourites and they'll show up here.</p><Link className="primary-button" to="/">Browse products <span>↗</span></Link></div> :
        <div className="cart-layout"><section className="cart-items">{items.map(item => <article className="cart-row" key={item.id}><div className="cart-product-art">{item.imageUrl ? <img src={item.imageUrl} alt={item.name} /> : item.image || '📦'}</div><div className="cart-product-info"><span className="muted-label">{item.category || 'Essentials'}</span><h3>{item.name}</h3><p>{money(item.price)} each</p><button className="remove-button" onClick={() => removeItem(item.id)}><Trash2 size={14} /> Remove</button></div><div className="quantity-control"><button onClick={() => updateQuantity(item.id, item.quantity - 1)} aria-label="Decrease quantity"><Minus size={14} /></button><span>{item.quantity}</span><button onClick={() => updateQuantity(item.id, item.quantity + 1)} aria-label="Increase quantity" disabled={item.quantity >= (item.stockQuantity ?? 99)}><Plus size={14} /></button></div><strong className="line-total">{money(item.price * item.quantity)}</strong></article>)}</section>
        <aside className="order-summary"><h2>Order summary</h2><div className="summary-line"><span>Subtotal</span><span>{money(subtotal)}</span></div><div className="summary-line"><span>Estimated shipping</span><span>{shipping === 0 ? 'FREE' : money(shipping)}</span></div><p className="shipping-hint">{subtotal >= 1999 ? 'You unlocked free shipping.' : `Spend ${money(1999 - subtotal)} more for free shipping.`}</p><div className="summary-total"><span>Estimated total</span><strong>{money(subtotal + shipping)}</strong></div><button className="primary-button checkout-button" onClick={() => navigate('/checkout')}>Continue to checkout <span>→</span></button><p className="demo-note">Demo checkout · Payment integration comes later</p></aside></div>}
    </main>
  );
}
