import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircleIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';

export default function CartCheckoutConfirmation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { checkoutResult } = location.state || {};
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Auto-redirect after 5 seconds
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/my-bookings');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  if (!checkoutResult) {
    // If no checkout result, redirect to home
    navigate('/');
    return null;
  }

  const { bookings = [], message = '' } = checkoutResult;
  const propertyBookings = bookings.filter(b => b.type === 'property');
  const packageBookings = bookings.filter(b => b.type === 'package');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        {/* Success Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
              <CheckCircleIcon className="h-12 w-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Commande confirmée !
            </h1>
            <p className="text-lg text-gray-600">
              {message || 'Votre commande a été passée avec succès'}
            </p>
          </div>
        </div>

        {/* Booking Details */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <ShoppingBagIcon className="h-6 w-6 mr-2 text-primary-600" />
            Détails de votre commande
          </h2>

          {/* Property Bookings */}
          {propertyBookings.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-800 mb-3">
                Réservations de propriétés ({propertyBookings.length})
              </h3>
              <div className="space-y-4">
                {propertyBookings.map((item, index) => (
                  <div 
                    key={index} 
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">
                          {item.booking?.property?.title || 'Propriété'}
                        </h4>
                        <div className="mt-2 space-y-1 text-sm text-gray-600">
                          <p>
                            <span className="font-medium">Check-in:</span>{' '}
                            {new Date(item.booking?.checkIn).toLocaleDateString('fr-FR')}
                          </p>
                          <p>
                            <span className="font-medium">Check-out:</span>{' '}
                            {new Date(item.booking?.checkOut).toLocaleDateString('fr-FR')}
                          </p>
                          <p>
                            <span className="font-medium">Invités:</span> {item.booking?.guests}
                          </p>
                          <p>
                            <span className="font-medium">Statut:</span>{' '}
                            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                              item.booking?.status === 'confirmed' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {item.booking?.status === 'confirmed' ? 'Confirmé' : 'En attente'}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-lg font-bold text-primary-600">
                          {item.booking?.totalAmount || 0} MAD
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Package Bookings */}
          {packageBookings.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-3">
                Réservations de packages ({packageBookings.length})
              </h3>
              <div className="space-y-4">
                {packageBookings.map((item, index) => (
                  <div 
                    key={index} 
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">
                          {item.booking?.package?.name || 'Package'}
                        </h4>
                        <div className="mt-2 space-y-1 text-sm text-gray-600">
                          <p>
                            <span className="font-medium">Date de début:</span>{' '}
                            {new Date(item.booking?.checkIn).toLocaleDateString('fr-FR')}
                          </p>
                          <p>
                            <span className="font-medium">Date de fin:</span>{' '}
                            {new Date(item.booking?.checkOut).toLocaleDateString('fr-FR')}
                          </p>
                          <p>
                            <span className="font-medium">Invités:</span> {item.booking?.guests}
                          </p>
                          <p>
                            <span className="font-medium">Statut:</span>{' '}
                            <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                              Confirmé
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-lg font-bold text-primary-600">
                          {item.booking?.totalPrice || 0} MAD
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {bookings.length === 0 && (
            <p className="text-gray-500 text-center py-4">
              Aucune réservation trouvée
            </p>
          )}
        </div>

        {/* Next Steps */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Prochaines étapes
          </h2>
          <div className="space-y-3 text-gray-600">
            <div className="flex items-start">
              <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-primary-100 text-primary-600 rounded-full text-sm font-semibold mr-3">
                1
              </span>
              <p>Vous recevrez une confirmation par email avec tous les détails</p>
            </div>
            <div className="flex items-start">
              <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-primary-100 text-primary-600 rounded-full text-sm font-semibold mr-3">
                2
              </span>
              <p>Les hôtes/partenaires vous contactera pour finaliser les arrangements</p>
            </div>
            <div className="flex items-start">
              <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-primary-100 text-primary-600 rounded-full text-sm font-semibold mr-3">
                3
              </span>
              <p>Consultez vos réservations dans la section "Mes réservations"</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate('/my-bookings')}
            className="flex-1 bg-primary-500 text-white py-3 px-6 rounded-lg hover:bg-primary-600 transition-colors font-medium"
          >
            Voir mes réservations
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Retour à l'accueil
          </button>
        </div>

        {/* Auto-redirect message */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Redirection automatique vers vos réservations dans {countdown} seconde{countdown !== 1 ? 's' : ''}...
        </p>
      </div>
    </div>
  );
}
