import React, { createContext, useState, useContext, useEffect } from 'react';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [cartRestaurant, setCartRestaurant] = useState(() => {
    const saved = localStorage.getItem('cartRestaurant');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
    localStorage.setItem('cartRestaurant', JSON.stringify(cartRestaurant));
  }, [cartItems, cartRestaurant]);

  const addToCart = (item, restaurant) => {
    if (cartRestaurant && cartRestaurant._id !== restaurant._id) {
      if (!window.confirm('Adding items from a different restaurant will clear your current cart. Continue?')) {
        return;
      }
      setCartItems([{ ...item, quantity: 1 }]);
      setCartRestaurant(restaurant);
      return;
    }

    setCartRestaurant(restaurant);
    setCartItems(prev => {
      const existing = prev.find(i => i._id === item._id);
      if (existing) {
        return prev.map(i => i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId) => {
    setCartItems(prev => {
      const updated = prev.filter(i => i._id !== itemId);
      if (updated.length === 0) {
        setCartRestaurant(null);
      }
      return updated;
    });
  };

  const updateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCartItems(prev => prev.map(i => i._id === itemId ? { ...i, quantity } : i));
  };

  const clearCart = () => {
    setCartItems([]);
    setCartRestaurant(null);
  };

  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cartItems, cartRestaurant, addToCart, removeFromCart,
      updateQuantity, clearCart, cartTotal, cartCount
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
