import { ArrowLeft, CheckCircle2, MapPin } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';

const money = value => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const [form, setForm] = useState({ name: '', email: '', address: '', city: '', pincode: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const shipping = subtotal === 0 || subtotal >= 1999 ? 0 : 99;
  function update(event) { setForm({ ...form, [event.target.name]: event.target.value }); }
  function submit(event) {
    event.preventDefault();
    if (!items.length) { setError('Your cart is empty. Add products before checking out.'); return; }
    const order = { id: `CC-${Date.now().toString().slice(-7)}`, createdAt: new Date().toISOString(), customer: form, items, subtotal, shipping, total: subtotal + shipping, status: 'Order received' };
    const previous = JSON.parse(localStorage.getItem('cloudcart-demo-orders') || '[]');
    localStorage.setItem('cloudcart-demo-orders', JSON.stringify([order, ...previous]));
    clearCart();
    navigate(`/order-success/${order.id}`, { state: { order } });
  }
  if (!items.length) return <main className="page-shell container"><div className="empty-cart"><h2>Your cart is empty</h2><Link to="/" className="primary-button">Return to shop</Link></div></main>;
  return <main className="page-shell container"><Link to="/cart" className="back-link"><ArrowLeft size={16} /> Back to cart</Link><div className="page-title"><div className="eyebrow">ALMOST YOURS</div><h1>Checkout</h1><p>Enter delivery details to create a demo order.</p></div>
    <div className="cart-layout checkout-layout"><form className="checkout-form" onSubmit={submit}><h2><MapPin size={19} /> Delivery details</h2><div className="form-grid"><label>Full name<input name="name" value={form.name} onChange={update} required placeholder="Your name" /></label><label>Email address<input type="email" name="email" value={form.email} onChange={update} required placeholder="you@example.com" /></label><label className="full-field">Street address<input name="address" value={form.address} onChange={update} required placeholder="House number and street" /></label><label>City<input name="city" value={form.city} onChange={update} required placeholder="City" /></label><label>PIN code<input name="pincode" value={form.pincode} onChange={update} required pattern="[0-9]{6}" title="Enter a 6-digit PIN code" placeholder="6-digit PIN code" /></label></div><div className="demo-banner">This first version creates a local demo order only. Payment and shipping microservice APIs will be connected in later steps.</div>{error && <p className="form-error">{error}</p>}<button className="primary-button checkout-button" type="submit">Place demo order <span>→</span></button></form>
    <aside className="order-summary"><h2>Order summary</h2>{items.map(item => <div className="summary-line" key={item.id}><span>{item.name} × {item.quantity}</span><span>{money(item.price * item.quantity)}</span></div>)}<div className="summary-line"><span>Shipping</span><span>{shipping ? money(shipping) : 'FREE'}</span></div><div className="summary-total"><span>Total</span><strong>{money(subtotal + shipping)}</strong></div><p className="demo-note"><CheckCircle2 size={14} /> No real payment will be taken.</p></aside></div>
  </main>;
}
