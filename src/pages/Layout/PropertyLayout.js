import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ReactComponent as ArrowLeftIcon } from '../../assets/icons/arrow-left.svg';
import { FaHeart } from "react-icons/fa";
import S3Image from "../../components/S3Image";
import ImageCarousel from "../../components/ImageCarousel";
import ImageViewer from "../../components/ImageViewer";
import SinglePropertyMap from "../../components/SinglePropertyMap";
import InitialsAvatar from "../../components/shared/InitialsAvatar";
import RatingDisplay from "../../components/shared/RatingDisplay";
import ReviewList from "../../components/shared/ReviewList";
import ReviewForm from "../../components/shared/ReviewForm";
import LoginScreen from "../LogIn/LogInScreen";
import SignUpScreen from "../SignUp/SignUpScreen";
import { useFavorites } from "../../hooks/useFavorites";
import useReviews from "../../hooks/useReviews";

export default function PropertyLayout({
  title,
  location,
  rating,
  reviewCount,
  mainImage,
  photos,
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
  const currentLocation = useLocation();

  const fallbackToken = localStorage.getItem('accessToken');
  const isLoggedIn = !!user && !!(token || fallbackToken);
  const authToken = token || fallbackToken;

  // Auto-fill dates with tomorrow and day after
  const getTomorrow = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };
  
  const getDayAfter = () => {
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    return dayAfter.toISOString().split('T')[0];
  };

  const [checkIn, setCheckIn] = useState(getTomorrow());
  const [checkOut, setCheckOut] = useState(getDayAfter());
  const [guests, setGuests] = useState(1);
  const [error, setError] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [reviewsData, setReviewsData] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);
  
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
      setShowLogin(true);
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

  const handleCloseLogin = () => setShowLogin(false);
  const handleCloseSignup = () => setShowSignup(false);
  const handleSwitchToSignup = () => {
    setShowLogin(false);
    setShowSignup(true);
  };
  const handleSwitchToLogin = () => {
    setShowSignup(false);
    setShowLogin(true);
  };

  const handleImageClick = (index) => {
    setImageViewerIndex(index);
    setImageViewerOpen(true);
  };

  const handleCloseImageViewer = () => {
    setImageViewerOpen(false);
  };

  const handleBooking = () => {
    console.log('🚀 Starting booking process. User:', user, 'Token:', authToken, 'isLoggedIn:', isLoggedIn);
    console.log('📅 Form data:', { checkIn, checkOut, guests });

    if (!isLoggedIn) {
      console.log('🔒 Showing login modal because user or token is missing');
      setShowLogin(true);
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
    <div className="relative min-h-screen">
      {/* Desktop Header */}
      <div className="hidden md:flex items-center justify-between px-6 py-4 bg-white shadow-sm sticky top-0 z-10">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/')}
            className="text-2xl font-bold text-green-800 hover:text-green-600 transition-colors"
          >
            ATLASIA
          </button>
        </div>
        <div className="flex-1 max-w-3xl mx-10">
          <div 
            onClick={() => navigate('/search')}
            className="bg-white border border-gray-300 rounded-full px-6 py-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="text-gray-500">Rechercher des destinations</span>
            </div>
          </div>
        </div>
        <div className="w-32"></div> {/* Spacer for balance */}
      </div>

      {/* Mobile Header */}
      <div className="md:hidden sticky top-0 z-50 bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Back Button */}
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center w-10 h-10 text-green-700 hover:text-green-800 hover:bg-green-50 rounded-full transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Center: Atlasia Branding */}
            <div className="text-center">
              <button
                onClick={() => {
                  // Navigate based on user role
                  if (user?.role === 'tourist' || !user) {
                    navigate('/');
                  } else if (user?.role === 'owner') {
                    navigate('/owner-welcome');
                  } else if (user?.role === 'partner') {
                    navigate('/partner-welcome');
                  } else {
                    navigate('/');
                  }
                }}
                className="font-bold text-green-700 text-xl hover:text-green-800 transition-colors"
              >
                ATLASIA
              </button>
            </div>

            {/* Right: Empty space for balance */}
            <div className="w-10"></div>
          </div>
        </div>
      </div>

      {/* Desktop Two-Column Layout */}
      <div className="hidden lg:block">
        <div className="max-w-7xl mx-auto px-6 py-6 pb-28">
          <div className="flex gap-8">
            {/* Left Column - Main Content */}
            <div className="flex-1 space-y-8">
        {/* Property Title and Favorite Button */}
        <div className="flex items-center justify-between mb-6 mx-4 md:mx-0">
          <h1 className="text-3xl font-bold">{title}</h1>
          <button 
            onClick={handleToggleFavorite}
            className="p-3 transition-colors"
            title={isFavorited(propertyId) ? "Retirer des favoris" : "Ajouter aux favoris"}
          >
            <FaHeart
              className={`w-6 h-6 transition-colors duration-300 ${
                isFavorited(propertyId) ? "text-red-500" : "text-gray-300 hover:text-red-400"
              }`}
            />
          </button>
        </div>

      {/* Image Gallery */}
      {photos && photos.length > 0 ? (
        <div className="relative">
          {/* Mobile: Image Carousel */}
          <div className="md:hidden mx-4">
            <ImageCarousel
              images={photos}
              className="h-80 rounded-2xl shadow-lg cursor-pointer"
              showDots={photos.length > 1}
              showArrows={photos.length > 1}
              onImageClick={handleImageClick}
            />
          </div>
          
          {/* Desktop: Grid Layout */}
          <div className="hidden md:grid grid-cols-3 rounded-2xl overflow-hidden shadow-lg" style={{ gap: '20px' }}>
            {/* Large main image - takes 2 columns */}
            <div 
              className="col-span-2 relative cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => handleImageClick(0)}
            >
              <S3Image 
                src={photos[0]} 
                alt={title} 
                className="w-full h-96 object-cover rounded-lg" 
                fallbackSrc="/villa1.jpg"
              />
            </div>
            
            {/* One or two smaller images stacked on the right */}
            <div className="col-span-1 flex flex-col h-96" style={{ gap: '20px' }}>
              {/* First small image */}
              {photos[1] && (
                <div 
                  className="relative flex-1 cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => handleImageClick(1)}
                >
                  <S3Image 
                    src={photos[1]} 
                    alt={`${title} - Image 2`} 
                    className="w-full h-full object-cover rounded-lg" 
                    fallbackSrc="/villa1.jpg"
                  />
                </div>
              )}
              
              {/* Second small image with show more button if there are more than 3 photos */}
              {photos.length > 2 && (
                <div 
                  className="relative flex-1 cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => handleImageClick(2)}
                >
                  <S3Image 
                    src={photos[2]} 
                    alt={`${title} - Image 3`} 
                    className="w-full h-full object-cover rounded-lg" 
                    fallbackSrc="/villa1.jpg"
                  />
                  {photos.length > 3 && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <button 
                        className="text-white text-sm font-medium bg-black bg-opacity-60 px-3 py-1 rounded-full hover:bg-opacity-80 transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleImageClick(0);
                        }}
                      >
                        Show all photos
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="relative">
          {/* Mobile: Single image */}
          <div className="md:hidden mx-4">
            <S3Image 
              src={mainImage} 
              alt={title} 
              className="w-full h-80 object-cover rounded-2xl shadow-lg" 
              fallbackSrc="/villa1.jpg"
            />
          </div>
          
          {/* Desktop: Single image */}
          <div className="hidden md:block relative rounded-2xl overflow-hidden shadow-lg">
            <S3Image 
              src={mainImage} 
              alt={title} 
              className="w-full h-96 object-cover" 
              fallbackSrc="/villa1.jpg"
            />
          </div>
        </div>
      )}
      
      {/* Property Details */}
      <div className="mx-4 md:mx-0">
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
      <div className="mx-4 md:mx-0">
        <h2 className="font-semibold text-lg mb-3">Les packs associés</h2>
        {associatedPacks && associatedPacks.length > 0 ? (
        <div className="space-y-3">
          {associatedPacks.map((pack, index) => (
              <div key={pack._id || index} className="flex items-center space-x-4 p-4 rounded-xl shadow hover:shadow-lg transition-all cursor-pointer border border-secondary-200 hover:border-primary-300"
                   onClick={() => navigate(`/packages/${pack._id}`)}>
                <S3Image
                src={pack.image || '/placeholder-image.jpg'}
                alt={pack.name || 'Pack image'}
                className="w-16 h-16 rounded-lg object-cover"
                  fallbackSrc="/placeholder1.jpg"
                />
                <div className="flex-1">
                  <p className="font-medium text-secondary-900">{pack.name || 'Unnamed Pack'}</p>
                  <p className="text-sm text-secondary-500">{pack.description || 'Aucune description disponible'}</p>
                  <p className="text-xs text-primary-600 mt-1">Par {pack.partner?.fullName || pack.partner?.displayName || pack.partnerName || (pack.partner?.email ? pack.partner.email.split('@')[0] : 'Partenaire')}</p>
                </div>
                <div className="text-primary-600">
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
      <div className="mx-4 md:mx-0">
        <h2 className="font-semibold text-lg mb-3">Localisation</h2>
        <SinglePropertyMap location={location} />
      </div>
      {/* Reviews Section */}
      <div className="mx-4 md:mx-0">
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
        <div className="border rounded-2xl p-6 shadow-sm bg-gradient-to-r from-blue-50 to-green-50 mx-4 md:mx-0">
          <h2 className="font-semibold text-xl mb-4 text-gray-800">👤 Propriétaire</h2>
          <div className="flex items-start space-x-4">
            {host.photo ? (
              <S3Image
                src={host.photo}
                alt={host.name || 'Hôte'}
                className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                fallbackSrc="/profilepic.jpg"
              />
            ) : (
              <InitialsAvatar
                name={host.name || 'Hôte'}
                size="w-20 h-20"
                textSize="text-2xl"
                backgroundColor="bg-gradient-to-br from-blue-500 to-green-500"
                className="border-4 border-white shadow-lg"
              />
            )}
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
      <div className="border rounded-2xl p-6 shadow-sm bg-white mx-4 md:mx-0">
        <h2 className="font-semibold text-lg mb-4">À propos de votre hôte</h2>
        {host ? (
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              {host.photo ? (
                <S3Image
                  src={host.photo}
                  alt={host.name || 'Hôte'}
                  className="w-16 h-16 rounded-full object-cover border-2 border-green-100"
                  fallbackSrc="/profilepic.jpg"
                />
              ) : (
                <InitialsAvatar
                  name={host.name || 'Hôte'}
                  size="w-16 h-16"
                  textSize="text-lg"
                  backgroundColor="bg-gradient-to-br from-green-500 to-blue-500"
                  className="border-2 border-green-100"
                />
              )}
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
        </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-600">Informations sur l'hôte non disponibles</p>
          </div>
        )}
      </div>
            </div>

            {/* Right Column - Sticky Booking Widget */}
            <div className="w-80 flex-shrink-0">
              <div className="sticky top-1/2 -translate-y-1/2">
                <div className="border rounded-2xl p-4 shadow-sm">
                  <h2 className="font-semibold text-lg mb-3">Réserver ce logement</h2>
                  {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
                  
                  {/* Reservation Widget - Vertical Layout for Desktop */}
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="space-y-4">
                      {/* Check-in */}
                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">ARRIVÉE</label>
                        <input
                          type="date"
                          value={checkIn}
                          onChange={(e) => setCheckIn(e.target.value)}
                          className="w-full text-lg font-medium text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      
                      {/* Check-out */}
                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">DÉPART</label>
                        <input
                          type="date"
                          value={checkOut}
                          onChange={(e) => setCheckOut(e.target.value)}
                          className="w-full text-lg font-medium text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                          min={checkIn || new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      
                      {/* Guests */}
                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">VOYAGEURS</label>
                        <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-green-500">
                          <input
                            type="number"
                            min="1"
                            value={guests}
                            onChange={(e) => setGuests(Number(e.target.value))}
                            className="w-full text-lg font-medium text-gray-900 border-none outline-none bg-transparent"
                          />
                          <span className="text-gray-500 ml-1">{guests > 1 ? 'voyageurs' : 'voyageur'}</span>
                        </div>
                      </div>
                      
                      {/* Reserve Button */}
                      <button
                        onClick={handleBooking}
                        disabled={!isLoggedIn || !checkIn || !checkOut || guests < 1}
                        className={`w-full px-6 py-4 rounded-xl text-white font-semibold text-lg transition-all ${
                          !isLoggedIn || !checkIn || !checkOut || guests < 1
                            ? 'bg-gray-400 cursor-not-allowed opacity-60'
                            : 'bg-green-600 hover:bg-green-700 shadow-md hover:shadow-lg'
                        }`}
                      >
                        {!isLoggedIn 
                          ? '🔒 Connectez-vous pour réserver'
                          : 'Réserver'
                        }
                      </button>
                    </div>
                    
                    {/* Disclaimer */}
                    <p className="text-gray-500 text-sm mt-3 text-center">Vous ne serez pas encore débité</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden max-w-4xl mx-auto px-4 py-6 pb-28 space-y-8">
        {/* Mobile Content */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">{title}</h1>
          <button 
            onClick={handleToggleFavorite}
            className="p-3 transition-colors"
            title={isFavorited(propertyId) ? "Retirer des favoris" : "Ajouter aux favoris"}
          >
            <FaHeart
              className={`w-6 h-6 transition-colors duration-300 ${
                isFavorited(propertyId) ? "text-red-500" : "text-gray-300 hover:text-red-400"
              }`}
            />
          </button>
        </div>

        {/* Image Gallery */}
        {photos && photos.length > 0 ? (
          <div className="relative">
            <div className="mx-4">
              <ImageCarousel
                images={photos}
                className="h-80 rounded-2xl shadow-lg cursor-pointer"
                showDots={photos.length > 1}
                showArrows={photos.length > 1}
                onImageClick={handleImageClick}
              />
            </div>
          </div>
        ) : (
          <div className="relative mx-4">
            <S3Image 
              src={mainImage} 
              alt={title} 
              className="w-full h-80 object-cover rounded-2xl shadow-lg" 
              fallbackSrc="/villa1.jpg"
            />
          </div>
        )}
        
        {/* Property Details */}
        <div>
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

        {/* Mobile Booking Widget */}
        <div className="border rounded-2xl p-4 shadow-sm">
          <h2 className="font-semibold text-lg mb-3">Réserver ce logement</h2>
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          
          {/* Reservation Widget - Horizontal Layout for Mobile */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Dates Section */}
              <div className="flex-1 flex flex-col sm:flex-row gap-4 w-full">
                {/* Check-in */}
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">ARRIVÉE</label>
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="w-full text-lg font-medium text-gray-900 border-none outline-none bg-transparent"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                
                {/* Divider */}
                <div className="hidden sm:block w-px bg-gray-200"></div>
                
                {/* Check-out */}
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">DÉPART</label>
                  <input
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full text-lg font-medium text-gray-900 border-none outline-none bg-transparent"
                    min={checkIn || new Date().toISOString().split('T')[0]}
                  />
                </div>
                
                {/* Divider */}
                <div className="hidden sm:block w-px bg-gray-200"></div>
                
                {/* Guests */}
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">VOYAGEURS</label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      min="1"
                      value={guests}
                      onChange={(e) => setGuests(Number(e.target.value))}
                      className="w-full text-lg font-medium text-gray-900 border-none outline-none bg-transparent"
                    />
                    <span className="text-gray-500 ml-1">{guests > 1 ? 'voyageurs' : 'voyageur'}</span>
                  </div>
                </div>
              </div>
              
              {/* Reserve Button */}
              <div className="w-full sm:w-auto">
                <button
                  onClick={handleBooking}
                  disabled={!isLoggedIn || !checkIn || !checkOut || guests < 1}
                  className={`w-full sm:w-auto px-8 py-4 rounded-xl text-white font-semibold text-lg transition-all ${
                    !isLoggedIn || !checkIn || !checkOut || guests < 1
                      ? 'bg-gray-400 cursor-not-allowed opacity-60'
                      : 'bg-green-600 hover:bg-green-700 shadow-md hover:shadow-lg'
                  }`}
                >
                  {!isLoggedIn 
                    ? '🔒 Connectez-vous pour réserver'
                    : 'Réserver'
                  }
                </button>
              </div>
            </div>
            
            {/* Disclaimer */}
            <p className="text-gray-500 text-sm mt-3 text-center">Vous ne serez pas encore débité</p>
          </div>
        </div>

        {/* Features */}
        <div>
          <h2 className="font-semibold text-lg mb-3">Ce que propose ce logement</h2>
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-700 font-medium">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center space-x-2">
                {feature.icon}
                <span>{feature.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Associated Packages */}
        <div>
          <h2 className="font-semibold text-lg mb-3">Les packs associés</h2>
          {associatedPacks && associatedPacks.length > 0 ? (
          <div className="space-y-3">
            {associatedPacks.map((pack, index) => (
                <div key={pack._id || index} className="flex items-center space-x-4 p-4 rounded-xl shadow hover:shadow-lg transition-all cursor-pointer border border-secondary-200 hover:border-primary-300"
                     onClick={() => navigate(`/packages/${pack._id}`)}>
                  <S3Image
                  src={pack.image || '/placeholder-image.jpg'}
                  alt={pack.name || 'Pack image'}
                  className="w-16 h-16 rounded-lg object-cover"
                    fallbackSrc="/placeholder1.jpg"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-secondary-900">{pack.name || 'Unnamed Pack'}</p>
                    <p className="text-sm text-secondary-500">{pack.description || 'Aucune description disponible'}</p>
                    {pack.partnerName && (
                      <p className="text-xs text-primary-600 mt-1">Par {pack.partnerName}</p>
                    )}
                  </div>
                  <div className="text-primary-600">
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

        {/* Map */}
        <div>
          <SinglePropertyMap location={location} />
        </div>

        {/* Reviews */}
        <div>
          <h2 className="font-semibold text-lg mb-3">Avis des clients</h2>
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

        {/* Host Information */}
        {host && (
          <div className="border rounded-2xl p-6 shadow-sm bg-white">
            <h2 className="font-semibold text-lg mb-4">À propos de votre hôte</h2>
            {host ? (
              <div className="flex flex-col items-start justify-between gap-4">
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
                <div className="flex flex-col gap-3 w-full">
                  <button
                    onClick={() => host?.id && navigate(`/owner/${host.id}`)}
                    disabled={!host?.id}
                    className={`px-4 py-2 rounded-xl text-white font-medium transition-all ${host?.id 
                      ? 'bg-green-600 hover:bg-green-700 shadow-md hover:shadow-lg' 
                      : 'bg-gray-300 cursor-not-allowed opacity-50'}`}
                  >
                    👤 Voir le profil
          </button>
        </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-600">Informations sur l'hôte non disponibles</p>
              </div>
            )}
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

      {/* Login Modal */}
      {showLogin && (
        <LoginScreen 
          onClose={handleCloseLogin}
          currentLocation={currentLocation}
        />
      )}

      {/* Signup Modal */}
      {showSignup && (
        <SignUpScreen 
          onClose={handleCloseSignup}
        />
      )}

      {/* Image Viewer Modal */}
      <ImageViewer
        images={photos}
        initialIndex={imageViewerIndex}
        isOpen={imageViewerOpen}
        onClose={handleCloseImageViewer}
      />
    </div>
  );
}