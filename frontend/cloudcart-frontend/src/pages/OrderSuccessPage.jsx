import { CheckCircle2, PackageCheck } from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router-dom';

export default function OrderSuccessPage() {
  const { orderId } = useParams();
  const { state } = useLocation();
  const order = state?.order || JSON.parse(localStorage.getItem('cloudcart-demo-orders') || '[]').find(item => item.id === orderId);
  return <main className="page-shell container"><section className="success-card"><div className="success-icon"><CheckCircle2 size={38} /></div><div className="eyebrow">ORDER CREATED</div><h1>Thanks for your order.</h1><p>Your demo order has been saved in this browser. Next, we'll connect this screen to the Order Service API.</p><div className="tracking-preview"><PackageCheck size={22} /><div><strong>Order {orderId}</strong><span>{order?.status || 'Order received'} · Shipping integration pending</span></div></div><Link className="primary-button" to="/orders">View my orders <span>→</span></Link><Link className="text-link" to="/">Continue shopping</Link></section></main>;
}
