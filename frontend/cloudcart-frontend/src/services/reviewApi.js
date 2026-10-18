
const REVIEW_API =
  import.meta.env.VITE_REVIEW_API_URL ||
  "http://localhost:8085/api/reviews";

function getToken() {
  return localStorage.getItem("cloudcart_token");
}

async function request(url, options = {}) {
  const token = getToken();

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (response.status === 204) {
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }
    return null;
  }

  const responseText = await response.text();
  let data = null;

  if (responseText) {
    try {
      data = JSON.parse(responseText);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const message =
      data?.message ||
      data?.detail ||
      data?.reason ||
      (typeof data === "string" ? data : null) ||
      `Request failed with status ${response.status}`;

    throw new Error(message);
  }

  // Also handle APIs that return plain text.
  return data ?? responseText;
}

export function getProductReviews(productId) {
  return request(`${REVIEW_API}/product/${productId}`);
}

export function getReviewSummary(productId) {
  return request(`${REVIEW_API}/product/${productId}/summary`);
}

export function createReview({ productId, rating, comment }) {
  if (!getToken()) {
    throw new Error("Please log in to submit a review.");
  }

  return request(REVIEW_API, {
    method: "POST",
    body: JSON.stringify({
      productId,
      rating,
      comment,
    }),
  });
}

export function updateReview(reviewId, { productId, rating, comment }) {
  if (!getToken()) {
    throw new Error("Please log in to update your review.");
  }

  return request(`${REVIEW_API}/${reviewId}`, {
    method: "PUT",
    body: JSON.stringify({
      productId,
      rating,
      comment,
    }),
  });
}

export function deleteReview(reviewId) {
  if (!getToken()) {
    throw new Error("Please log in to delete your review.");
  }

  return request(`${REVIEW_API}/${reviewId}`, {
    method: "DELETE",
  });
}