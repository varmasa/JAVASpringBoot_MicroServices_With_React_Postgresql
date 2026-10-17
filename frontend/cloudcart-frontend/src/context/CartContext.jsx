import { createContext, useContext, useMemo, useState } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  function addItem(product) {
    setItems(current => {
      const existing = current.find(item => item.id === product.id);
      if (existing) {
        return current.map(item => item.id === product.id
          ? { ...item, quantity: Math.min(item.quantity + 1, product.stockQuantity ?? 99) }
          : item);
      }
      return [...current, { ...product, quantity: 1 }];
    });
  }

  function updateQuantity(id, quantity) {
    if (quantity < 1) return removeItem(id);
    setItems(current => current.map(item => item.id === id
      ? { ...item, quantity: Math.min(quantity, item.stockQuantity ?? 99) }
      : item));
  }

  function removeItem(id) {
    setItems(current => current.filter(item => item.id !== id));
  }

  function clearCart() { setItems([]); }

  const value = useMemo(() => ({
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    addItem, updateQuantity, removeItem, clearCart
  }), [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside CartProvider');
  return context;
}
