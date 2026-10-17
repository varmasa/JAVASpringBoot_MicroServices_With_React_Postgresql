import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

const CartContext = createContext(null);

const CART_API = 'http://localhost:8082/api/cart';
const PRODUCT_API = 'http://localhost:8081/api/products';



function getToken() {
  const token = localStorage.getItem('cloudcart_token');

  console.log(
    'CloudCart JWT status:',
    token ? 'Token found' : 'Token missing'
  );

  return token;
}



async function apiRequest(url, options = {}) {
  const token = getToken();

  if (!token) {
    throw new Error('Please log in before using your cart.');
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(
      message || `Request failed with status ${response.status}`
    );
  }

  if (response.status === 204) return null;

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

function mapCartItem(item, products = []) {
  const product = products.find(
    product => Number(product.id) === Number(item.productId)
  );

  return {
    ...product,
    id: item.productId,
    name: item.productName,
    price: Number(item.price),
    quantity: Number(item.quantity),
    stockQuantity: product?.stock ?? 99,
    imageUrl: product?.imageUrl,
    image: product?.image,
    category: product?.category,
  };
}

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadCart = useCallback(async () => {
    if (!getToken()) {
      setItems([]);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const [cart, products] = await Promise.all([
        apiRequest(CART_API),
        fetch(PRODUCT_API).then(response => {
          if (!response.ok) {
            throw new Error('Unable to load products.');
          }
          return response.json();
        }),
      ]);

      setItems(
        (cart?.items ?? []).map(item => mapCartItem(item, products))
      );
    } catch (err) {
      setError(err.message || 'Unable to load your cart.');
      console.error('Load cart failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const addItem = useCallback(async product => {
    setError('');

    try {
      await apiRequest(`${CART_API}/items`, {
        method: 'POST',
        body: JSON.stringify({
          productId: product.id,
          quantity: 1,
        }),
      });

      await loadCart();
    } catch (err) {
      setError(err.message || 'Unable to add the product.');
      throw err;
    }
  }, [loadCart]);

  const updateQuantity = useCallback(async (id, quantity) => {
    if (quantity < 1) {
      return removeItem(id);
    }

    setError('');

    try {
      await apiRequest(`${CART_API}/items/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ quantity }),
      });

      await loadCart();
    } catch (err) {
      setError(err.message || 'Unable to update quantity.');
      throw err;
    }
  }, [loadCart]);

  const removeItem = useCallback(async id => {
    setError('');

    try {
      await apiRequest(`${CART_API}/items/${id}`, {
        method: 'DELETE',
      });

      await loadCart();
    } catch (err) {
      setError(err.message || 'Unable to remove the product.');
      throw err;
    }
  }, [loadCart]);

  const clearCart = useCallback(async () => {
    setError('');

    try {
      await apiRequest(CART_API, { method: 'DELETE' });
      setItems([]);
    } catch (err) {
      setError(err.message || 'Unable to clear your cart.');
      throw err;
    }
  }, []);

  const value = useMemo(() => ({
    items,
    loading,
    error,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    ),
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    refreshCart: loadCart,
  }), [
    items,
    loading,
    error,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    loadCart,
  ]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error('useCart must be used inside CartProvider');
  }

  return context;
}