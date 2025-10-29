import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { api } from '../../api';
import { useAuth } from '../../hooks/useAuth';
import S3Image from '../../components/S3Image';
import DateRangeCalendar from '../../components/DateRangeCalendar';

export default function CartCheckout() {
  const navigate = useNavigate();
  const { cart, isLoading, removeFromCart, updateCartItem, checkoutCart, clearCart, getCartTotal, isCartEmpty } = useCart();
  const { isAuthenticated } = useAuth();
  
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: ''
  });
  const [guestMessage, setGuestMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({
    paymentMethod: false,
    cardDetails: false
  });
  
  // Edit mode for cart items
  const [editingItemId, setEditingItemId] = useState(null);
  const [editValues, setEditValues] = useState({
    checkIn: '',
    checkOut: '',
    guests: 1
  });
  const [calendarItemId, setCalendarItemId] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?returnUrl=' + encodeURIComponent(window.location.pathname));
      return;
    }
    
    if (isCartEmpty && !isLoading) {
      navigate('/');
    }
  }, [isAuthenticated, isCartEmpty, isLoading, navigate]);

  const handleGoBack = () => {
    navigate(-1);
  };

  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
    setFieldErrors(prev => ({ ...prev, paymentMethod: false }));
  };

  const formatCardNumber = (value) => {
    const cleaned = value.replace(/\s/g, '');
    const formatted = cleaned.replace(/(\d{4})/g, '$1 ').trim();
    return formatted.substring(0, 19);
  };

  const formatExpiryDate = (value) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
    }
    return cleaned;
  };

  const handleCardDetailsChange = (field, value) => {
    let formattedValue = value;
    
    if (field === 'cardNumber') {
      formattedValue = formatCardNumber(value);
    } else if (field === 'expiryDate') {
      formattedValue = formatExpiryDate(value);
    } else if (field === 'cvv') {
      formattedValue = value.replace(/\D/g, '').substring(0, 4);
    }
    
    setCardDetails(prev => ({ ...prev, [field]: formattedValue }));
    setFieldErrors(prev => ({ ...prev, cardDetails: false }));
  };

  const handleRemoveItem = async (itemId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) {
      try {
        await removeFromCart(itemId);
      } catch (error) {
        console.error('Error removing item:', error);
        setError('Erreur lors de la suppression de l\'article');
      }
    }
  };

  const handleEditItem = (item) => {
    setEditingItemId(item._id);
    setEditValues({
      checkIn: new Date(item.checkIn).toISOString().split('T')[0],
      checkOut: new Date(item.checkOut).toISOString().split('T')[0],
      guests: item.guests
    });
  };

  const handleSaveEdit = async (itemId) => {
    try {
      await updateCartItem(itemId, {
        checkIn: new Date(editValues.checkIn).toISOString(),
        checkOut: new Date(editValues.checkOut).toISOString(),
        guests: parseInt(editValues.guests)
      });
      setEditingItemId(null);
    } catch (error) {
      console.error('Error updating item:', error);
      setError('Erreur lors de la mise à jour de l\'article');
    }
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setEditValues({ checkIn: '', checkOut: '', guests: 1 });
  };

  const applyCalendarDates = (startIso, endIso) => {
    const toYMD = (iso) => {
      const d = new Date(iso);
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };
    setEditValues(prev => ({ ...prev, checkIn: toYMD(startIso), checkOut: toYMD(endIso) }));
    setCalendarItemId(null);
  };

  const validateForm = () => {
    let hasErrors = false;
    const newFieldErrors = { ...fieldErrors };

    if (!paymentMethod) {
      newFieldErrors.paymentMethod = true;
      hasErrors = true;
    }

    if (paymentMethod === 'card') {
      if (!cardDetails.cardNumber.trim() || !cardDetails.expiryDate.trim() || 
          !cardDetails.cvv.trim() || !cardDetails.cardholderName.trim()) {
        newFieldErrors.cardDetails = true;
        hasErrors = true;
      } else {
        const cardNumberDigits = cardDetails.cardNumber.replace(/\s/g, '');
        if (cardNumberDigits.length !== 16) {
          newFieldErrors.cardDetails = true;
          hasErrors = true;
        }
        if (!/^\d{2}\/\d{2}$/.test(cardDetails.expiryDate)) {
          newFieldErrors.cardDetails = true;
          hasErrors = true;
        }
        if (!/^\d{3,4}$/.test(cardDetails.cvv)) {
          newFieldErrors.cardDetails = true;
          hasErrors = true;
        }
      }
    }

    setFieldErrors(newFieldErrors);
    
    if (hasErrors) {
      setError('Veuillez corriger les champs marqués en rouge avant de continuer.');
      return false;
    }

    return true;
  };

  const handleCheckout = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Build payload from current cart items so backend can create bookings
      const payload = {
        guestMessage,
        paymentMethod,
        items: (cart.items || []).map(it => ({
          itemType: it.itemType,
          itemId: it.itemId,
          checkIn: it.checkIn,
          checkOut: it.checkOut,
          guests: it.guests
        }))
      };

      const response = await api.post('/api/cart/checkout', payload);
      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Checkout failed');
      }

      // Clear cart locally after successful server checkout
      await clearCart();

      navigate('/cart/checkout-confirmation', {
        state: { checkoutResult: response.data }
      });
    } catch (error) {
      console.error('Checkout error:', error);
      setError(error?.response?.data?.message || error.message || 'Erreur lors de la commande');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handleGoBack}
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Retour
            </button>
            <h1 className="text-2xl font-bold text-gray-800">
              Paiement
            </h1>
            <div className="w-16"></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 pb-20 lg:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Section - Payment Form */}
          <div className="space-y-6">
            <div className="sticky top-4 space-y-6">
            {error && (
              <div className="bg-red-100 text-red-700 p-4 rounded-lg">{error}</div>
            )}

            {/* Payment Section */}
            <div className={`bg-white p-6 rounded-lg shadow-sm ${fieldErrors.paymentMethod ? 'border-2 border-red-500' : ''}`}>
              <h2 className={`text-xl font-semibold mb-4 ${fieldErrors.paymentMethod ? 'text-red-600' : 'text-gray-800'}`}>
                Méthode de paiement {fieldErrors.paymentMethod && <span className="text-red-500">*</span>}
              </h2>
              
              {/* Payment Method Selection */}
              <div className="space-y-3 mb-6">
                <div 
                  className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    paymentMethod === 'card' 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`} 
                  onClick={() => handlePaymentMethodChange('card')}
                >
                  <input
                    type="radio"
                    id="card"
                    name="paymentMethod"
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={(e) => handlePaymentMethodChange(e.target.value)}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                  />
                  <label htmlFor="card" className="ml-3 flex items-center cursor-pointer">
                    <svg className={`w-5 h-5 mr-2 ${paymentMethod === 'card' ? 'text-green-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <span className={`font-medium ${paymentMethod === 'card' ? 'text-green-800' : 'text-gray-700'}`}>
                      Paiement par carte
                    </span>
                  </label>
                </div>
              </div>

              {/* Card Details Form */}
              {paymentMethod === 'card' && (
                <div className={`border-t pt-6 ${fieldErrors.cardDetails ? 'border-red-200' : ''}`}>
                  <h3 className={`text-lg font-medium mb-4 ${fieldErrors.cardDetails ? 'text-red-600' : 'text-gray-800'}`}>
                    Détails de la carte {fieldErrors.cardDetails && <span className="text-red-500">*</span>}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-2">
                        Numéro de carte
                      </label>
                      <input
                        type="text"
                        id="cardNumber"
                        value={cardDetails.cardNumber}
                        onChange={(e) => handleCardDetailsChange('cardNumber', e.target.value)}
                        placeholder="1234 5678 9012 3456"
                        maxLength="19"
                        className={`w-full border p-3 rounded-lg focus:ring-2 focus:border-transparent ${
                          fieldErrors.cardDetails 
                            ? 'border-red-500 focus:ring-red-500' 
                            : 'border-gray-300 focus:ring-green-500'
                        }`}
                      />
                    </div>
                    <div>
                      <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 mb-2">
                        Date d'expiration
                      </label>
                      <input
                        type="text"
                        id="expiryDate"
                        value={cardDetails.expiryDate}
                        onChange={(e) => handleCardDetailsChange('expiryDate', e.target.value)}
                        placeholder="MM/AA"
                        maxLength="5"
                        className={`w-full border p-3 rounded-lg focus:ring-2 focus:border-transparent ${
                          fieldErrors.cardDetails 
                            ? 'border-red-500 focus:ring-red-500' 
                            : 'border-gray-300 focus:ring-green-500'
                        }`}
                      />
                    </div>
                    <div>
                      <label htmlFor="cvv" className="block text-sm font-medium text-gray-700 mb-2">
                        CVV
                      </label>
                      <input
                        type="text"
                        id="cvv"
                        value={cardDetails.cvv}
                        onChange={(e) => handleCardDetailsChange('cvv', e.target.value)}
                        placeholder="123"
                        maxLength="4"
                        className={`w-full border p-3 rounded-lg focus:ring-2 focus:border-transparent ${
                          fieldErrors.cardDetails 
                            ? 'border-red-500 focus:ring-red-500' 
                            : 'border-gray-300 focus:ring-green-500'
                        }`}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label htmlFor="cardholderName" className="block text-sm font-medium text-gray-700 mb-2">
                        Nom du titulaire
                      </label>
                      <input
                        type="text"
                        id="cardholderName"
                        value={cardDetails.cardholderName}
                        onChange={(e) => handleCardDetailsChange('cardholderName', e.target.value)}
                        placeholder="Nom comme indiqué sur la carte"
                        className={`w-full border p-3 rounded-lg focus:ring-2 focus:border-transparent ${
                          fieldErrors.cardDetails 
                            ? 'border-red-500 focus:ring-red-500' 
                            : 'border-gray-300 focus:ring-green-500'
                        }`}
                      />
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Vos informations de paiement sont sécurisées et chiffrées.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Guest Message */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">
                Message à l'hôte
              </h2>
              <p className="text-sm text-gray-600 mb-3">
                Présentez-vous et dites à votre hôte pourquoi vous voyagez (optionnel)
              </p>
              <textarea
                value={guestMessage}
                onChange={(e) => setGuestMessage(e.target.value)}
                placeholder="Écrivez un message à vos hôtes..."
                className="w-full border border-gray-300 p-3 rounded-lg h-32 resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Confirmation Section */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Confirmation</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Articles dans le panier:</span>
                  <span className="font-medium">{cart.items?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Message:</span>
                  <span className="font-medium text-sm max-w-xs text-right">{guestMessage || 'Aucun message'}</span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Paiement:</span>
                    <span className="font-medium text-sm">
                      {paymentMethod === 'card' ? 'Par carte' : 'Non sélectionné'}
                      {paymentMethod === 'card' && cardDetails.cardNumber && (
                        <span className="ml-2 text-xs text-gray-500">
                          (****{cardDetails.cardNumber.replace(/\s/g, '').slice(-4)})
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleGoBack}
                className="flex-1 py-3 px-6 rounded-lg text-white font-semibold bg-gray-700 hover:bg-gray-800 transition"
              >
                Retour
              </button>
              <button
                onClick={handleCheckout}
                disabled={isSubmitting}
                className={`flex-1 py-3 px-6 rounded-lg text-white font-semibold transition ${
                  isSubmitting 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-green-800 hover:bg-green-900'
                }`}
              >
                {isSubmitting ? 'Traitement...' : 'Confirmer et payer'}
              </button>
            </div>
            </div>
          </div>

          {/* Right Section - Order Summary */}
          <div className="space-y-6">
            <div className="sticky top-4 space-y-6">
            {/* Cart Items */}
            {cart.items?.map((item) => (
              <div key={item._id} className="bg-white p-6 rounded-lg shadow-sm">
                {/* Item Header with Image */}
                {item.itemSnapshot?.thumbnail && (
                  <div className="mb-4">
                    <S3Image
                      src={item.itemSnapshot.thumbnail}
                      alt={item.itemSnapshot.name}
                      className="w-full h-48 object-cover rounded-lg"
                      fallbackSrc="/placeholder.jpg"
                    />
                  </div>
                )}

                {/* Item Details */}
                <h2 className="text-xl font-semibold mb-2 text-gray-800">
                  {item.itemSnapshot?.name || 'Article'}
                </h2>
                
                {item.itemSnapshot?.description && (
                  <p className="text-gray-600 mb-4 line-clamp-2">{item.itemSnapshot.description}</p>
                )}

                <div className="space-y-3 mb-4">
                  {item.itemSnapshot?.location && (
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-gray-400 mt-1 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <p className="font-medium text-gray-800">{item.itemSnapshot.location}</p>
                    </div>
                  )}
                  
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <span className="inline-block px-2 py-1 bg-green-100 text-green-700 rounded text-sm font-medium">
                      {item.itemType === 'property' ? 'Propriété' : 'Package'}
                    </span>
                  </div>
                </div>

                {/* Booking Details */}
                {editingItemId === item._id ? (
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3 mb-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Check-in</label>
                        <div className="w-full text-base font-medium text-gray-900 p-2 rounded-lg bg-white border border-gray-200">{editValues.checkIn}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Check-out</label>
                        <div className="w-full text-base font-medium text-gray-900 p-2 rounded-lg bg-white border border-gray-200">{editValues.checkOut}</div>
                      </div>
                    </div>
                    {item.itemType === 'property' && (
                      <button
                        type="button"
                        onClick={() => setCalendarItemId(item._id)}
                        className="w-full px-3 py-2 rounded-lg font-medium transition-all border border-green-300 text-green-700 bg-green-50 hover:bg-green-100"
                      >
                        Changer les dates
                      </button>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Invités</label>
                      <input
                        type="number"
                        min="1"
                        value={editValues.guests}
                        onChange={(e) => setEditValues(prev => ({ ...prev, guests: e.target.value }))}
                        className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => handleSaveEdit(item._id)}
                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium"
                      >
                        Sauvegarder
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 font-medium"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Check-in:</span>
                        <span className="font-medium text-gray-800">
                          {new Date(item.checkIn).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Check-out:</span>
                        <span className="font-medium text-gray-800">
                          {new Date(item.checkOut).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Invités:</span>
                        <span className="font-medium text-gray-800">{item.guests}</span>
                      </div>
                      {item.totalNights > 0 && (
                        <div className="flex justify-between items-center py-2">
                          <span className="text-gray-600">Durée:</span>
                          <span className="font-medium text-gray-800">
                            {item.totalNights} nuit{item.totalNights > 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Price and Actions */}
                    <div className="pt-4 border-t-2 border-gray-200">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-lg font-semibold text-gray-800">Prix</span>
                        <span className="text-xl font-bold text-green-600">
                          {item.subtotal || 0} MAD
                        </span>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleEditItem(item)}
                          className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition font-medium"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => handleRemoveItem(item._id)}
                          className="flex-1 bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition font-medium"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  </>
                )}
                {/* Date Calendar Modal for this item */}
                {calendarItemId === item._id && (
                  <div className="fixed inset-0 z-50 bg-black bg-opacity-30 flex items-center justify-center p-4">
                    <div className="max-w-lg w-full">
                      <DateRangeCalendar
                        title="Sélectionner les dates"
                        initialCheckIn={editValues.checkIn}
                        initialCheckOut={editValues.checkOut}
                        fetchAvailability={async () => {
                          try {
                            if (item.itemType !== 'property') return [];
                            const res = await api.get(`/api/booking/status/${item.itemId}`);
                            const ranges = res?.data?.unavailableDates || [];
                            const blocked = [];
                            const boundaryCheckIns = [];
                            const fullyBlockedBoundaries = [];
                            for (const r of ranges) {
                              const start = new Date(r.checkIn);
                              const end = new Date(r.checkOut);
                              boundaryCheckIns.push(new Date(Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())).toISOString());
                              for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
                                blocked.push(new Date(d).toISOString());
                              }
                            }
                            const starts = new Set(boundaryCheckIns);
                            for (const r of ranges) {
                              const out = new Date(r.checkOut);
                              const outIso = new Date(Date.UTC(out.getFullYear(), out.getMonth(), out.getDate())).toISOString();
                              if (starts.has(outIso)) fullyBlockedBoundaries.push(outIso);
                            }
                            return { blockedDates: blocked, boundaryCheckIns, fullyBlockedBoundaries };
                          } catch (_) {
                            return [];
                          }
                        }}
                        onApply={applyCalendarDates}
                        onClose={() => setCalendarItemId(null)}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Total Summary */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Détail des prix</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-3 border-t-2 border-gray-200">
                  <span className="text-lg font-semibold text-gray-800">Total</span>
                  <span className="text-xl font-bold text-green-600">
                    {getCartTotal()} MAD
                  </span>
                </div>
                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-700">
                    <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    Prix final - Aucun frais supplémentaire
                  </p>
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}