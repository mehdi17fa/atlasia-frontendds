import React from 'react';
import { useCart } from '../context/CartContext';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';

const CartIcon = ({ onClick, className = "" }) => {
  const { getCartItemCount } = useCart();
  const itemCount = getCartItemCount();

  return (
    <button
      onClick={onClick}
      className={`relative inline-flex md:flex-row flex-col items-center justify-center md:px-4 px-3 md:py-2 py-2 rounded-lg text-gray-600 hover:text-green-700 hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600 ${className}`}
      aria-label={`Shopping cart with ${itemCount} items`}
      type="button"
      title="Panier"
    >
      <span className="relative inline-flex items-center justify-center">
        <ShoppingCartIcon className="w-6 h-6 md:mb-0 mb-1 stroke-current" />
        {itemCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-green-600 text-white rounded-full h-5 w-5 flex items-center justify-center font-semibold text-[10px] ring-2 ring-white shadow">
            {itemCount > 99 ? '99+' : itemCount}
          </span>
        )}
      </span>
      <span className="md:ml-3 text-[11px] md:text-xs font-medium">Panier</span>
    </button>
  );
};

export default CartIcon;
