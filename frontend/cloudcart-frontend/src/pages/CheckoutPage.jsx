
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { checkoutOrder } from '../api/orderApi.js';

const money = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

export default function CheckoutPage() {
  const { items, subtotal, refreshCart } = useCart();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const shipping = subtotal === 0 || subtotal >= 1999 ? 0 : 99;
  const total = subtotal + shipping;

  async function handlePlaceOrder() {
    if (loading) return;

    if (!items.length) {
      setError('Your cart is empty. Add products before checkout.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create an order using the authenticated user's backend cart.
      const order = await checkoutOrder();

      // The backend clears the cart after saving the order.
      try {
        await refreshCart();
      } catch (refreshError) {
        console.warn(
          'Order created, but cart refresh failed:',
          refreshError
        );
      }

      navigate(`/order-success/${order.orderId}`, {
        state: { order },
        replace: true,
      });
    } catch (err) {
      setError(err.message || 'Unable to place your order.');
    } finally {
      setLoading(false);
    }
  }

  if (!items.length) {
    return (
      <main className="page-shell checkout-page">
        <div className="checkout-heading">
          <span className="checkout-eyebrow">YOUR SHOPPING JOURNEY</span>
          <h1>Checkout</h1>
          <p>Your next great find is just a click away.</p>
        </div>

        <section className="checkout-card checkout-empty">
          <div className="checkout-empty-icon" aria-hidden="true">
            🛍️
          </div>
          <h2>Your cart is empty</h2>
          <p>Add some products before proceeding to checkout.</p>

          <Link to="/" className="primary-button checkout-action-link">
            Continue shopping
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell checkout-page">
      <div className="checkout-heading">
        <span className="checkout-eyebrow">ALMOST YOURS</span>
        <h1>Checkout</h1>
        <p>Review your items and place your order.</p>
      </div>

      <div className="checkout-layout">
        <section className="checkout-card checkout-summary">
          <div className="checkout-section-heading">
            <div>
              <h2>Order summary</h2>
              <p>
                {items.length} {items.length === 1 ? 'item' : 'items'} in
                your order
              </p>
            </div>

            <span className="checkout-secure-label">
              <span aria-hidden="true">✓</span> Order review
            </span>
          </div>

          <div className="checkout-items">
            {items.map((item) => (
              <article className="checkout-item" key={item.id}>
                <div className="checkout-item-info">
                  <h3>{item.name}</h3>
                  <p>Quantity: {item.quantity}</p>
                  <span className="checkout-item-unit-price">
                    {money(item.price)} each
                  </span>
                </div>

                <p className="checkout-item-price">
                  {money(Number(item.price) * Number(item.quantity))}
                </p>
              </article>
            ))}
          </div>

          <div className="checkout-totals">
            <div className="checkout-total-row">
              <span>Subtotal</span>
              <span>{money(subtotal)}</span>
            </div>

            <div className="checkout-total-row">
              <span>Shipping</span>
              <span className={shipping === 0 ? 'free-shipping' : ''}>
                {shipping === 0 ? 'FREE' : money(shipping)}
              </span>
            </div>

            {shipping > 0 && (
              <p className="checkout-shipping-hint">
                Get free shipping on orders of ₹1,999 or more.
              </p>
            )}

            <div className="checkout-total-row checkout-total-final">
              <span>Total</span>
              <span>{money(total)}</span>
            </div>
          </div>

          <p className="checkout-payment-note">
            <span aria-hidden="true">ℹ</span>
            Payment is simulated in this version. No real payment will be
            charged.
          </p>

          {error && (
            <div role="alert" className="checkout-error">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handlePlaceOrder}
            disabled={loading || !items.length}
            className="primary-button checkout-place-button"
          >
            {loading ? 'Placing your order...' : 'Place order'}
            {!loading && <span aria-hidden="true"> →</span>}
          </button>

          <Link to="/cart" className="checkout-back-link">
            <span aria-hidden="true">←</span> Back to cart
          </Link>
        </section>

        <aside className="checkout-benefits">
          <div className="checkout-benefit">
            <span className="checkout-benefit-icon" aria-hidden="true">
              ✓
            </span>
            <div>
              <h3>Order confirmation</h3>
              <p>View your order details after placing your order.</p>
            </div>
          </div>

          <div className="checkout-benefit">
            <span className="checkout-benefit-icon" aria-hidden="true">
              ₹
            </span>
            <div>
              <h3>Transparent pricing</h3>
              <p>Your subtotal and shipping charge are shown before ordering.</p>
            </div>
          </div>

          <div className="checkout-benefit">
            <span className="checkout-benefit-icon" aria-hidden="true">
              ↻
            </span>
            <div>
              <h3>Order tracking</h3>
              <p>Find your saved orders in the My Orders section.</p>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}