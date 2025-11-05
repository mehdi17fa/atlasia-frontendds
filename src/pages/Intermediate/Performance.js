import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaStar, FaHome, FaCalendarAlt, FaDollarSign, FaChartLine } from 'react-icons/fa';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../api';

const monthBoundaries = (date) => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
};

const parseDate = (value) => {
  if (!value) return null;
  const candidate = new Date(value);
  if (!Number.isNaN(candidate.getTime())) return candidate;

  const numericValue = typeof value === 'number' ? value : Number.parseInt(value, 10);
  if (!Number.isNaN(numericValue)) {
    const numericDate = new Date(numericValue);
    if (!Number.isNaN(numericDate.getTime())) return numericDate;
  }
  return null;
};

const normaliseNumber = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const chooseMetric = (baseValue, computedValue) => {
  const baseNum = normaliseNumber(baseValue);
  const computedNum = normaliseNumber(computedValue);

  if (computedNum > 0 && baseNum <= 0) return computedNum;
  if (baseNum > 0 && computedNum <= 0) return baseNum;
  if (computedNum > 0 && baseNum > 0) return computedNum;
  return Math.max(baseNum, computedNum, 0);
};

const extractReservations = (properties = []) => {
  return properties.flatMap((property) => {
    const reservations = Array.isArray(property?.reservations)
      ? property.reservations
      : Array.isArray(property?.bookings)
        ? property.bookings
        : [];
    return reservations.map((reservation) => ({ ...reservation, __propertyId: property?._id }));
  });
};

