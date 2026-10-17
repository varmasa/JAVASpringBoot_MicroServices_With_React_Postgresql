const API_BASE = '/api';

// Expected gateway route: GET /api/products
// The demo falls back to sample products until the Product Service is connected.
export async function getProducts() {
  try {
    const response = await fetch(`${API_BASE}/products`);
    if (!response.ok) throw new Error(`Product API returned ${response.status}`);
    const data = await response.json();
    return Array.isArray(data) ? data : (data.content ?? data.products ?? []);
  } catch (error) {
    console.warn('Product API unavailable; showing demo products.', error.message);
    return demoProducts;
  }
}

export const demoProducts = [
  { id: 101, name: 'Wireless Headphones', description: 'Everyday sound, all-day comfort.', price: 2499, category: 'Electronics', image: '🎧', stockQuantity: 24, rating: 4.8 },
  { id: 102, name: 'Smart Watch', description: 'Your activity and notifications at a glance.', price: 3999, category: 'Electronics', image: '⌚', stockQuantity: 18, rating: 4.6 },
  { id: 103, name: 'Everyday Backpack', description: 'A practical companion for work and travel.', price: 1799, category: 'Lifestyle', image: '🎒', stockQuantity: 35, rating: 4.5 },
  { id: 104, name: 'Running Shoes', description: 'Lightweight support for daily movement.', price: 2899, category: 'Fashion', image: '👟', stockQuantity: 12, rating: 4.7 },
  { id: 105, name: 'Insulated Bottle', description: 'Keep your drink ready wherever you go.', price: 699, category: 'Lifestyle', image: '🧴', stockQuantity: 50, rating: 4.4 },
  { id: 106, name: 'Desk Lamp', description: 'Warm, focused lighting for your workspace.', price: 1299, category: 'Home', image: '💡', stockQuantity: 20, rating: 4.3 },
  { id: 107, name: 'Mechanical Keyboard', description: 'A satisfying feel for work and play.', price: 3299, category: 'Electronics', image: '⌨️', stockQuantity: 15, rating: 4.7 },
  { id: 108, name: 'Ceramic Coffee Mug', description: 'A simple favourite for your morning ritual.', price: 399, category: 'Home', image: '☕', stockQuantity: 60, rating: 4.2 }
];
