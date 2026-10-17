import { PackageSearch, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';

const money = value => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
export default function OrdersPage() {
  const orders = JSON.parse(localStorage.getItem('cloudcart-demo-orders') || '[]');
  return <main className="page-shell container"><div className="page-title"><div className="eyebrow">YOUR ACCOUNT</div><h1>My orders</h1><p>Order history for this browser's demo checkout.</p></div>{orders.length ? <div className="orders-list">{orders.map(order => <article className="order-card" key={order.id}><div className="order-card-top"><div><span className="muted-label">ORDER NUMBER</span><h3>{order.id}</h3></div><span className="status-pill"><span />{order.status}</span></div><div className="order-card-bottom"><div><span className="muted-label">ITEMS</span><p>{order.items.map(item => `${item.name} × ${item.quantity}`).join(', ')}</p></div><div><span className="muted-label">TOTAL</span><strong>{money(order.total)}</strong></div><div className="order-tracking"><Truck size={17} /> Tracking will be available after Shipping Service integration.</div></div></article>)}</div> : <div className="empty-cart"><div className="empty-icon"><PackageSearch size={30} /></div><h2>No orders yet</h2><p>Your placed demo orders will appear here.</p><Link className="primary-button" to="/">Explore products <span>→</span></Link></div>}</main>;
}
