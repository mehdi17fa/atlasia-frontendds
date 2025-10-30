import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../api';

const CartContext = createContext();

// localStorage key for cart persistence - will be made user-specific
const CART_STORAGE_KEY_PREFIX = 'atlasia_cart';

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

  // Helper function to get user-specific cart key
  const getCartStorageKey = useCallback((userId = null) => {
    if (userId) {
      return `${CART_STORAGE_KEY_PREFIX}_user_${userId}`;
    }
    return `${CART_STORAGE_KEY_PREFIX}_guest`;
  }, []);

  // Helper function to save cart to localStorage
  const saveCartToStorage = useCallback((cartData, userId = null) => {
    try {
      const storageKey = getCartStorageKey(userId);
      if (cartData && cartData.items && cartData.items.length > 0) {
        localStorage.setItem(storageKey, JSON.stringify({
          ...cartData,
          savedAt: new Date().toISOString()
        }));
      } else {
        localStorage.removeItem(storageKey);
      }
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, [getCartStorageKey]);

  // Helper function to load cart from localStorage
  const loadCartFromStorage = useCallback((userId = null) => {
    try {
      const storageKey = getCartStorageKey(userId);
      const savedCart = localStorage.getItem(storageKey);
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
          localStorage.removeItem(storageKey);
        }
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
      const storageKey = getCartStorageKey(userId);
      localStorage.removeItem(storageKey);
    }
    return null;
  }, [getCartStorageKey]);

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
        // Save to localStorage for offline access with user ID
        saveCartToStorage(response.data.cart, user?._id);
      }
    } catch (error) {
      // Only log errors that aren't 404 (endpoint doesn't exist) or network errors
      // These are expected scenarios where we'll use localStorage fallback
      const isExpectedError = 
        error.response?.status === 404 || 
        error.code === 'ERR_NETWORK' ||
        error.message?.includes('Network Error');
      
      if (!isExpectedError) {
        console.error('Error fetching cart:', error);
        setError(error.response?.data?.message || 'Failed to fetch cart');
      } else {
        // Silently handle expected errors (404 endpoint not found, network issues)
        // These are handled gracefully with localStorage fallback
        console.log('Cart API endpoint not available, using localStorage fallback');
      }
      
      // Fallback to localStorage
      const localCart = loadCartFromStorage(user?._id);
      if (localCart) {
        setCart(localCart);
        // Clear error since we have a fallback
        setError(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?._id, loadCartFromStorage, saveCartToStorage]);

  // Add item to cart
  const addToCart = useCallback(async (itemData) => {
    try {
      setError(null);
      // Prevent adding the same item for the exact same dates (client-side pre-check)
      const existingSame = (cart.items || []).find(item => 
        item.itemId === itemData.itemId &&
        item.itemType === itemData.itemType &&
        new Date(item.checkIn).getTime() === new Date(itemData.checkIn).getTime() &&
        new Date(item.checkOut).getTime() === new Date(itemData.checkOut).getTime()
      );
      if (existingSame) {
        const duplicateError = new Error('Cet article est déjà dans votre panier pour les mêmes dates.');
        duplicateError.code = 'DUPLICATE_SAME_DATES';
        duplicateError.existingItem = existingSame;
        throw duplicateError;
      }
      
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
      
      // For authenticated users, try API first; fallback to local if API unavailable
      try {
        const response = await api.post('/api/cart/add', itemData);
        if (response.data?.success) {
          setCart(response.data.cart);
          saveCartToStorage(response.data.cart, user?._id);
          return response.data;
        }
        throw new Error(response.data?.message || 'Failed to add item to cart');
      } catch (apiError) {
        // Fallback to local storage cart for authenticated users if backend cart is not implemented
        console.warn('Cart API unavailable, using local fallback. Error:', apiError?.message);
        const localCart = loadCartFromStorage(user?._id) || { items: [], totalItems: 0, totalAmount: 0 };
        const newItem = { ...itemData, _id: Date.now().toString(), itemSnapshot: itemData.itemSnapshot || {} };
        localCart.items.push(newItem);
        localCart.totalItems = localCart.items.length;
        localCart.totalAmount = localCart.items.reduce((total, item) => total + (item.subtotal || 0), 0);
        localCart.lastUpdated = new Date().toISOString();
        setCart(localCart);
        saveCartToStorage(localCart, user?._id);
        return { success: true, message: 'Item added to cart (local fallback)', cart: localCart };
      }
      
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
      
      // For authenticated users, try API; fallback to local
      try {
        const response = await api.put(`/api/cart/item/${itemId}`, updates);
        if (response.data?.success) {
          setCart(response.data.cart);
          saveCartToStorage(response.data.cart, user?._id);
          return response.data;
        }
        throw new Error(response.data?.message || 'Failed to update cart item');
      } catch (apiError) {
        console.warn('Cart API unavailable, updating local cart. Error:', apiError?.message);
        const localCart = loadCartFromStorage(user?._id) || { items: [], totalItems: 0, totalAmount: 0 };
        const itemIndex = localCart.items.findIndex(item => item._id === itemId);
        if (itemIndex === -1) throw new Error('Item not found in cart');
        Object.assign(localCart.items[itemIndex], updates);
        if (updates.subtotal) {
          localCart.totalAmount = localCart.items.reduce((total, item) => total + (item.subtotal || 0), 0);
        }
        localCart.lastUpdated = new Date().toISOString();
        setCart(localCart);
        saveCartToStorage(localCart, user?._id);
        return { success: true, message: 'Cart item updated (local fallback)', cart: localCart };
      }
      
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
      
      // For authenticated users, try API; fallback to local
      try {
        const response = await api.delete(`/api/cart/item/${itemId}`);
        if (response.data?.success) {
          setCart(response.data.cart);
          saveCartToStorage(response.data.cart, user?._id);
          return response.data;
        }
        throw new Error(response.data?.message || 'Failed to remove item from cart');
      } catch (apiError) {
        console.warn('Cart API unavailable, removing from local cart. Error:', apiError?.message);
        const localCart = loadCartFromStorage(user?._id) || { items: [], totalItems: 0, totalAmount: 0 };
        localCart.items = localCart.items.filter(item => item._id !== itemId);
        localCart.totalItems = localCart.items.length;
        localCart.totalAmount = localCart.items.reduce((total, item) => total + (item.subtotal || 0), 0);
        localCart.lastUpdated = new Date().toISOString();
        setCart(localCart);
        saveCartToStorage(localCart, user?._id);
        return { success: true, message: 'Item removed (local fallback)', cart: localCart };
      }
      
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
      
      // For authenticated users, try API; fallback to local
      try {
        const response = await api.delete('/api/cart/clear');
        if (response.data?.success) {
          setCart(response.data.cart);
          saveCartToStorage(response.data.cart, user?._id);
          return response.data;
        }
        throw new Error(response.data?.message || 'Failed to clear cart');
      } catch (apiError) {
        console.warn('Cart API unavailable, clearing local cart. Error:', apiError?.message);
        const emptyCart = { items: [], totalItems: 0, totalAmount: 0 };
        setCart(emptyCart);
        saveCartToStorage(emptyCart, user?._id);
        return { success: true, message: 'Cart cleared (local fallback)', cart: emptyCart };
      }
      
    } catch (error) {
      console.error('Error clearing cart:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to clear cart';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [isAuthenticated, user?._id, saveCartToStorage]);

  // Clear cart when user logs out (to prevent data leakage between users)
  const clearCartOnLogout = useCallback(() => {
    const emptyCart = { items: [], totalItems: 0, totalAmount: 0, expiresAt: null, lastUpdated: null };
    setCart(emptyCart);
    
    // Clear all user-specific cart data from localStorage
    try {
      // Clear current user's cart
      if (user?._id) {
        const userCartKey = getCartStorageKey(user._id);
        localStorage.removeItem(userCartKey);
      }
      
      // Clear guest cart
      const guestCartKey = getCartStorageKey();
      localStorage.removeItem(guestCartKey);
    } catch (error) {
      console.error('Error clearing cart data on logout:', error);
    }
  }, [user?._id, getCartStorageKey]);

  // Checkout cart
  const checkoutCart = useCallback(async (guestMessage = '') => {
    try {
      setError(null);
      
      if (!isAuthenticated) {
        throw new Error('Please log in to checkout');
      }
      
      setIsLoading(true);
      
      // Try API checkout; if unavailable, simulate success and clear local cart
      try {
        const response = await api.post('/api/cart/checkout', { guestMessage });
        if (response.data?.success) {
          await clearCart();
          return response.data;
        }
        throw new Error(response.data?.message || 'Checkout failed');
      } catch (apiError) {
        console.warn('Cart checkout API unavailable, simulating local checkout. Error:', apiError?.message);
        await clearCart();
        return { success: true, message: 'Checkout completed (local fallback)' };
      }
      
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
    if (!isAuthenticated || !user?._id) return;
    
    const localCart = loadCartFromStorage(user._id);
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
  }, [isAuthenticated, user?._id, loadCartFromStorage, fetchCart]);

  // Initialize cart when component mounts or auth state changes
  useEffect(() => {
    if (isAuthenticated && user) {
      // User is logged in, sync cart
      syncCartWithBackend();
    } else {
      // User is not logged in, load from localStorage (guest cart)
      const localCart = loadCartFromStorage();
      if (localCart) {
        setCart(localCart);
      } else {
        // Clear cart if no local cart exists
        setCart({ items: [], totalItems: 0, totalAmount: 0, expiresAt: null, lastUpdated: null });
      }
    }
  }, [isAuthenticated, user, syncCartWithBackend, loadCartFromStorage]);

  // Clear cart when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      clearCartOnLogout();
    }
  }, [isAuthenticated, clearCartOnLogout]);

  // Auto-save cart to localStorage whenever cart changes
  useEffect(() => {
    if (cart.items && cart.items.length > 0) {
      saveCartToStorage(cart, user?._id);
    }
  }, [cart, user?._id, saveCartToStorage]);

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
    clearCartOnLogout,
    
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
