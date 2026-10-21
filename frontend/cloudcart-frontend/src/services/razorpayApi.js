
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const ORDER_API = `${API_BASE_URL}/api/orders`;

async function request(url, options = {}) {
  const token = localStorage.getItem("cloudcart_token");

  if (!token) {
    throw new Error("Please log in before making a payment.");
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message ||
      data.error ||
      `Payment request failed (${response.status})`
    );
  }

  return data;
}

export function prepareCheckout(orderId) {
  return request(
    `${ORDER_API}/${encodeURIComponent(orderId)}/payment`,
    { method: "POST" }
  );
}

export function verifyCheckoutPayment(payload) {
  return request(`${ORDER_API}/payment/verify`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}