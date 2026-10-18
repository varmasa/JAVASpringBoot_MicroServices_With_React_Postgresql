
import { useState } from "react";
import {
  prepareCheckout,
  verifyCheckoutPayment,
} from "../services/razorpayApi";

const CHECKOUT_SCRIPT =
  "https://checkout.razorpay.com/v1/checkout.js";

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existing = document.querySelector(
      `script[src="${CHECKOUT_SCRIPT}"]`
    );

    if (existing) {
      existing.addEventListener("load", () => resolve(true), {
        once: true,
      });
      existing.addEventListener("error", () => resolve(false), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = CHECKOUT_SCRIPT;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function RazorpayCheckout({
  orderId,
  onPaymentVerified,
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handlePayment() {
    if (!orderId || loading) {
      setMessage("Please select a valid order.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const loaded = await loadRazorpayScript();

      if (!loaded || !window.Razorpay) {
        throw new Error("Unable to load Razorpay Checkout.");
      }

      const paymentOrder = await prepareCheckout(orderId);

      if (
        !paymentOrder.razorpayOrderId ||
        !paymentOrder.keyId ||
        !paymentOrder.amount
      ) {
        throw new Error("Payment Service returned invalid order details.");
      }

      const checkout = new window.Razorpay({
        key: paymentOrder.keyId,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency || "INR",
        name: "CloudCart",
        description: `Order ${orderId}`,
        order_id: paymentOrder.razorpayOrderId,

        handler: async (result) => {
          setLoading(true);
          setMessage("Verifying payment with CloudCart...");

          try {
            const verified = await verifyCheckoutPayment({
              orderId: Number(orderId),
              razorpayOrderId: result.razorpay_order_id,
              razorpayPaymentId: result.razorpay_payment_id,
              razorpaySignature: result.razorpay_signature,
            });

            if (verified.status !== "PAID") {
              throw new Error(
                "Payment is not confirmed yet. Check your order status."
              );
            }

            setMessage("Payment verified successfully.");
            onPaymentVerified?.(verified);
          } catch (error) {
            setMessage(
              error.message || "Payment verification failed."
            );
          } finally {
            setLoading(false);
          }
        },

        modal: {
          ondismiss: () => {
            setMessage(
              "Checkout closed. Check your order status before retrying."
            );
          },
        },

        theme: { color: "#2563eb" },
      });

      checkout.on("payment.failed", (event) => {
        setMessage(
          event.error?.description || "Payment failed. Please try again."
        );
      });

      checkout.open();
    } catch (error) {
      setMessage(error.message || "Unable to start checkout.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handlePayment}
        disabled={loading}
        className="primary-button checkout-place-button"
      >
        {loading ? "Processing payment..." : "Pay with Razorpay"}
      </button>

      {message && <p role="status">{message}</p>}
    </div>
  );
}