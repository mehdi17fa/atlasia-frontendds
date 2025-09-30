import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../api';

const CartContext = createContext();

// localStorage key for cart persistence
const CART_STORAGE_KEY = 'atlasia_cart';

export const CartProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [cart, setCart] = useState({
    items: [],
    totalItems: 0,
    totalAmount: 0,
    expiresAt: null,
    lastUpdated: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helper function to save cart to localStorage
  const saveCartToStorage = useCallback((cartData) => {
    try {
      if (cartData && cartData.items && cartData.items.length > 0) {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({
          ...cartData,
          savedAt: new Date().toISOString()
        }));
      } else {
        localStorage.removeItem(CART_STORAGE_KEY);
      }
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, []);

  // Helper function to load cart from localStorage
  const loadCartFromStorage = useCallback(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        const cartData = JSON.parse(savedCart);
        // Check if cart is not expired (7 days)
        const savedAt = new Date(cartData.savedAt);
        const now = new Date();
        const daysDiff = (now - savedAt) / (1000 * 60 * 60 * 24);
        
        if (daysDiff < 7) {
          return cartData;
        } else {
          // Cart expired, remove from storage
          localStorage.removeItem(CART_STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
      localStorage.removeItem(CART_STORAGE_KEY);
    }
    return null;
  }, []);

  // Fetch cart from backend
  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      // Load from localStorage for non-authenticated users
      const localCart = loadCartFromStorage();
      if (localCart) {
        setCart(localCart);
      }
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.get('/api/cart');
      
      if (response.data.success) {
        setCart(response.data.cart);
        // Save to localStorage for offline access
        saveCartToStorage(response.data.cart);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      setError(error.response?.data?.message || 'Failed to fetch cart');
      
      // Fallback to localStorage
      const localCart = loadCartFromStorage();
      if (localCart) {
        setCart(localCart);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, loadCartFromStorage, saveCartToStorage]);

  // Add item to cart
  const addToCart = useCallback(async (itemData) => {
    try {
      setError(null);
      
      if (!isAuthenticated) {
        // For non-authenticated users, add to localStorage cart
        const localCart = loadCartFromStorage() || { items: [], totalItems: 0, totalAmount: 0 };
        
        // Check for conflicts
        const conflictingItem = localCart.items.find(item => 
          item.itemId === itemData.itemId &&
          item.itemType === itemData.itemType &&
          (
            (new Date(item.checkIn) < new Date(itemData.checkOut)) &&
            (new Date(item.checkOut) > new Date(itemData.checkIn))
          )
        );
        
        if (conflictingItem) {
          throw new Error('This item has conflicting dates with an existing cart item');
        }
        
        // Add item to local cart
        const newItem = {
          ...itemData,
          _id: Date.now().toString(), // Temporary ID
          itemSnapshot: itemData.itemSnapshot || {}
        };
        
        localCart.items.push(newItem);
        localCart.totalItems = localCart.items.length;
        localCart.totalAmount = localCart.items.reduce((total, item) => total + (item.subtotal || 0), 0);
        localCart.lastUpdated = new Date().toISOString();
        
        setCart(localCart);
        saveCartToStorage(localCart);
        
        return { success: true, message: 'Item added to cart' };
      }
      
      // For authenticated users, use API
      const response = await api.post('/api/cart/add', itemData);
      
      if (response.data.success) {
        setCart(response.data.cart);
        saveCartToStorage(response.data.cart);
        return response.data;
      }
      
      throw new Error(response.data.message || 'Failed to add item to cart');
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to add item to cart';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [isAuthenticated, loadCartFromStorage, saveCartToStorage]);

  // Update cart item
  const updateCartItem = useCallback(async (itemId, updates) => {
    try {
      setError(null);
      
      if (!isAuthenticated) {
        // Update localStorage cart
        const localCart = loadCartFromStorage() || { items: [], totalItems: 0, totalAmount: 0 };
        const itemIndex = localCart.items.findIndex(item => item._id === itemId);
        
        if (itemIndex === -1) {
          throw new Error('Item not found in cart');
        }
        
        // Update the item
        Object.assign(localCart.items[itemIndex], updates);
        
        // Recalculate totals if pricing changed
        if (updates.subtotal) {
          localCart.totalAmount = localCart.items.reduce((total, item) => total + (item.subtotal || 0), 0);
        }
        
        localCart.lastUpdated = new Date().toISOString();
        
        setCart(localCart);
        saveCartToStorage(localCart);
        
        return { success: true, message: 'Cart item updated' };
      }
      
      // For authenticated users, use API
      const response = await api.put(`/api/cart/item/${itemId}`, updates);
      
      if (response.data.success) {
        setCart(response.data.cart);
        saveCartToStorage(response.data.cart);
        return response.data;
      }
      
      throw new Error(response.data.message || 'Failed to update cart item');
      
    } catch (error) {
      console.error('Error updating cart item:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update cart item';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [isAuthenticated, loadCartFromStorage, saveCartToStorage]);

  // Remove item from cart
  const removeFromCart = useCallback(async (itemId) => {
    try {
      setError(null);
      
      if (!isAuthenticated) {
        // Remove from localStorage cart
        const localCart = loadCartFromStorage() || { items: [], totalItems: 0, totalAmount: 0 };
        localCart.items = localCart.items.filter(item => item._id !== itemId);
        localCart.totalItems = localCart.items.length;
        localCart.totalAmount = localCart.items.reduce((total, item) => total + (item.subtotal || 0), 0);
        localCart.lastUpdated = new Date().toISOString();
        
        setCart(localCart);
        saveCartToStorage(localCart);
        
        return { success: true, message: 'Item removed from cart' };
      }
      
      // For authenticated users, use API
      const response = await api.delete(`/api/cart/item/${itemId}`);
      
      if (response.data.success) {
        setCart(response.data.cart);
        saveCartToStorage(response.data.cart);
        return response.data;
      }
      
      throw new Error(response.data.message || 'Failed to remove item from cart');
      
    } catch (error) {
      console.error('Error removing from cart:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to remove item from cart';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [isAuthenticated, loadCartFromStorage, saveCartToStorage]);

  // Clear cart
  const clearCart = useCallback(async () => {
    try {
      setError(null);
      
      if (!isAuthenticated) {
        // Clear localStorage cart
        const emptyCart = { items: [], totalItems: 0, totalAmount: 0 };
        setCart(emptyCart);
        saveCartToStorage(emptyCart);
        
        return { success: true, message: 'Cart cleared' };
      }
      
      // For authenticated users, use API
      const response = await api.delete('/api/cart/clear');
      
      if (response.data.success) {
        setCart(response.data.cart);
        saveCartToStorage(response.data.cart);
        return response.data;
      }
      
      throw new Error(response.data.message || 'Failed to clear cart');
      
    } catch (error) {
      console.error('Error clearing cart:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to clear cart';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [isAuthenticated, saveCartToStorage]);

  // Checkout cart
  const checkoutCart = useCallback(async (guestMessage = '') => {
    try {
      setError(null);
      
      if (!isAuthenticated) {
        throw new Error('Please log in to checkout');
      }
      
      setIsLoading(true);
      
      const response = await api.post('/api/cart/checkout', { guestMessage });
      
      if (response.data.success) {
        // Clear cart after successful checkout
        await clearCart();
        return response.data;
      }
      
      throw new Error(response.data.message || 'Checkout failed');
      
    } catch (error) {
      console.error('Error during checkout:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Checkout failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, clearCart]);

  // Sync local cart with backend when user logs in
  const syncCartWithBackend = useCallback(async () => {
    if (!isAuthenticated) return;
    
    const localCart = loadCartFromStorage();
    if (!localCart || localCart.items.length === 0) {
      // No local cart, just fetch from backend
      await fetchCart();
      return;
    }
    
    try {
      // Try to add each local item to backend cart
      for (const item of localCart.items) {
        try {
          await api.post('/api/cart/add', {
            itemType: item.itemType,
            itemId: item.itemId,
            checkIn: item.checkIn,
            checkOut: item.checkOut,
            guests: item.guests,
            guestMessage: item.guestMessage
          });
        } catch (itemError) {
          console.warn('Failed to sync cart item:', itemError.message);
        }
      }
      
      // Fetch updated cart from backend
      await fetchCart();
      
    } catch (error) {
      console.error('Error syncing cart:', error);
      // Fallback to fetching from backend
      await fetchCart();
    }
  }, [isAuthenticated, loadCartFromStorage, fetchCart]);

  // Initialize cart when component mounts or auth state changes
  useEffect(() => {
    if (isAuthenticated && user) {
      // User is logged in, sync cart
      syncCartWithBackend();
    } else {
      // User is not logged in, load from localStorage
      const localCart = loadCartFromStorage();
      if (localCart) {
        setCart(localCart);
      }
    }
  }, [isAuthenticated, user, syncCartWithBackend, loadCartFromStorage]);

  // Auto-save cart to localStorage whenever cart changes
  useEffect(() => {
    if (cart.items && cart.items.length > 0) {
      saveCartToStorage(cart);
    }
  }, [cart, saveCartToStorage]);

  const value = {
    // Cart state
    cart,
    isLoading,
    error,
    
    // Cart actions
    fetchCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    checkoutCart,
    syncCartWithBackend,
    
    // Utility functions
    isCartEmpty: cart.items.length === 0,
    getCartItemCount: () => cart.totalItems || cart.items.length,
    getCartTotal: () => cart.totalAmount || cart.items.reduce((total, item) => total + (item.subtotal || 0), 0)
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
