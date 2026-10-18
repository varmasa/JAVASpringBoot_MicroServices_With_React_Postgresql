
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { checkoutOrder } from '../api/orderApi.js';
import RazorpayCheckout from '../components/RazorpayCheckout.jsx';

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
  const [pendingOrder, setPendingOrder] = useState(null);

  // Display estimate only. The backend calculates the authoritative total.
  const estimatedShipping =
    subtotal === 0 || subtotal >= 1999 ? 0 : 99;

  const estimatedTotal = subtotal + estimatedShipping;

  async function handlePlaceOrder() {
    if (loading || pendingOrder) return;

    if (!items.length) {
      setError('Your cart is empty. Add products before checkout.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const order = await checkoutOrder();

      if (!order?.orderId) {
        throw new Error(
          'The server did not return an order ID. Please check your orders before retrying.'
        );
      }

      // Keep the saved order on this page until payment is verified.
      setPendingOrder(order);

      // The backend clears the cart after saving the order.
      try {
        await refreshCart();
      } catch (refreshError) {
        console.warn(
          'Could not refresh the cart:',
          refreshError
        );
      }
    } catch (err) {
      setError(
        err.message ||
          'Unable to create your order. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function handlePaymentVerified(payment) {
    if (!pendingOrder) return;

    // Razorpay callback data alone is not sufficient.
    // This callback must receive the result from backend verification.
    if (payment?.status !== 'PAID') {
      setError(
        'Payment has not been confirmed. Check your order status before retrying.'
      );
      return;
    }

    const completedOrder = {
      ...pendingOrder,
      status: payment.status,
      paymentStatus: payment.status,
    };

    navigate(`/order-success/${pendingOrder.orderId}`, {
      state: {
        order: completedOrder,
      },
      replace: true,
    });
  }

  // Do not show the empty-cart screen after an order has been created.
  if (!items.length && !pendingOrder && !loading) {
    return (
      <main className="page-shell checkout-page">
        <div className="checkout-heading">
          <span className="checkout-eyebrow">
            YOUR SHOPPING JOURNEY
          </span>

          <h1>Checkout</h1>

          <p>Your next great find is just a click away.</p>
        </div>

        <section className="checkout-card checkout-empty">
          <div
            className="checkout-empty-icon"
            aria-hidden="true"
          >
            🛍️
          </div>

          <h2>Your cart is empty</h2>

          <p>
            Add some products before proceeding to checkout.
          </p>

          <Link
            to="/"
            className="primary-button checkout-action-link"
          >
            Continue shopping
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell checkout-page">
      <div className="checkout-heading">
        <span className="checkout-eyebrow">
          ALMOST YOURS
        </span>

        <h1>Checkout</h1>

        <p>
          {pendingOrder
            ? 'Complete your payment securely.'
            : 'Review your items and place your order.'}
        </p>
      </div>

      <div className="checkout-layout">
        <section className="checkout-card checkout-summary">
          <div className="checkout-section-heading">
            <div>
              <h2>Order summary</h2>

              <p>
                {pendingOrder
                  ? `Order #${pendingOrder.orderId}`
                  : `${items.length} ${
                      items.length === 1 ? 'item' : 'items'
                    } in your order`}
              </p>
            </div>

            <span className="checkout-secure-label">
              <span aria-hidden="true">✓</span>
              {pendingOrder
                ? 'Payment pending'
                : 'Order review'}
            </span>
          </div>

          {!pendingOrder && (
            <>
              <div className="checkout-items">
                {items.map((item) => (
                  <article
                    className="checkout-item"
                    key={item.id}
                  >
                    <div className="checkout-item-info">
                      <h3>{item.name}</h3>

                      <p>Quantity: {item.quantity}</p>

                      <span className="checkout-item-unit-price">
                        {money(item.price)} each
                      </span>
                    </div>

                    <p className="checkout-item-price">
                      {money(
                        Number(item.price) *
                          Number(item.quantity)
                      )}
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

                  <span
                    className={
                      estimatedShipping === 0
                        ? 'free-shipping'
                        : ''
                    }
                  >
                    {estimatedShipping === 0
                      ? 'FREE'
                      : money(estimatedShipping)}
                  </span>
                </div>

                {estimatedShipping > 0 && (
                  <p className="checkout-shipping-hint">
                    Get free shipping on orders of ₹1,999
                    or more.
                  </p>
                )}

                <div className="checkout-total-row checkout-total-final">
                  <span>Estimated total</span>
                  <span>{money(estimatedTotal)}</span>
                </div>
              </div>

              <p className="checkout-payment-note">
                The final payment amount is calculated by
                the backend and supplied to Razorpay.
              </p>
            </>
          )}

          {pendingOrder && (
            <div className="checkout-payment-note">
              <p>
                Your order has been saved successfully.
              </p>

              <p>
                Order ID: #{pendingOrder.orderId}
              </p>

              <p>
                Order total: {money(pendingOrder.totalAmount)}
              </p>

              <p>
                Complete payment below. Your order will be
                marked as paid only after backend verification.
              </p>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="checkout-error"
            >
              {error}
            </div>
          )}

          {!pendingOrder ? (
            <>
              <p className="checkout-payment-note">
                Payments are processed using Razorpay Test
                Mode. Use your Razorpay test credentials and
                test payment methods.
              </p>

              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={loading || !items.length}
                className="primary-button checkout-place-button"
              >
                {loading
                  ? 'Creating your order...'
                  : 'Continue to payment'}

                {!loading && (
                  <span aria-hidden="true"> →</span>
                )}
              </button>
            </>
          ) : (
            <div className="checkout-payment-section">
              <RazorpayCheckout
                orderId={pendingOrder.orderId}
                onPaymentVerified={handlePaymentVerified}
              />

              <p className="checkout-payment-note">
                If payment verification fails or checkout is
                cancelled, check your order status before
                attempting another payment.
              </p>
            </div>
          )}

          <Link
            to="/cart"
            className="checkout-back-link"
          >
            <span aria-hidden="true">←</span> Back to cart
          </Link>
        </section>

        <aside className="checkout-benefits">
          <div className="checkout-benefit">
            <span
              className="checkout-benefit-icon"
              aria-hidden="true"
            >
              ✓
            </span>

            <div>
              <h3>Order confirmation</h3>

              <p>
                Your order is marked as paid after server-side
                payment verification.
              </p>
            </div>
          </div>

          <div className="checkout-benefit">
            <span
              className="checkout-benefit-icon"
              aria-hidden="true"
            >
              ₹
            </span>

            <div>
              <h3>Secure payment</h3>

              <p>
                Razorpay handles the checkout payment interface.
              </p>
            </div>
          </div>

          <div className="checkout-benefit">
            <span
              className="checkout-benefit-icon"
              aria-hidden="true"
            >
              ↻
            </span>

            <div>
              <h3>Order tracking</h3>

              <p>
                View your saved orders in the My Orders section.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}