const nightsWithinMonth = (reservation, start, end) => {
  const checkIn = parseDate(reservation?.checkIn || reservation?.startDate || reservation?.from || reservation?.createdAt);
  const checkOutRaw = reservation?.checkOut || reservation?.endDate || reservation?.to;
  const checkOut = parseDate(checkOutRaw) || (checkIn ? new Date(checkIn.getTime() + 24 * 60 * 60 * 1000) : null);
  if (!checkIn || !checkOut) return 0;

  const overlapStart = checkIn > start ? checkIn : start;
  const overlapEnd = checkOut < end ? checkOut : end;
  const diff = overlapEnd.getTime() - overlapStart.getTime();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const extractReviewsFromProperties = (properties = []) => {
  return properties.flatMap((property) => {
    if (!Array.isArray(property?.reviews)) return [];
    return property.reviews.map((review, index) => ({
      id: review?._id || review?.id || `${property?._id || 'property'}-${index}`,
      customerName: review?.customerName || review?.guestName || review?.user?.fullName || review?.user?.displayName || review?.user?.name || 'Client',
      rating: normaliseNumber(review?.rating ?? review?.note ?? review?.score),
      comment: review?.comment || review?.message || review?.text || ''
    }));
  });
};

const extractReviewsFromPayload = (reviews = []) => {
  return reviews.map((review, index) => ({
    id: review?._id || review?.id || `api-review-${index}`,
    customerName: review?.customerName || review?.guestName || review?.user?.fullName || review?.user?.displayName || review?.user?.name || 'Client',
    rating: normaliseNumber(review?.rating ?? review?.note ?? review?.score),
    comment: review?.comment || review?.message || review?.text || ''
  }));
};

const computeAggregatedMetrics = ({ basePerformance, properties, packageBookings }) => {
  const managedProperties = chooseMetric(basePerformance?.managedProperties, properties.length);

  const reservationsFromProperties = extractReservations(properties);
  const bookings = Array.isArray(packageBookings) ? packageBookings : [];
  const now = new Date();
  const { start, end } = monthBoundaries(now);
  const daysInMonth = end.getDate();

  const propertyMonthlyReservations = reservationsFromProperties.filter((reservation) => {
    const date = parseDate(reservation?.checkIn || reservation?.startDate || reservation?.from || reservation?.createdAt);
    return date && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;

  const packageMonthlyReservations = bookings.filter((booking) => {
    const date = parseDate(booking?.checkIn || booking?.startDate || booking?.createdAt);
    return date && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;

  const computedMonthlyReservations = propertyMonthlyReservations + packageMonthlyReservations;

  const propertyRevenue = reservationsFromProperties.reduce((sum, reservation) => {
    const amount = reservation?.totalAmount ?? reservation?.totalPrice ?? reservation?.amount ?? reservation?.price ?? 0;
    return sum + normaliseNumber(amount);
  }, 0);

  const packageRevenue = bookings.reduce((sum, booking) => {
    const amount = booking?.totalAmount ?? booking?.totalPrice ?? booking?.amount ?? booking?.price ?? 0;
    return sum + normaliseNumber(amount);
  }, 0);

  const computedTotalRevenue = propertyRevenue + packageRevenue;

  const totalReservedNights = reservationsFromProperties.reduce((total, reservation) => {
    return total + nightsWithinMonth(reservation, start, end);
  }, 0);

  const computedOccupancy = managedProperties > 0 && daysInMonth > 0
    ? Math.min(100, Math.round((totalReservedNights / (managedProperties * daysInMonth)) * 100))
    : 0;

  const combinedReviews = [
    ...extractReviewsFromPayload(basePerformance?.reviews || []),
    ...extractReviewsFromProperties(properties)
  ].filter((review, index, self) => review.rating > 0 && index === self.findIndex((r) => r.id === review.id));

  const averageRating = combinedReviews.length > 0
    ? combinedReviews.reduce((sum, review) => sum + review.rating, 0) / combinedReviews.length
    : basePerformance?.rating || 0;

  return {
    managedProperties: Math.round(managedProperties),
    monthlyReservations: Math.round(chooseMetric(basePerformance?.monthlyReservations, computedMonthlyReservations)),
    totalRevenue: chooseMetric(basePerformance?.totalRevenue, computedTotalRevenue),
    occupancyRate: chooseMetric(basePerformance?.occupancyRate, computedOccupancy),
    rating: averageRating,
    reviews: combinedReviews.slice(0, 6)
  };
};

const Performance = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [performanceData, setPerformanceData] = useState({
    managedProperties: 0,
    monthlyReservations: 0,
    totalRevenue: 0,
    occupancyRate: 0,
    rating: 5.0,
    reviews: []
  });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    fetchPerformanceData();
  }, [user]);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);

      const [performanceResponse, propertiesResponse, packageBookingsResponse] = await Promise.all([
        api.get('/api/partner/performance').catch((error) => {
          if (error.response?.status === 404) return null;
          throw error;
        }),
        api.get('/api/partner/my-properties'),
        api.get('/api/packagebooking/partner').catch((error) => {
          if ([400, 404].includes(error.response?.status)) return null;
          throw error;
        })
      ]);

      const basePerformance = performanceResponse?.data?.success
        ? (performanceResponse.data.data || performanceResponse.data.performance || {})
        : {};

      const properties = propertiesResponse?.data?.success && Array.isArray(propertiesResponse.data.properties)
        ? propertiesResponse.data.properties
        : [];

      const packageBookings = packageBookingsResponse?.data?.success && Array.isArray(packageBookingsResponse.data.bookings)
        ? packageBookingsResponse.data.bookings
        : [];

      const aggregated = computeAggregatedMetrics({
        basePerformance,
        properties,
        packageBookings
      });

      setPerformanceData(aggregated);
    } catch (error) {
      console.error('Error fetching performance data:', error);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      const message = error.response?.data?.message || "Impossible de charger les données de performance. Vérifiez votre connexion.";
      setPerformanceData({
        managedProperties: 0,
        monthlyReservations: 0,
        totalRevenue: 0,
        occupancyRate: 0,
        rating: 0,
        reviews: []
      });
      setErrorMessage(message);

      if (error.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate('/acceuill');
  };

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    return (
      <div className="flex items-center gap-1">
        {[...Array(fullStars)].map((_, i) => (
          <FaStar key={i} className="text-yellow-400" />
        ))}
        {hasHalfStar && <FaStar className="text-yellow-400 opacity-50" />}
        {[...Array(5 - fullStars - (hasHalfStar ? 1 : 0))].map((_, i) => (
          <FaStar key={i + fullStars + (hasHalfStar ? 1 : 0)} className="text-gray-300" />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des performances...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* Header Section */}
      <div className="sticky top-0 z-50 bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            {/* Left: Back Button */}
            <button
              onClick={handleGoBack}
              className="flex items-center justify-center w-10 h-10 text-green-700 hover:text-green-800 hover:bg-green-50 rounded-full transition-colors"
            >
              <FaArrowLeft className="w-5 h-5" />
            </button>

            {/* Right: Account Icon */}
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center justify-center w-10 h-10 bg-green-600 text-white hover:bg-green-700 rounded-full transition-colors font-semibold text-sm"
            >
              {user?.fullName ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Section Title */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Performance Partenaire
          </h1>
          <p className="text-gray-600">
            {user?.fullName || 'M. Ezzaim'}
          </p>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="text-red-600 mr-3">⚠️</div>
              <div>
                <h4 className="text-red-800 font-medium">Erreur de connexion</h4>
                <p className="text-red-700 text-sm">{errorMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Performance Cards - Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 md:p-6 rounded-lg border border-green-200 transition-transform hover:shadow-lg hover:scale-[1.02]">
            <div className="flex items-center justify-between mb-2">
              <FaHome className="text-green-600 w-5 h-5 md:w-6 md:h-6" />
              <span className="text-2xl md:text-3xl font-bold text-green-700">{performanceData.managedProperties || 0}</span>
            </div>
            <p className="text-sm md:text-base text-gray-700">Propriétés Gérées</p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 md:p-6 rounded-lg border border-blue-200 transition-transform hover:shadow-lg hover:scale-[1.02]">
            <div className="flex items-center justify-between mb-2">
              <FaCalendarAlt className="text-blue-600 w-5 h-5 md:w-6 md:h-6" />
              <span className="text-2xl md:text-3xl font-bold text-blue-700">{performanceData.monthlyReservations || 0}</span>
            </div>
            <p className="text-sm md:text-base text-gray-700">Réservations du mois</p>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 md:p-6 rounded-lg border border-yellow-200 transition-transform hover:shadow-lg hover:scale-[1.02]">
            <div className="flex items-center justify-between mb-2">
              <FaDollarSign className="text-yellow-600 w-5 h-5 md:w-6 md:h-6" />
              <span className="text-xl md:text-2xl font-bold text-yellow-700">{(performanceData.totalRevenue || 0).toLocaleString()} MAD</span>
            </div>
            <p className="text-sm md:text-base text-gray-700">Revenu Total</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 md:p-6 rounded-lg border border-purple-200 transition-transform hover:shadow-lg hover:scale-[1.02]">
            <div className="flex items-center justify-between mb-2">
              <FaChartLine className="text-purple-600 w-5 h-5 md:w-6 md:h-6" />
              <span className="text-2xl md:text-3xl font-bold text-purple-700">{Math.max(0, Math.round(performanceData.occupancyRate || 0))}%</span>
            </div>
            <p className="text-sm md:text-base text-gray-700">Taux d'occupation</p>
          </div>
        </div>

        {/* Main Content Grid - Desktop: 2 columns, Mobile: 1 column */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Rating Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6">
            <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-4">Note Moyenne</h3>
            <div className="flex items-center gap-3 mb-4">
              {renderStars(performanceData.rating || 0)}
              <span className="text-lg md:text-xl font-medium text-gray-700">
                {(performanceData.rating || 0).toFixed(1)} sur 5
              </span>
            </div>
            <div className="text-sm text-gray-600">
              Basé sur {performanceData.reviews?.length || 0} avis clients
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6">
            <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-4">Statistiques Rapides</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Revenu moyen par propriété</span>
                <span className="font-semibold text-gray-900">
                  {performanceData.managedProperties > 0 
                    ? Math.round((performanceData.totalRevenue || 0) / performanceData.managedProperties).toLocaleString() 
                    : 0} MAD
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Réservations moyennes</span>
                <span className="font-semibold text-gray-900">
                  {performanceData.managedProperties > 0 
                    ? Math.round((performanceData.monthlyReservations || 0) / performanceData.managedProperties) 
                    : 0} / mois
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Performance</span>
                <span className={`font-semibold ${
                  (performanceData.occupancyRate || 0) >= 80 ? 'text-green-600' :
                  (performanceData.occupancyRate || 0) >= 60 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {(performanceData.occupancyRate || 0) >= 80 ? 'Excellent' :
                   (performanceData.occupancyRate || 0) >= 60 ? 'Bon' : 'À améliorer'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Reviews - Full Width */}
        <div className="mt-8">
          <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-6">Avis Clients</h2>
          {(performanceData.reviews || []).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {(performanceData.reviews || []).map((review) => (
                <div key={review.id} className="bg-white border border-gray-200 rounded-lg p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-medium text-gray-800">{review.customerName}</p>
                    <div className="flex items-center gap-1">
                      {renderStars(review.rating)}
                    </div>
                  </div>
                  <p className="text-sm md:text-base text-gray-600 leading-relaxed">{review.comment}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
              <div className="text-gray-400 mb-4">
                <FaStar className="w-12 h-12 mx-auto opacity-30" />
              </div>
              <h3 className="text-lg font-medium text-gray-600 mb-2">Aucun avis client</h3>
              <p className="text-gray-500">
                Les avis apparaîtront ici une fois que vous aurez des réservations confirmées sur vos propriétés gérées.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Performance;