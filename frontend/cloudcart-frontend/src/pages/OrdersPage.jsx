
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyOrders } from '../api/orderApi.js';

const money = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadOrders() {
      try {
        const data = await getMyOrders();

        if (active) {
          setOrders(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (active) {
          setError(err.message || 'Unable to load orders.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadOrders();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <main className="page-shell orders-page">
        <div className="orders-heading">
          <span className="checkout-eyebrow">YOUR ACCOUNT</span>
          <h1>My Orders</h1>
          <p>Loading your order history...</p>
        </div>

        <div className="order-loading">
          <span className="order-loading-spinner" aria-hidden="true" />
          Loading your orders...
        </div>
      </main>
    );
  }

  return (
    <main className="page-shell orders-page">
      <div className="orders-heading">
        <span className="checkout-eyebrow">YOUR ACCOUNT</span>
        <h1>My Orders</h1>
        <p>Keep track of your purchases and order details.</p>
      </div>

      {error && (
        <div role="alert" className="checkout-error">
          {error}
        </div>
      )}

      {!error && orders.length === 0 && (
        <section className="checkout-card order-empty">
          <div className="checkout-empty-icon" aria-hidden="true">
            📦
          </div>
          <h2>No orders yet</h2>
          <p>
            You haven't placed any orders yet. Your purchases will appear
            here.
          </p>

          <Link to="/" className="primary-button checkout-action-link">
            Start shopping
          </Link>
        </section>
      )}

      {!error && orders.length > 0 && (
        <div className="orders-list">
          {orders.map((order) => (
            <article className="order-history-card" key={order.orderId}>
              <div className="order-history-top">
                <div>
                  <span className="order-card-label">ORDER NUMBER</span>
                  <h2>#{order.orderId}</h2>
                  <p className="order-card-date">
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleString()
                      : 'Date unavailable'}
                  </p>
                </div>

                <span
                  className={`order-status-badge status-${String(
                    order.status || 'unknown'
                  ).toLowerCase()}`}
                >
                  {order.status || 'Unknown'}
                </span>
              </div>

              <div className="order-history-items">
                {(order.items || []).map((item, index) => (
                  <div
                    className="order-history-item"
                    key={`${item.productId}-${index}`}
                  >
                    <span>
                      {item.productName} <span aria-hidden="true">×</span>{' '}
                      {item.quantity}
                    </span>
                    <span>{money(item.subtotal)}</span>
                  </div>
                ))}
              </div>

              <div className="order-history-bottom">
                <div>
                  <span className="order-card-label">ORDER TOTAL</span>
                  <p className="order-history-total">
                    {money(order.totalAmount)}
                  </p>
                </div>

                <Link
                  to={`/order-success/${order.orderId}`}
                  className="order-history-link"
                >
                  View details <span aria-hidden="true">→</span>
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}