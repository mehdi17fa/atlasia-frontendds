import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import S3Image from '../../components/S3Image';
import { CalendarDaysIcon, MapPinIcon, CurrencyDollarIcon, UserGroupIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const API_BASE_URL = `${process.env.REACT_APP_API_URL}/api`;

const LoadingSpinner = () => (
  <div className="flex justify-center py-8">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
  </div>
);

export default function PackageBooking() {
  const { packageId } = useParams();
  const navigate = useNavigate();
  const { token, user } = useContext(AuthContext);
  
  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookingError, setBookingError] = useState("");
  
  // Form state
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const [message, setMessage] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState("");

  // ================= FETCH PACKAGE =================
  useEffect(() => {
    const fetchPackage = async () => {
      if (!token) {
        setError("Vous devez être connecté pour voir ce package.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE_URL}/packages/${packageId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPkg(res.data.package);
        setError(null);
        
        // Pre-fill dates if package has fixed dates
        if (res.data.package.startDate && res.data.package.endDate) {
          setCheckIn(res.data.package.startDate.split('T')[0]);
          setCheckOut(res.data.package.endDate.split('T')[0]);
        }
      } catch (err) {
        console.error("Package fetch error:", err);
        if (err.response?.status === 401) {
          setError("Token invalide ou expiré. Veuillez vous reconnecter.");
        } else if (err.response?.status === 403) {
          setError("Vous n'êtes pas autorisé à accéder à ce package.");
        } else {
          setError(err.response?.data?.message || "Erreur lors du chargement du package");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPackage();
  }, [packageId, token]);

  // ================= HANDLE BOOKING =================
  const handleBooking = async () => {
    if (!checkIn || !checkOut) {
      setBookingError("Veuillez sélectionner les dates");
      return;
    }

    if (!token) {
      setBookingError("Vous devez être connecté pour réserver.");
      return;
    }

    // Client-side validation
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      setBookingError("Dates invalides");
      return;
    }
    if (checkOutDate <= checkInDate) {
      setBookingError("La date de sortie doit être après la date d'entrée");
      return;
    }
    const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
    const nights = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    if (nights < 1) {
      setBookingError("La réservation nécessite au moins une nuit");
      return;
    }
    if (guests < 1 || !Number.isInteger(Number(guests))) {
      setBookingError("Le nombre de guests doit être un entier ≥1");
      return;
    }

    // Optional: Validate against package dates if set
    if (pkg.startDate && checkInDate < new Date(pkg.startDate)) {
      setBookingError("La date d'entrée doit être après la date de début du package");
      return;
    }
    if (pkg.endDate && checkOutDate > new Date(pkg.endDate)) {
      setBookingError("La date de sortie doit être avant la date de fin du package");
      return;
    }

    try {
      setBookingLoading(true);
      setBookingError(""); // Clear previous errors
      console.log('🚀 Booking payload:', { checkIn, checkOut, guests, pkg });  // Frontend log for debug

      // Updated endpoint to /api/packagebooking (now supported in backend)
      const endpoint = `${API_BASE_URL}/packagebooking`;
      console.log('🔗 Full endpoint URL:', endpoint);
      const payload = {
        packageId: pkg._id,
        checkIn,
        checkOut,
        guests: Number(guests),  // Ensure integer
        message: message || `Booking via package ${pkg.name}`,
      };

      const res = await axios.post(endpoint, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setBookingSuccess(res.data.message);
      setBookingError(""); // Clear any errors on success
      
      // Optional: Navigate to bookings page after success
      setTimeout(() => {
        navigate('/my-bookings');
      }, 2000);
      
    } catch (err) {
      console.error("Booking error:", err);
      console.error("Response data:", err.response?.data);  // Log server response
      setBookingError(
        err.response?.data?.message ||
          (err.response?.status === 403
            ? "Action non autorisée"
            : "Erreur lors de la réservation")
      );
      setBookingSuccess(""); // Clear success message on error
    } finally {
      setBookingLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Non spécifié';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getItemsText = (pkg) => {
    const items = [];
    if (pkg.services?.length > 0) items.push(`${pkg.services.length} service${pkg.services.length > 1 ? 's' : ''}`);
    if (pkg.activities?.length > 0) items.push(`${pkg.activities.length} activité${pkg.activities.length > 1 ? 's' : ''}`);
    if (pkg.restaurants?.length > 0) items.push(`${pkg.restaurants.length} restaurant${pkg.restaurants.length > 1 ? 's' : ''}`);
    return items.join(', ') || 'Aucun élément';
  };

  // ================= RENDER =================
  if (loading) return <LoadingSpinner />;
  
  if (error && !pkg) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 p-4 font-semibold bg-red-100 rounded mb-4">
            {error}
          </div>
          <button
            onClick={() => navigate('/packages')}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Retour aux packages
          </button>
        </div>
      </div>
    );
  }
  
  if (!pkg) return <div className="text-gray-600 p-4">Package introuvable</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/packages')}
          className="flex items-center text-green-600 hover:text-green-700 mb-6"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Retour aux packages
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Package Details */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {pkg.name || 'Package Expérience'}
              </h1>
              <p className="text-gray-600 mb-4">
                Par {pkg.partner?.fullName || 'Partenaire'}
              </p>
              <p className="text-gray-700">
                {pkg.description || 'Découvrez une expérience unique avec ce package personnalisé.'}
              </p>
            </div>

            {/* Package Info */}
            <div className="space-y-4 mb-6">
              <div className="flex items-center text-sm text-gray-600">
                <CalendarDaysIcon className="h-5 w-5 mr-3 text-green-600" />
                <span>
                  {pkg.startDate && pkg.endDate 
                    ? `Disponible du ${formatDate(pkg.startDate)} au ${formatDate(pkg.endDate)}`
                    : 'Dates flexibles'
                  }
                </span>
              </div>

              {pkg.property?.localisation && (
                <div className="flex items-center text-sm text-gray-600">
                  <MapPinIcon className="h-5 w-5 mr-3 text-green-600" />
                  <span>{pkg.property.localisation.city || 'Maroc'}</span>
                </div>
              )}

              <div className="flex items-center text-sm text-gray-600">
                <UserGroupIcon className="h-5 w-5 mr-3 text-green-600" />
                <span>{getItemsText(pkg)}</span>
              </div>

              <div className="flex items-center text-lg font-bold text-gray-900">
                <CurrencyDollarIcon className="h-6 w-6 mr-2 text-green-600" />
                <span>
                  {pkg.totalPrice ? `${pkg.totalPrice} MAD` : 'Prix sur demande'}
                </span>
              </div>
            </div>

            {/* Package Items */}
            <div className="space-y-6">
              {pkg.restaurants?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">🍽️ Restaurants inclus</h3>
                  <div className="space-y-3">
                    {pkg.restaurants.map((item, index) => (
                      <div key={`restaurant-${index}`} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        {item.thumbnail && (
                          <S3Image 
                            src={item.thumbnail} 
                            alt={item.name}
                            className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                            fallbackSrc="/placeholder.jpg"
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.name}</p>
                          {item.description && (
                            <p className="text-sm text-gray-600">{item.description}</p>
                          )}
                          <div className="flex items-center space-x-3 mt-1">
                            <p className="text-sm font-medium text-green-600">{item.price} MAD</p>
                            {item.scheduledTime && (
                              <div className="flex items-center text-xs text-blue-600">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>{item.scheduledTime}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {pkg.activities?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">🎯 Activités incluses</h3>
                  <div className="space-y-3">
                    {pkg.activities.map((item, index) => (
                      <div key={`activity-${index}`} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        {item.thumbnail && (
                          <S3Image 
                            src={item.thumbnail} 
                            alt={item.name}
                            className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                            fallbackSrc="/placeholder.jpg"
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.name}</p>
                          {item.description && (
                            <p className="text-sm text-gray-600">{item.description}</p>
                          )}
                          <div className="flex items-center space-x-3 mt-1">
                            <p className="text-sm font-medium text-green-600">{item.price} MAD</p>
                            {item.scheduledTime && (
                              <div className="flex items-center text-xs text-blue-600">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>{item.scheduledTime}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {pkg.services?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">⚡ Services inclus</h3>
                  <div className="space-y-3">
                    {pkg.services.map((item, index) => (
                      <div key={`service-${index}`} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        {item.thumbnail && (
                          <S3Image 
                            src={item.thumbnail} 
                            alt={item.name}
                            className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                            fallbackSrc="/placeholder.jpg"
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.name}</p>
                          {item.description && (
                            <p className="text-sm text-gray-600">{item.description}</p>
                          )}
                          <p className="text-sm font-medium text-green-600">{item.price} MAD</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Booking Form */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Réserver ce package</h2>
            
            {/* Success Message */}
            {bookingSuccess && (
              <div className="mb-4 text-green-700 font-semibold bg-green-100 p-3 rounded">
                {bookingSuccess}
              </div>
            )}

            {/* Error Message */}
            {bookingError && (
              <div className="mb-4 text-red-600 font-semibold bg-red-100 p-3 rounded">
                {bookingError}
              </div>
            )}

            <div className="space-y-4">
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Sélectionnez les dates et le nombre de guests</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date d'arrivée
                    </label>
                    <input
                      type="date"
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date de départ
                    </label>
                    <input
                      type="date"
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      min={checkIn || new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre d'invités
                </label>
                <input
                  type="number"
                  min={1}
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Guests"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message au partenaire (optionnel)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows="3"
                  placeholder="Dites-nous quelque chose sur votre séjour..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <button
                onClick={handleBooking}
                disabled={bookingLoading}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {bookingLoading ? "Réservation en cours..." : "Réserver maintenant"}
              </button>
            </div>

            <div className="mt-4 p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>Note:</strong> Votre réservation sera confirmée immédiatement. 
                Le partenaire sera notifié et vous contactera pour finaliser les détails.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}