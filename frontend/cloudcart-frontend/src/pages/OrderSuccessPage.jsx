
import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { getMyOrder } from '../api/orderApi.js';

const money = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

export default function OrderSuccessPage() {
  const { orderId } = useParams();
  const location = useLocation();

  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!location.state?.order);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      setError('Order ID is missing.');
      return;
    }

    let active = true;

    async function loadOrder() {
      try {
        const data = await getMyOrder(orderId);

        if (active) {
          setOrder(data);
        }
      } catch (err) {
        if (active) {
          setError(err.message || 'Unable to load order.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadOrder();

    return () => {
      active = false;
    };
  }, [orderId]);

  if (loading) {
    return (
      <main className="page-shell order-details-page">
        <div className="order-loading">
          <span className="order-loading-spinner" aria-hidden="true" />
          Loading order details...
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="page-shell order-details-page">
        <section className="checkout-card order-error-card">
          <div className="checkout-empty-icon" aria-hidden="true">
            ⚠️
          </div>
          <h1>Order details unavailable</h1>
          <p role="alert" className="order-error-message">
            {error || 'Order not found.'}
          </p>

          <Link to="/orders" className="primary-button checkout-action-link">
            View my orders
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell order-details-page">
      <section className="checkout-card order-success-card">
        <div className="order-success-mark" aria-hidden="true">
          ✓
        </div>

        <span className="checkout-eyebrow">THANK YOU FOR SHOPPING</span>
        <h1 className="order-success-title">Order placed successfully!</h1>
        <p className="order-success-message">
          Your order has been saved. You can review its details below.
        </p>

        <div className="order-detail-meta">
          <div>
            <span>ORDER ID</span>
            <strong>#{order.orderId}</strong>
          </div>

          <div>
            <span>STATUS</span>
            <strong>{order.status || 'Pending'}</strong>
          </div>

          <div>
            <span>ORDER DATE</span>
            <strong>
              {order.createdAt
                ? new Date(order.createdAt).toLocaleString()
                : 'Unavailable'}
            </strong>
          </div>
        </div>

        <div className="order-detail-items">
          <h2>Items in your order</h2>

          {(order.items || []).length === 0 ? (
            <p className="order-no-items">
              No item details are available for this order.
            </p>
          ) : (
            (order.items || []).map((item, index) => (
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
            ))
          )}
        </div>

        <div className="order-success-total">
          <span>Total paid</span>
          <strong>{money(order.totalAmount)}</strong>
        </div>

        <p className="checkout-payment-note">
          <span aria-hidden="true">ℹ</span>
          This demo does not process real payments.
        </p>

        <div className="order-success-actions">
          <Link to="/orders" className="primary-button checkout-action-link">
            View all orders
          </Link>

          <Link to="/" className="order-history-link">
            Continue shopping <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    </main>
  );
}