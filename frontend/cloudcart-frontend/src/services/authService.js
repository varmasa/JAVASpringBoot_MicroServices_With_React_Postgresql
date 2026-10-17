
const AUTH_API = import.meta.env.VITE_AUTH_API_URL;

async function request(endpoint, body) {
  const response = await fetch(`${AUTH_API}/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message || data.detail || `Request failed: ${response.status}`
    );
  }

  return data;
}

export function signup(name, email, password) {
  return request("signup", { name, email, password });
}

export async function signin(email, password) {
  const data = await request("signin", { email, password });

  localStorage.setItem("cloudcart_token", data.token);

  return data;
}

export async function getCurrentUser() {
  const token = localStorage.getItem("cloudcart_token");

  if (!token) {
    throw new Error("Please sign in first.");
  }

  const response = await fetch(`${AUTH_API}/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Request failed: ${response.status}`);
  }

  return data;
}

export function logout() {
  localStorage.removeItem("cloudcart_token");
}
