import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CartContext = createContext({});

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [restaurant, setRestaurant] = useState(null);

  useEffect(() => {
    loadCart();
  }, []);

  useEffect(() => {
    saveCart();
  }, [cart, restaurant]);

  const loadCart = async () => {
    try {
      const cartData = await AsyncStorage.getItem('cart');
      const restaurantData = await AsyncStorage.getItem('cartRestaurant');
      
      if (cartData) {
        setCart(JSON.parse(cartData));
      }
      if (restaurantData) {
        setRestaurant(JSON.parse(restaurantData));
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    }
  };

  const saveCart = async () => {
    try {
      await AsyncStorage.setItem('cart', JSON.stringify(cart));
      if (restaurant) {
        await AsyncStorage.setItem('cartRestaurant', JSON.stringify(restaurant));
      } else {
        await AsyncStorage.removeItem('cartRestaurant');
      }
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  };

  const addToCart = (item, restaurantData) => {
    // Check if cart has items from different restaurant
    if (restaurant && restaurant._id !== restaurantData._id) {
      return {
        success: false,
        message: 'Cart contains items from another restaurant',
        needsClear: true,
      };
    }

    const existingItem = cart.find((i) => i._id === item._id);
    
    if (existingItem) {
      setCart(cart.map((i) => 
        i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i
      ));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
    
    setRestaurant(restaurantData);
    return { success: true };
  };

  const removeFromCart = (itemId) => {
    const updatedCart = cart.filter((i) => i._id !== itemId);
    setCart(updatedCart);
    
    if (updatedCart.length === 0) {
      setRestaurant(null);
    }
  };

  const updateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
    } else {
      setCart(cart.map((i) => 
        i._id === itemId ? { ...i, quantity } : i
      ));
    }
  };

  const clearCart = async () => {
    setCart([]);
    setRestaurant(null);
    await AsyncStorage.removeItem('cart');
    await AsyncStorage.removeItem('cartRestaurant');
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getCartCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        restaurant,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal: getCartTotal(),
        cartCount: getCartCount(),
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};
