import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';
import DateRangeCalendar from './DateRangeCalendar';
import { api } from '../api';

const AddToCartButton = ({ 
  itemType, // 'property' or 'package'
  itemId,
  itemData, // Property or Package data
  checkIn,
  checkOut,
  guests = 1,
  guestMessage = '',
  className = '',
  size = 'medium', // 'small', 'medium', 'large'
  showText = true,
  disabled = false
}) => {
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      // Redirect to login with return URL
      navigate('/login?returnUrl=' + encodeURIComponent(window.location.pathname));
      return;
    }

    if (!checkIn || !checkOut) {
      setError('Veuillez sélectionner des dates');
      return;
    }

    setIsAdding(true);
    setError('');

    try {
      // Prepare item snapshot
      let itemSnapshot = {};
      
      if (itemType === 'property') {
        itemSnapshot = {
          name: itemData?.title || 'Propriété',
          description: itemData?.description || '',
          thumbnail: itemData?.photos?.[0] || '',
          location: itemData?.localisation ? 
            `${itemData.localisation.city}, ${itemData.localisation.address}` : 
            'Localisation non disponible',
          owner: itemData?.owner
        };
      } else if (itemType === 'package') {
        itemSnapshot = {
          name: itemData?.name || 'Package',
          description: itemData?.description || '',
          thumbnail: itemData?.restaurants?.[0]?.thumbnail || 
                    itemData?.activities?.[0]?.thumbnail || 
                    itemData?.services?.[0]?.thumbnail || '',
          location: itemData?.property?.localisation?.city || 'Package Location',
          partner: itemData?.partner
        };
      }

      await addToCart({
        itemType,
        itemId,
        checkIn: new Date(checkIn).toISOString(),
        checkOut: new Date(checkOut).toISOString(),
        guests: parseInt(guests),
        guestMessage,
        itemSnapshot
      });

      // Show success feedback
      const button = document.activeElement;
      if (button) {
        button.classList.add('bg-green-500');
        setTimeout(() => {
          button.classList.remove('bg-green-500');
        }, 1000);
      }

    } catch (error) {
      console.error('Error adding to cart:', error);
      if (error.code === 'DUPLICATE_SAME_DATES') {
        setShowCalendar(true);
        setError("Ces dates sont déjà dans votre panier. Choisissez une autre période.");
      } else {
        setError(error.message || 'Erreur lors de l\'ajout au panier');
      }
    } finally {
      setIsAdding(false);
    }
  };

  const fetchAvailability = async () => {
    try {
      if (itemType !== 'property') return [];
      const res = await api.get(`/api/property/${itemId}/availability`);
      return (res?.data?.unavailableDates || []).map(d => new Date(d).toISOString());
    } catch (e) {
      return [];
    }
  };

  const onApplyDates = async (startIso, endIso) => {
    setShowCalendar(false);
    setError('');
    // retry add with new dates
    setIsAdding(true);
    try {
      await addToCart({
        itemType,
        itemId,
        checkIn: startIso,
        checkOut: endIso,
        guests: parseInt(guests),
        guestMessage,
        itemSnapshot: itemData ? {
          name: itemData?.title || itemData?.name || 'Article',
          description: itemData?.description || '',
          thumbnail: itemData?.photos?.[0] || itemData?.restaurants?.[0]?.thumbnail || '',
          location: itemData?.localisation?.city || itemData?.property?.localisation?.city || 'Localisation',
        } : {}
      });
    } catch (e) {
      setError(e.message || 'Erreur lors de l\'ajout au panier');
    } finally {
      setIsAdding(false);
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'px-3 py-2.5 text-sm';
      case 'large':
        return 'px-8 py-4 text-lg';
      default:
        return 'px-4 py-2 text-base';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 'h-4 w-4';
      case 'large':
        return 'h-6 w-6';
      default:
        return 'h-5 w-5';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleAddToCart}
        disabled={disabled || isAdding || !checkIn || !checkOut}
        className={`
          inline-flex items-center space-x-2 
          ${getSizeClasses()}
          bg-primary-500 text-white 
          rounded-lg hover:bg-primary-600 
          transition-colors duration-200
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          ${isAdding ? 'animate-pulse' : ''}
          ${className}
        `}
      >
        {isAdding ? (
          <>
            <div className={`${getIconSize()} animate-spin rounded-full border-2 border-white border-t-transparent`} />
            <span>Ajout...</span>
          </>
        ) : (
          <>
            <ShoppingCartIcon className={getIconSize()} />
            {showText && <span>Ajouter au panier</span>}
          </>
        )}
      </button>
      
      {error && (
        <p className="absolute left-0 top-full mt-1 text-sm text-red-600 whitespace-nowrap z-10 bg-white px-2 py-1 rounded shadow-md">
          {error}
        </p>
      )}
      
      {!isAuthenticated && (
        <p className="absolute left-0 top-full mt-1 text-xs text-gray-500 whitespace-nowrap z-10 bg-white px-2 py-1 rounded shadow-sm">
          Connexion requise pour ajouter au panier
        </p>
      )}

      {showCalendar && (
        <div className="absolute z-20 mt-2">
          <DateRangeCalendar
            title="Choisir de nouvelles dates"
            initialCheckIn={checkIn}
            initialCheckOut={checkOut}
            fetchAvailability={fetchAvailability}
            onApply={onApplyDates}
            onClose={() => setShowCalendar(false)}
          />
        </div>
      )}
    </div>
  );
};

export default AddToCartButton;
