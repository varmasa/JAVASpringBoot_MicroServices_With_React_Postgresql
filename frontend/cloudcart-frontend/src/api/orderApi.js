const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const ORDER_API = `${API_BASE_URL}/api/orders`;

export default ORDER_API;

function getToken() {
  return localStorage.getItem('cloudcart_token');
}

async function orderRequest(path, options = {}) {
  const token = getToken();

  if (!token) {
    throw new Error('Please log in before placing an order.');
  }

  const response = await fetch(`${ORDER_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });

  const text = await response.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    const message =
      data?.error ||
      data?.message ||
      (response.status === 401
        ? 'Your session is invalid or expired. Please log in again.'
        : response.status === 403
          ? 'You do not have permission to perform this action.'
          : `Order request failed (${response.status}).`);

    throw new Error(message);
  }

  return data;
}

export function checkoutOrder() {
  return orderRequest('/checkout', { method: 'POST' });
}

export function getMyOrders() {
  return orderRequest('');
}

export function getMyOrder(orderId) {
  return orderRequest(`/${encodeURIComponent(orderId)}`);
}