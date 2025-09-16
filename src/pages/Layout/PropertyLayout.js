import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ReactComponent as ArrowLeftIcon } from '../../assets/icons/arrow-left.svg';
import { FaHeart } from "react-icons/fa";
import S3Image from "../../components/S3Image";
import SinglePropertyMap from "../../components/SinglePropertyMap";
import InitialsAvatar from "../../components/shared/InitialsAvatar";
import RatingDisplay from "../../components/shared/RatingDisplay";
import ReviewList from "../../components/shared/ReviewList";
import ReviewForm from "../../components/shared/ReviewForm";
import { useFavorites } from "../../hooks/useFavorites";
import useReviews from "../../hooks/useReviews";

export default function PropertyLayout({
  title,
  location,
  rating,
  reviewCount,
  mainImage,
  host,
  checkInTime,
  features,
  associatedPacks,
  mapImage,
  reviews,
  user,
  token,
}) {
  const navigate = useNavigate();
  const { id: propertyId } = useParams();

  const fallbackToken = localStorage.getItem('accessToken');
  const isLoggedIn = !!user && !!(token || fallbackToken);
  const authToken = token || fallbackToken;

  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [error, setError] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [reviewsData, setReviewsData] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  
  const { isFavorited, toggleFavorite, isAuthenticated } = useFavorites();
  const { getPropertyReviews, submitReview, reviewableBookings } = useReviews();

  const loadReviews = useCallback(async () => {
    try {
      setReviewsLoading(true);
      const response = await getPropertyReviews(propertyId);
      setReviewsData(response.reviews || []);
    } catch (err) {
      console.error('Error loading reviews:', err);
    } finally {
      setReviewsLoading(false);
    }
  }, [propertyId, getPropertyReviews]);

  useEffect(() => {
    console.log('User object:', user);
    console.log('Token prop:', token);
    console.log('Fallback token (localStorage):', fallbackToken);
    console.log('Is logged in:', isLoggedIn);
  }, [user, token, fallbackToken, isLoggedIn]);

  // Load reviews when component mounts
  useEffect(() => {
    if (propertyId) {
      loadReviews();
    }
  }, [propertyId, loadReviews]);

  const handleOpenReviewForm = () => {
    // Find a reviewable booking for this property
    const booking = reviewableBookings.find(b => 
      b.property && b.property._id === propertyId
    );
    
    if (booking) {
      setSelectedBooking(booking);
      setShowReviewForm(true);
    } else {
      setError('No reviewable booking found for this property');
    }
  };

  const handleSubmitReview = async (reviewData) => {
    try {
      await submitReview(reviewData);
      setShowReviewForm(false);
      setSelectedBooking(null);
      await loadReviews(); // Refresh reviews
      setError(null);
      } catch (err) {
      console.error('Error submitting review:', err);
      setError('Error submitting review');
    }
  };

  const handleCancelReview = () => {
    setShowReviewForm(false);
    setSelectedBooking(null);
    setError(null);
  };


  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      setError('Please log in to save favorites');
      navigate('/login');
      return;
    }
    
    if (propertyId) {
      const success = await toggleFavorite(propertyId);
      if (success) {
        // Optional: Show success message
        console.log('Favorite updated successfully');
      }
    }
  };

  const handleBooking = () => {
    console.log('🚀 Starting booking process. User:', user, 'Token:', authToken, 'isLoggedIn:', isLoggedIn);
    console.log('📅 Form data:', { checkIn, checkOut, guests });

    if (!isLoggedIn) {
      console.log('🔒 Redirecting to login because user or token is missing');
      navigate('/login', { 
        state: { 
          from: `/property/${propertyId}`,
          message: 'Please log in to book this property.'
        } 
      });
      return;
    }

    // Check if required fields are filled
    if (!checkIn || !checkOut || guests < 1) {
      console.log('❌ Missing required booking information');
      setError('Veuillez sélectionner les dates d\'arrivée, de départ et le nombre d\'invités.');
      return;
    }

    // Validate dates
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkInDate < today) {
      setError('La date d\'arrivée ne peut pas être dans le passé.');
      return;
    }

    if (checkOutDate <= checkInDate) {
      setError('La date de départ doit être après la date d\'arrivée.');
      return;
    }

    // Clear any previous errors
    setError(null);

    // Navigate to booking process with complete data
    console.log('📅 Navigating to booking request page with complete data');
    navigate(`/booking/request/${propertyId}`, {
      state: {
        propertyId,
        authToken,
        userId: user._id,
        hostId: host?.id,
        hostName: host?.name || "Hôte",
        hostPhoto: host?.photo || "A",
        bookingData: {
      propertyId,
      checkIn,
      checkOut,
      guests: Number(guests),
      userId: user._id,
        }
            },
          });
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      {/* Navigation Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          className="flex items-center space-x-2 text-green-600 hover:text-green-700 transition-colors"
          onClick={() => navigate(-1)}
        >
          <ArrowLeftIcon className="w-5 h-5" />
          <span className="font-medium">Retour</span>
        </button>
        <div className="flex items-center space-x-2">
          <button
            className="p-2 text-green-600 hover:text-green-700 transition-colors"
            onClick={() => navigate(-1)}
            title="Page précédente"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <button
            className="p-2 text-green-600 hover:text-green-700 transition-colors"
            onClick={() => window.history.forward()}
            title="Page suivante"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div className="relative rounded-2xl overflow-hidden shadow-lg">
        <S3Image 
          src={mainImage} 
          alt={title} 
          className="w-full h-96 object-cover" 
          fallbackSrc="/villa1.jpg"
        />
        <button
          className="absolute top-4 left-4 p-3 bg-black bg-opacity-30 rounded-full text-white flex items-center justify-center shadow-md hover:bg-opacity-50 transition-all"
          onClick={() => navigate(-1)}
        >
          <ArrowLeftIcon className="w-5 h-5" fill="white" stroke="white" />
        </button>
        
        {/* Heart button for favorites */}
        <button
          className="absolute top-4 right-4 p-3 bg-black bg-opacity-30 rounded-full text-white flex items-center justify-center shadow-md hover:bg-opacity-50 transition-all"
          onClick={handleToggleFavorite}
          title={isFavorited(propertyId) ? "Remove from favorites" : "Add to favorites"}
        >
          <FaHeart
            className={`w-5 h-5 transition-colors duration-300 ${
              isFavorited(propertyId) ? "text-red-500" : "text-white hover:text-red-300"
            }`}
          />
        </button>
      </div>
      <div>
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="text-gray-600 mt-1">{location}</p>
        <div className="mt-1">
          <RatingDisplay 
            rating={rating} 
            reviewCount={reviewCount} 
            size="sm" 
            showCount={true}
          />
        </div>
      </div>
      <div className="border rounded-2xl p-4 shadow-sm">
        <h2 className="font-semibold text-lg mb-3">Book This Property</h2>
        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Check-in</label>
            <input
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Check-out</label>
            <input
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              min={checkIn || new Date().toISOString().split('T')[0]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Guests</label>
            <input
              type="number"
              min="1"
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>
        </div>
      </div>
      <div>
        <h2 className="font-semibold text-lg mb-3">Ce que propose ce logement</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-700 font-medium">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center space-x-2">
              {feature.icon}
              <span>{feature.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h2 className="font-semibold text-lg mb-3">Les packs associés</h2>
        {associatedPacks && associatedPacks.length > 0 ? (
        <div className="space-y-3">
          {associatedPacks.map((pack, index) => (
              <div key={pack._id || index} className="flex items-center space-x-4 p-4 rounded-xl shadow hover:shadow-lg transition-all cursor-pointer border border-gray-200 hover:border-green-300"
                   onClick={() => navigate(`/packages/${pack._id}`)}>
                <S3Image
                src={pack.image || '/placeholder-image.jpg'}
                alt={pack.name || 'Pack image'}
                className="w-16 h-16 rounded-lg object-cover"
                  fallbackSrc="/placeholder1.jpg"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{pack.name || 'Unnamed Pack'}</p>
                  <p className="text-sm text-gray-500">{pack.description || 'Aucune description disponible'}</p>
                  {pack.partnerName && (
                    <p className="text-xs text-green-600 mt-1">Par {pack.partnerName}</p>
                  )}
                </div>
                <div className="text-green-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-xl">
            <div className="text-gray-400 mb-2">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <p className="text-gray-600 font-medium">Aucun pack associé</p>
            <p className="text-sm text-gray-500">Ce logement n'a pas encore de packs associés</p>
        </div>
        )}
      </div>
      <div>
        <h2 className="font-semibold text-lg mb-3">Localisation</h2>
        <SinglePropertyMap location={location} />
      </div>
      {/* Reviews Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Avis des clients</h2>
          {isLoggedIn && reviewableBookings.some(b => b.property && b.property._id === propertyId) && (
            <button
              onClick={handleOpenReviewForm}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              Laisser un avis
            </button>
          )}
        </div>
        
        {reviewsLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Chargement des avis...</p>
          </div>
        ) : (
          <ReviewList 
            reviews={reviewsData}
            propertyRating={rating}
            reviewCount={reviewCount}
          />
        )}
      </div>
      
      {/* Owner Profile Section */}
        {host && (
        <div className="border rounded-2xl p-6 shadow-sm bg-gradient-to-r from-blue-50 to-green-50">
          <h2 className="font-semibold text-xl mb-4 text-gray-800">👤 Propriétaire</h2>
          <div className="flex items-start space-x-4">
            <InitialsAvatar
              name={host.name || 'Hôte'}
              size="w-20 h-20"
              textSize="text-2xl"
              backgroundColor="bg-gradient-to-br from-blue-500 to-green-500"
              className="border-4 border-white shadow-lg"
            />
            <div className="flex-1">
              <h3 className="font-bold text-xl text-gray-900 mb-1">{host.name || 'Hôte'}</h3>
              <p className="text-gray-600 mb-2">Propriétaire de ce logement</p>
              
              {/* Property Rating */}
              <div className="mb-3">
                <RatingDisplay 
                  rating={rating} 
                  reviewCount={reviewCount} 
                  size="sm" 
                  showCount={true}
                />
              </div>
              
              {host.email && (
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-gray-500">📧</span>
                  <span className="text-sm text-gray-700">{host.email}</span>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => host?.id && navigate(`/owner/${host.id}`)}
                  disabled={!host?.id}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${host?.id 
                    ? 'bg-green-600 text-white border border-green-600 hover:bg-green-700 shadow-sm' 
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                >
                  📋 Voir le profil complet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Host/Owner Information Section */}
      <div className="border rounded-2xl p-6 shadow-sm bg-white">
        <h2 className="font-semibold text-lg mb-4">À propos de votre hôte</h2>
        {host ? (
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <InitialsAvatar
                name={host.name || 'Hôte'}
                size="w-16 h-16"
                textSize="text-lg"
                backgroundColor="bg-gradient-to-br from-green-500 to-blue-500"
                className="border-2 border-green-100"
              />
              <div>
                <h3 className="font-semibold text-lg text-gray-900">{host.name || 'Hôte'}</h3>
                <p className="text-sm text-gray-600">Propriétaire du logement</p>
                {host.email && (
                  <p className="text-xs text-gray-500 mt-1">✉️ {host.email}</p>
                )}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <button
            onClick={() => host?.id && navigate(`/owner/${host.id}`)}
            disabled={!host?.id}
                className={`px-4 py-2 rounded-xl text-white font-medium transition-all ${host?.id 
                  ? 'bg-green-600 hover:bg-green-700 shadow-md hover:shadow-lg' 
                  : 'bg-gray-300 cursor-not-allowed opacity-50'}`}
          >
                👤 Voir le profil
          </button>
          <button
            onClick={handleBooking}
                disabled={!isLoggedIn || !checkIn || !checkOut || guests < 1}
                className={`px-6 py-2 rounded-xl text-white font-semibold transition-all ${
                  !isLoggedIn 
                    ? 'bg-gray-300 cursor-not-allowed opacity-50'
                    : (!checkIn || !checkOut || guests < 1)
                      ? 'bg-orange-500 hover:bg-orange-600 shadow-md hover:shadow-lg'
                      : 'bg-green-600 hover:bg-green-700 shadow-md hover:shadow-lg'
                }`}
              >
                {!isLoggedIn 
                  ? '🔒 Connectez-vous pour réserver'
                  : (!checkIn || !checkOut || guests < 1)
                    ? '📅 Sélectionnez vos dates et invités'
                    : '🏠 Réserver maintenant'
                }
          </button>
        </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-600">Informations sur l'hôte non disponibles</p>
          </div>
        )}
      </div>

      {/* Review Form Modal */}
      {showReviewForm && selectedBooking && (
        <ReviewForm
          propertyId={propertyId}
          bookingId={selectedBooking._id}
          propertyTitle={title}
          onSubmit={handleSubmitReview}
          onCancel={handleCancelReview}
          isLoading={reviewsLoading}
        />
      )}
    </div>
  );
}