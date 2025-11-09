import React, { useState, useEffect, useContext } from "react";
import { api } from "../../api";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import ImageCarousel from "../../components/ImageCarousel";
import ImageViewer from "../../components/ImageViewer";
import S3Image from "../../components/S3Image";
import { FaArrowLeft, FaStar, FaTimes, FaCamera, FaCheck } from "react-icons/fa";
import { UsersIcon, EnvelopeIcon, PhoneIcon, ClockIcon, CheckBadgeIcon } from "@heroicons/react/24/outline";

const TouristBookings = () => {
  const { user, token, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [packageBookings, setPackageBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [packageLoading, setPackageLoading] = useState(true);
  const [serviceBookings, setServiceBookings] = useState([]);
  const [serviceLoading, setServiceLoading] = useState(true);
  const [error, setError] = useState("");
  const [packageError, setPackageError] = useState("");
  const [serviceError, setServiceError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [activeTab, setActiveTab] = useState("properties"); // "properties" | "packages" | "restaurants"
  
  // Image viewer functionality
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);
  const [imageViewerImages, setImageViewerImages] = useState([]);
  
  // Review functionality
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [reviewData, setReviewData] = useState({
    rating: 0,
    comment: "",
    photos: []
  });
  const [reviewLoading, setReviewLoading] = useState(false);
  const [existingReviews, setExistingReviews] = useState({});

  const formatDate = (date) => {
    if (!date) return "—";
    try {
      return new Date(date).toLocaleDateString("fr-FR", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric"
      });
    } catch {
      return date;
    }
  };

  // Central axios client with relative paths
  const apiCall = async (endpoint, options = {}) => {
    const headers = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    const method = (options.method || "GET").toUpperCase();
    const data = options.body ? (headers["Content-Type"] === 'application/json' ? JSON.parse(options.body) : options.body) : undefined;
    const config = { headers, ...(options.signal ? { signal: options.signal } : {}), ...(options.params ? { params: options.params } : {}) };
    const res = await api.request({ url: endpoint, method, data, ...config });
    return res.data;
  };

  const fetchBookings = async (pageNumber = 1, status = "") => {
    if (!user || user.role !== "tourist") {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      const params = new URLSearchParams({
        page: pageNumber.toString(),
        limit: "10",
      });
      
      if (status) {
        params.append("status", status);
      }

      const data = await apiCall(`/api/booking/my-bookings?${params.toString()}`);

      if (data.success) {
        setBookings(data.bookings || []);
        setPage(data.pagination.current || 1);
        setTotalPages(data.pagination.total || 1);
      } else {
        throw new Error(data.message || "Failed to fetch bookings");
      }
    } catch (err) {
      console.error("Error fetching bookings:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPackageBookings = async (pageNumber = 1, status = "") => {
    if (!user || user.role !== "tourist") {
      setPackageLoading(false);
      return;
    }

    setPackageLoading(true);
    setPackageError("");
    
    try {
      const params = new URLSearchParams({
        page: pageNumber.toString(),
        limit: "10",
      });
      
      if (status) {
        params.append("status", status);
      }

      const data = await apiCall(`/api/packagebooking/user?${params.toString()}`);

      if (data.success) {
        setPackageBookings(data.bookings || []);
      } else {
        throw new Error(data.message || "Failed to fetch package bookings");
      }
    } catch (err) {
      console.error("Error fetching package bookings:", err);
      setPackageError(err.message);
    } finally {
      setPackageLoading(false);
    }
  };

  const fetchServiceBookings = async (status = "") => {
    if (!user || user.role !== "tourist") {
      setServiceLoading(false);
      return;
    }

    setServiceLoading(true);
    setServiceError("");

    try {
      const params = new URLSearchParams();
      if (status) params.append("status", status);

      const data = await apiCall(`/api/service-bookings/my?${params.toString()}`);

      if (data.success) {
        setServiceBookings(data.bookings || []);
      } else {
        throw new Error(data.message || "Failed to fetch service bookings");
      }
    } catch (err) {
      console.error("Error fetching service bookings:", err);
      setServiceError(err.message);
    } finally {
      setServiceLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings(page, statusFilter);
    fetchPackageBookings(page, statusFilter);
  fetchServiceBookings(statusFilter);
  }, [user, token, page, statusFilter]);

  const handleCancel = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;
    
    try {
      const data = await apiCall(`/api/booking/${bookingId}/cancel`, {
        method: "PATCH",
        body: JSON.stringify({ reason: "Guest cancellation" }),
      });

      if (data.success) {
        alert("Booking cancelled successfully!");
        fetchBookings(page, statusFilter);
      } else {
        throw new Error(data.message || "Failed to cancel booking");
      }
    } catch (err) {
      console.error("Error cancelling booking:", err);
      alert(err.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed":
        return "text-green-600 bg-green-100";
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      case "cancelled":
        return "text-red-600 bg-red-100";
      case "rejected":
        return "text-red-600 bg-red-100";
      case "completed":
        return "text-blue-600 bg-blue-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "pending":
        return "En Attente";
      case "confirmed":
        return "Confirmé";
      case "cancelled":
        return "Annulé";
      case "rejected":
        return "Rejeté";
      case "completed":
        return "Terminé";
      default:
        return status;
    }
  };

  const getPackageStatusLabel = (status) => {
    switch (status) {
      case "confirmed":
        return "Confirmé";
      case "cancelled":
        return "Annulé";
      default:
        return status;
    }
  };

  // Review functions
  const openReviewModal = (booking) => {
    setSelectedBooking(booking);
    setReviewData({
      rating: 0,
      comment: "",
      photos: []
    });
    setShowReviewModal(true);
  };

  const closeReviewModal = () => {
    setShowReviewModal(false);
    setSelectedBooking(null);
    setReviewData({
      rating: 0,
      comment: "",
      photos: []
    });
  };

  const handleRatingChange = (rating) => {
    setReviewData(prev => ({ ...prev, rating }));
  };

  const handleCommentChange = (e) => {
    setReviewData(prev => ({ ...prev, comment: e.target.value }));
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    setReviewData(prev => ({ ...prev, photos: [...prev.photos, ...files] }));
  };

  const removePhoto = (index) => {
    setReviewData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  // Image viewer handlers
  const handleImageClick = (images, index) => {
    setImageViewerImages(images);
    setImageViewerIndex(index);
    setImageViewerOpen(true);
  };

  const handleCloseImageViewer = () => {
    setImageViewerOpen(false);
  };

  const submitReview = async () => {
    if (!selectedBooking || reviewData.rating === 0) {
      alert("Please provide a rating");
      return;
    }

    setReviewLoading(true);
    try {
      const formData = new FormData();
      formData.append('propertyId', selectedBooking.property._id);
      formData.append('bookingId', selectedBooking._id);
      formData.append('rating', reviewData.rating);
      formData.append('comment', reviewData.comment);
      
      // Add photos if any
      reviewData.photos.forEach((photo, index) => {
        formData.append(`photos`, photo);
      });

      const response = await api.post(`/api/reviews/`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response?.data) {
        alert("Review submitted successfully!");
        closeReviewModal();
        // Refresh bookings to show updated review status
        fetchBookings();
      } else {
        alert('Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review. Please try again.');
    } finally {
      setReviewLoading(false);
    }
  };

  const canReviewBooking = (booking) => {
    const today = new Date();
    const checkOutDate = new Date(booking.checkOut);
    return booking.status === 'confirmed' && checkOutDate < today;
  };

  const PackageBookingCard = ({ booking }) => {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {booking.package?.name || 'Package Experience'}
            </h3>
            <p className="text-sm text-gray-600 mb-2">
              Par {booking.package?.partner?.fullName || booking.package?.partner?.displayName || booking.package?.partner?.companyName || booking.package?.partner?.organizationName || booking.package?.partnerName || (booking.package?.partner?.email ? booking.package.partner.email.split('@')[0] : 'Partenaire')}
            </p>
            <p className="text-sm text-gray-500 line-clamp-2">
              {booking.package?.description || 'Découvrez une expérience unique avec ce package personnalisé.'}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
            {getPackageStatusLabel(booking.status)}
          </span>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 12V11M4 7h16l-1 10H5L4 7z" />
            </svg>
            {new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}
          </div>
          
          <div className="flex items-center text-sm text-gray-600">
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {booking.guests} invité{booking.guests !== 1 ? 's' : ''}
          </div>
        </div>

        {booking.message && (
          <div className="mb-4 p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-700">
              <strong>Votre message:</strong> {booking.message}
            </p>
          </div>
        )}

        {booking.partnerMessage && (
          <div className="mb-4 p-3 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-700">
              <strong>Message du partenaire:</strong> {booking.partnerMessage}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-green-600 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            <span className="text-lg font-bold text-gray-900">
              {booking.package?.totalPrice ? `${booking.package.totalPrice} MAD` : 'Prix sur demande'}
            </span>
          </div>
          <button
            onClick={() => navigate(`/package-booking/${booking._id}`)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
          >
            Voir détails
          </button>
        </div>
      </div>
    );
  };

  // Authentication checks
  if (!user) {
    return (
      <div className="max-w-7xl mx-auto p-6 pb-28">
        <div className="text-center py-12">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Required</h3>
          <p className="text-gray-500 mb-4">Please log in to view your bookings.</p>
          <button
            onClick={() => navigate("/login")}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (user.role !== "tourist") {
    return (
      <div className="max-w-7xl mx-auto p-6 pb-28">
        <div className="text-center py-12">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-500">Only tourists can view bookings.</p>
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
              onClick={() => navigate('/')}
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
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Mes Réservations</h1>
          <p className="text-gray-600">Gérez et suivez toutes vos réservations</p>
        </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("properties")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "properties"
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Propriétés ({bookings.length})
            </button>
            <button
              onClick={() => setActiveTab("packages")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "packages"
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Packages ({packageBookings.length})
            </button>
            <button
              onClick={() => setActiveTab("restaurants")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "restaurants"
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Restaurants ({serviceBookings.length})
            </button>
          </nav>
        </div>
      </div>

      {/* Status Filter */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <label className="text-sm font-medium text-gray-700">Filtrer par statut:</label>
        <select
          value={statusFilter}
          onChange={(e) => { 
            setStatusFilter(e.target.value); 
            setPage(1); 
          }}
          className="border border-gray-300 rounded-md px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
        >
          <option value="">Tous les statuts</option>
          <option value="pending">En Attente</option>
          <option value="confirmed">Confirmé</option>
          <option value="rejected">Rejeté</option>
          <option value="cancelled">Annulé</option>
          <option value="completed">Terminé</option>
        </select>
      </div>

      {/* Content based on active tab */}
      {activeTab === "properties" && (
        <>
          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Chargement de vos réservations...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                  <button
                    onClick={() => fetchBookings(page, statusFilter)}
                    className="text-sm text-red-600 underline hover:text-red-500 mt-1"
                  >
                    Réessayer
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && bookings.length === 0 && !error && (
            <div className="text-center py-12">
              <div className="mb-4">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 12V11M4 7h16l-1 10H5L4 7z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune réservation trouvée</h3>
              <p className="text-gray-500 mb-4">
                {statusFilter ? `Aucune réservation avec le statut "${statusFilter}"` : "Vous n'avez pas encore fait de réservations."}
              </p>
              <button
                onClick={() => navigate("/explore")}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
              >
                Explorer les propriétés
              </button>
            </div>
          )}
        </>
      )}

      {activeTab === "packages" && (
        <>
          {/* Package Bookings Loading State */}
          {packageLoading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Chargement de vos réservations de packages...</p>
            </div>
          )}

          {/* Package Bookings Error State */}
          {packageError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{packageError}</p>
                  <button
                    onClick={() => fetchPackageBookings(page, statusFilter)}
                    className="text-sm text-red-600 underline hover:text-red-500 mt-1"
                  >
                    Réessayer
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Package Bookings Empty State */}
          {!packageLoading && packageBookings.length === 0 && !packageError && (
            <div className="text-center py-12">
              <div className="mb-4">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune réservation de package</h3>
              <p className="text-gray-500 mb-4">
                {statusFilter ? `Aucune réservation de package avec le statut "${statusFilter}"` : "Vous n'avez pas encore réservé de packages d'expériences."}
              </p>
              <button
                onClick={() => navigate("/packages")}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
              >
                Explorer les packages
              </button>
            </div>
          )}
        </>
      )}

      {activeTab === "restaurants" && (
        <>
          {serviceLoading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Chargement de vos réservations restaurant...</p>
            </div>
          )}

          {serviceError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{serviceError}</p>
                  <button
                    onClick={() => fetchServiceBookings(statusFilter)}
                    className="text-sm text-red-600 underline hover:text-red-500 mt-1"
                  >
                    Réessayer
                  </button>
                </div>
              </div>
            </div>
          )}

          {!serviceLoading && serviceBookings.length === 0 && !serviceError && (
            <div className="text-center py-12">
              <div className="mb-4">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M5 7l1 12h12l1-12M8 7V5a4 4 0 118 0v2" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune réservation restaurant</h3>
              <p className="text-gray-500 mb-4">
                {statusFilter ? `Aucune réservation restaurant avec le statut "${statusFilter}"` : "Vous n'avez pas encore réservé de restaurant."}
              </p>
              <button
                onClick={() => navigate("/restauration")}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
              >
                Explorer les restaurants
              </button>
            </div>
          )}
        </>
      )}

      {/* Bookings Grid */}
      {activeTab === "properties" && !loading && bookings.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookings.map((booking) => (
            <div key={booking._id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
              {/* Property Image */}
              <div className="aspect-w-16 aspect-h-10">
                {booking.property?.photos && booking.property.photos.length > 0 ? (
                  <ImageCarousel
                    images={booking.property.photos}
                    className="h-48 cursor-pointer"
                    showDots={booking.property.photos.length > 1}
                    showArrows={booking.property.photos.length > 1}
                    onImageClick={(index) => handleImageClick(booking.property.photos, index)}
                  />
                ) : (
                  <S3Image
                    src={booking.property?.photos?.[0] || "/placeholder.jpg"}
                    alt={booking.property?.title || "Property"}
                    className="w-full h-48 object-cover"
                    fallbackSrc="/placeholder.jpg"
                  />
                )}
              </div>

              {/* Card Content */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 text-lg mb-1 truncate">
                  {booking.property?.title || "Unknown Property"}
                </h3>
                
                <p className="text-gray-600 text-sm mb-3 flex items-center">
                  <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {booking.property?.localisation 
                    ? (typeof booking.property.localisation === 'string' 
                        ? booking.property.localisation 
                        : `${booking.property.localisation.city || ''}, ${booking.property.localisation.address || ''}`.replace(/^, |, $/, '') || "Location not specified")
                    : "Location not specified"}
                </p>

                {/* Booking Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 12V11M4 7h16l-1 10H5L4 7z" />
                    </svg>
                    {new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {booking.guests} guest{booking.guests !== 1 ? 's' : ''}
                  </div>
                </div>

                {/* Status and Price */}
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                    {getStatusLabel(booking.status)}
                  </span>
                  <span className="font-semibold text-gray-900">
                    {booking.totalAmount} MAD
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {(booking.status === "pending" || booking.status === "confirmed") && (
                    <button
                      onClick={() => handleCancel(booking._id)}
                      className="flex-1 bg-red-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                  
                  {/* Review Button for completed bookings */}
                  {canReviewBooking(booking) && (
                    <button
                      onClick={() => openReviewModal(booking)}
                      className="flex-1 bg-yellow-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-colors flex items-center justify-center gap-1"
                    >
                      <FaStar className="w-3 h-3" />
                      Review
                    </button>
                  )}
                  
                  <button
                    onClick={() => navigate(`/booking/${booking._id}`)}
                    className="flex-1 bg-green-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-8 px-4 py-3 bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center">
            <p className="text-sm text-gray-700">
              Page <span className="font-medium">{page}</span> of{" "}
              <span className="font-medium">{totalPages}</span>
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
              className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Package Bookings Grid */}
      {activeTab === "packages" && !packageLoading && packageBookings.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packageBookings.map((booking) => (
            <PackageBookingCard key={booking._id} booking={booking} />
          ))}
        </div>
      )}

      {activeTab === "restaurants" && !serviceLoading && serviceBookings.length > 0 && (
        <div className="space-y-4">
          {serviceBookings.map((booking) => (
            <div key={booking._id} className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {booking.service?.title || booking.service?.businessName || "Restaurant"}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                      {getStatusLabel(booking.status)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
                    <div className="flex items-center gap-2">
                      <ClockIcon className="w-4 h-4" />
                      <span>
                        {formatDate(booking.reservationDate)} — <strong>{booking.reservationTime}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <UsersIcon className="w-4 h-4" />
                      <span>{booking.partySize} convive{booking.partySize > 1 ? 's' : ''}</span>
                    </div>
                    {booking.tableAssignment?.tableNumber && (
                      <div className="flex items-center gap-2 text-green-700">
                        <CheckBadgeIcon className="w-4 h-4" />
                        <span>
                          Table {booking.tableAssignment.tableNumber} (capacité {booking.tableAssignment.capacity})
                        </span>
                      </div>
                    )}
                  </div>

                  {booking.menuSelections?.length > 0 && (
                    <div className="bg-green-50 border border-green-100 rounded-lg p-3">
                      <span className="text-sm font-semibold text-green-800 block mb-2">Plats sélectionnés :</span>
                      <ul className="list-disc list-inside text-sm text-green-900 space-y-1">
                        {booking.menuSelections.map((item, index) => (
                          <li key={index}>
                            {item.quantity || 1} × {item.name} — {item.price} MAD
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {booking.status === "cancelled" && booking.cancellation?.reason && (
                    <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-sm text-red-700">
                      <span className="font-semibold block mb-1">Raison de l'annulation :</span>
                      {booking.cancellation.reason}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 min-w-[200px]">
                  {booking.service?.contactPhone && (
                    <button
                      onClick={() => window.open(`tel:${booking.service.contactPhone}`, '_self')}
                      className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 transition"
                    >
                      <PhoneIcon className="w-4 h-4" />
                      Contacter le restaurant
                    </button>
                  )}
                  {booking.service?.contactEmail && (
                    <button
                      onClick={() => (window.location.href = `mailto:${booking.service.contactEmail}`)}
                      className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 transition"
                    >
                      <EnvelopeIcon className="w-4 h-4" />
                      Envoyer un email
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Write a Review</h3>
              <button
                onClick={closeReviewModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Property Info */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-1">
                  {selectedBooking.property?.title || "Property"}
                </h4>
                <p className="text-sm text-gray-600">
                  {new Date(selectedBooking.checkIn).toLocaleDateString()} - {new Date(selectedBooking.checkOut).toLocaleDateString()}
                </p>
              </div>

              {/* Rating */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rating *
                </label>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleRatingChange(star)}
                      className={`p-1 ${
                        star <= reviewData.rating
                          ? 'text-yellow-400'
                          : 'text-gray-300'
                      } hover:text-yellow-400 transition-colors`}
                    >
                      <FaStar className="w-6 h-6" />
                    </button>
                  ))}
                </div>
                {reviewData.rating > 0 && (
                  <p className="text-sm text-gray-600 mt-1">
                    {reviewData.rating} star{reviewData.rating !== 1 ? 's' : ''}
                  </p>
                )}
              </div>

              {/* Comment */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comment
                </label>
                <textarea
                  value={reviewData.comment}
                  onChange={handleCommentChange}
                  placeholder="Share your experience..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  rows={4}
                />
              </div>

              {/* Photo Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Photos (Optional)
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                
                {/* Display selected photos */}
                {reviewData.photos.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {reviewData.photos.map((photo, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(photo)}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-20 object-cover rounded-md"
                        />
                        <button
                          onClick={() => removePhoto(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          <FaTimes className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={closeReviewModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={submitReview}
                  disabled={reviewLoading || reviewData.rating === 0}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {reviewLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <FaCheck className="w-4 h-4" />
                      Submit Review
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Viewer Modal */}
      <ImageViewer
        images={imageViewerImages}
        initialIndex={imageViewerIndex}
        isOpen={imageViewerOpen}
        onClose={handleCloseImageViewer}
      />
      </div>
    </div>
  );
};

export default TouristBookings;