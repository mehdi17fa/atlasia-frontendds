import React from 'react';
import { useCart } from '../context/CartContext';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';

const CartIcon = ({ onClick, className = "" }) => {
  const { getCartItemCount } = useCart();
  const itemCount = getCartItemCount();

  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center text-xs transition-colors duration-200 focus:outline-none ${className}`}
      aria-label={`Shopping cart with ${itemCount} items`}
      type="button"
    >
      <ShoppingCartIcon className="w-5 h-5 mb-1 stroke-current" />
      <span className="text-xs">Panier</span>
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-primary-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium text-[10px]">
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </button>
  );
};

export default CartIcon;
