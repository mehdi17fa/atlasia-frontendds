import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { XMarkIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';
import CartItem from './CartItem';

const CartModal = ({ isOpen, onClose }) => {
  const { 
    cart, 
    isLoading, 
    error, 
    removeFromCart, 
    updateCartItem, 
    clearCart, 
    isCartEmpty,
    getCartTotal 
  } = useCart();
  
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleRemoveItem = async (itemId) => {
    try {
      await removeFromCart(itemId);
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  const handleUpdateItem = async (itemId, updates) => {
    try {
      await updateCartItem(itemId, updates);
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  const handleClearCart = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir vider votre panier ?')) {
      try {
        await clearCart();
      } catch (error) {
        console.error('Error clearing cart:', error);
      }
    }
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      // Redirect to login with return URL
      navigate('/login?returnUrl=' + encodeURIComponent(window.location.pathname));
      return;
    }

    // Close modal and navigate to checkout page
    onClose();
    navigate('/cart/checkout');
  };

  const handleContinueShopping = () => {
    onClose();
    navigate('/packages');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl transform transition-transform">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <ShoppingBagIcon className="h-6 w-6 text-primary-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Mon Panier
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : isCartEmpty ? (
              <div className="flex flex-col items-center justify-center h-64 p-6 text-center">
                <ShoppingBagIcon className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Votre panier est vide
                </h3>
                <p className="text-gray-500 mb-6">
                  Ajoutez des propriétés ou des packages pour commencer
                </p>
                <button
                  onClick={handleContinueShopping}
                  className="bg-primary-500 text-white px-6 py-2 rounded-lg hover:bg-primary-600 transition-colors"
                >
                  Explorer les packages
                </button>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                {cart.items?.map((item) => (
                  <CartItem
                    key={item._id}
                    item={item}
                    onEdit={handleUpdateItem}
                    onRemove={handleRemoveItem}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {!isCartEmpty && (
            <div className="border-t border-gray-200 p-6 space-y-4">
              {/* Total */}
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-gray-900">
                  Total:
                </span>
                <span className="text-xl font-bold text-primary-600">
                  {getCartTotal()} MAD
                </span>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <button
                  onClick={handleCheckout}
                  className="w-full bg-primary-500 text-white py-3 rounded-lg hover:bg-primary-600 transition-colors font-medium"
                >
                  Passer la commande
                </button>
                
                <div className="flex space-x-3">
                  <button
                    onClick={handleClearCart}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Vider le panier
                  </button>
                  <button
                    onClick={handleContinueShopping}
                    className="flex-1 bg-primary-100 text-primary-700 py-2 rounded-lg hover:bg-primary-200 transition-colors"
                  >
                    Continuer
                  </button>
                </div>
              </div>

              {/* Login Prompt */}
              {!isAuthenticated && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <p className="text-sm text-yellow-800">
                    <span className="font-medium">Connexion requise:</span> Vous devez vous connecter pour passer commande.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartModal;
