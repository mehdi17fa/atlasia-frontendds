import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
// import S3Image from "../../components/S3Image";
import ImageCarousel from "../../components/ImageCarousel";
import { FaArrowLeft, FaStar, FaCheck } from "react-icons/fa";

const BookingDetails = () => {
  const { user, token, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const { bookingId } = useParams();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Review functionality
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewData, setReviewData] = useState({
    rating: 0,
    comment: ""
  });
  const [reviewLoading, setReviewLoading] = useState(false);
  const [existingReview, setExistingReview] = useState(null);
  const [hasReviewed, setHasReviewed] = useState(false);

  // Create API instance with proper headers
  const apiCall = async (endpoint, options = {}) => {
    const baseURL = process.env.REACT_APP_API_URL;
    const url = `${baseURL}${endpoint}`;
    
    const defaultHeaders = {
      "Content-Type": "application/json",
    };

    if (token) {
      defaultHeaders.Authorization = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      if (response.status === 401) {
        logout();
        navigate("/login");
        throw new Error("Session expired. Please log in again.");
      }
      
      const errorData = await response.json().catch(() => ({ message: "Request failed" }));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  };

  const fetchBookingDetails = async () => {
    if (!user || !bookingId) {
      setLoading(false);
      return;
    }

    // Check if user has a valid token
    if (!token) {
      setError("You must be logged in to view booking details");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      const data = await apiCall(`/api/booking/${bookingId}`);

      if (data.success) {
        setBooking(data.booking);
      } else {
        throw new Error(data.message || "Failed to fetch booking details");
      }
    } catch (err) {
      console.error("Error fetching booking details:", err);
      
      // Handle specific error cases
      if (err.message.includes("Session expired") || err.message.includes("Unauthorized")) {
        setError("Your session has expired. Please log in again.");
        logout();
        navigate("/login");
      } else if (err.message.includes("Not authorized")) {
        setError("You don't have permission to view this booking.");
      } else if (err.message.includes("Booking not found")) {
        setError("This booking doesn't exist or has been removed.");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookingDetails();
  }, [user, token, bookingId]);

  const handleCancel = async () => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;
    
    try {
      const data = await apiCall(`/api/booking/${bookingId}/cancel`, {
        method: "PATCH",
        body: JSON.stringify({ reason: "Guest cancellation" }),
      });

      if (data.success) {
        alert("Booking cancelled successfully!");
        fetchBookingDetails(); // Refresh data
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
        return "text-green-800 bg-green-100 border-green-200";
      case "pending":
        return "text-yellow-800 bg-yellow-100 border-yellow-200";
      case "cancelled":
        return "text-red-800 bg-red-100 border-red-200";
      case "rejected":
        return "text-red-800 bg-red-100 border-red-200";
      case "completed":
        return "text-blue-800 bg-blue-100 border-blue-200";
      default:
        return "text-gray-800 bg-gray-100 border-gray-200";
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

  const formatLocation = (localisation) => {
    if (!localisation) return "Location not specified";
    if (typeof localisation === 'string') return localisation;
    return `${localisation.city || ''}, ${localisation.address || ''}`.replace(/^, |, $/, '') || "Location not specified";
  };

  // Review functions
  const openReviewModal = () => {
    setReviewData({
      rating: existingReview?.rating || 0,
      comment: existingReview?.comment || "",
      photos: []
    });
    setShowReviewModal(true);
  };

  const closeReviewModal = () => {
    setShowReviewModal(false);
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


  const submitReview = async () => {
    if (!booking || reviewData.rating === 0) {
      alert("Please provide a rating");
      return;
    }

    setReviewLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/reviews/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          propertyId: booking.property._id,
          bookingId: booking._id,
          rating: reviewData.rating,
          comment: reviewData.comment
        })
      });

      if (response.ok) {
        alert("Review submitted successfully!");
        setReviewData({ rating: 0, comment: "" });
        setHasReviewed(true);
        // Refresh booking details
        fetchBookingDetails();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message || 'Failed to submit review'}`);
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review. Please try again.');
    } finally {
      setReviewLoading(false);
    }
  };

  const canReviewBooking = (booking) => {
    if (!booking) return false;
    
    const today = new Date();
    const checkOutDate = new Date(booking.checkOut);
    
    return booking.status === 'confirmed' && checkOutDate < today;
  };

  // Check if user has already reviewed this booking
  const checkExistingReview = async () => {
    if (!booking || !user) return;
    
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/reviews/property/${booking.property._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const userReview = data.reviews?.find(review => review.user._id === user._id);
        if (userReview) {
          setExistingReview(userReview);
          setHasReviewed(true);
        }
      }
    } catch (error) {
      console.error('Error checking existing review:', error);
    }
  };

  // Load existing review when booking is loaded
  useEffect(() => {
    if (booking && user) {
      checkExistingReview();
    }
  }, [booking, user]);

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6 pb-28">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Required</h3>
          <p className="text-gray-500 mb-4">Please log in to view booking details.</p>
          <button
            onClick={() => navigate("/login")}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 pb-28">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6 pb-28">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
              <div className="mt-2">
                <button
                  onClick={fetchBookingDetails}
                  className="text-sm text-red-600 underline hover:text-red-500"
                >
                  Try again
                </button>
                <span className="mx-2 text-red-400">|</span>
                <button
                  onClick={() => navigate("/my-bookings")}
                  className="text-sm text-red-600 underline hover:text-red-500"
                >
                  Back to bookings
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-4xl mx-auto p-6 pb-28">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Booking not found</h3>
          <p className="text-gray-500 mb-4">The booking you're looking for doesn't exist or you don't have access to it.</p>
          <button
            onClick={() => navigate("/my-bookings")}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
          >
            Back to My Bookings
          </button>
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
              onClick={() => navigate('/my-bookings')}
              className="flex items-center justify-center w-10 h-10 text-green-700 hover:text-green-800 hover:bg-green-50 rounded-full transition-colors"
            >
              <FaArrowLeft className="w-5 h-5" />
            </button>

            {/* Center: Atlasia Branding */}
            <div className="text-center">
              <div className="font-bold text-green-700 text-2xl">
                Atlasia
              </div>
            </div>

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

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Header Section */}
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                    Booking Details
                  </h1>
                  <p className="text-gray-600 text-sm sm:text-base">
                    Manage your reservation and share your experience
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className={`px-4 py-2 rounded-full text-sm font-semibold border-2 ${getStatusColor(booking.status)}`}>
                    {getStatusLabel(booking.status)}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Booking ID</p>
                    <p className="text-sm font-mono text-gray-700">{booking._id.slice(-8)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            {/* Main Content - Left Column */}
            <div className="lg:col-span-8 space-y-6">
              {/* Property Card */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                {/* Property Image */}
                <div className="relative h-64 sm:h-80 lg:h-96">
                  {booking.property?.photos && booking.property.photos.length > 0 ? (
                    <ImageCarousel
                      images={booking.property.photos}
                      className="h-full"
                      showDots={booking.property.photos.length > 1}
                      showArrows={booking.property.photos.length > 1}
                    />
                  ) : (
                    <div className="h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <div className="text-center">
                        <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-gray-500 font-medium">No images available</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Property Details */}
                <div className="p-6 sm:p-8">
                  <div className="mb-6">
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                      {booking.property?.title || "Unknown Property"}
                    </h2>
                    <div className="flex items-center text-gray-600 mb-4">
                      <svg className="h-5 w-5 mr-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-lg">{formatLocation(booking.property?.localisation)}</span>
                    </div>
                  </div>
                  
                  {/* Amenities */}
                  {booking.property?.equipments && booking.property.equipments.length > 0 && (
                    <div className="border-t border-gray-100 pt-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Amenities</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {booking.property.equipments.map((equipment, index) => (
                          <div key={index} className="flex items-center p-3 bg-green-50 rounded-xl border border-green-100">
                            <svg className="w-4 h-4 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm font-medium text-green-800">{equipment}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Booking Timeline */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Booking Timeline</h3>
                </div>
                <div className="space-y-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-900">Booking Created</p>
                  <p className="text-sm text-gray-600">{new Date(booking.createdAt).toLocaleString()}</p>
                </div>
              </div>

              {booking.confirmedAt && (
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">Booking Confirmed</p>
                    <p className="text-sm text-gray-600">{new Date(booking.confirmedAt).toLocaleString()}</p>
                  </div>
                </div>
              )}

              {booking.cancelledAt && (
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="h-4 w-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">Booking Cancelled</p>
                    <p className="text-sm text-gray-600">{new Date(booking.cancelledAt).toLocaleString()}</p>
                    {booking.cancellation?.reason && (
                      <p className="text-sm text-gray-500">Reason: {booking.cancellation.reason}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Messages */}
          {(booking.guestMessage || booking.ownerResponse?.message) && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Messages</h3>
              
              {booking.guestMessage && (
                <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-900 mb-1">Your message to the host:</p>
                  <p className="text-sm text-blue-800">{booking.guestMessage}</p>
                </div>
              )}

              {booking.ownerResponse?.message && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm font-medium text-green-900 mb-1">Host response:</p>
                  <p className="text-sm text-green-800">{booking.ownerResponse.message}</p>
                  <p className="text-xs text-green-600 mt-1">
                    {new Date(booking.ownerResponse.respondedAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Existing Review Section */}
        {hasReviewed && existingReview && (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-8 shadow-lg">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mr-4">
                <FaStar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-green-900">Your Review</h3>
                <p className="text-green-700">Thank you for sharing your experience!</p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <FaStar
                      key={star}
                      className={`w-6 h-6 ${
                        star <= existingReview.rating ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-lg font-semibold text-green-800">
                  {existingReview.rating} star{existingReview.rating !== 1 ? 's' : ''} - {
                    existingReview.rating === 1 ? 'Poor' :
                    existingReview.rating === 2 ? 'Fair' :
                    existingReview.rating === 3 ? 'Good' :
                    existingReview.rating === 4 ? 'Very Good' :
                    existingReview.rating === 5 ? 'Excellent' : ''
                  }
                </span>
              </div>
              
              {existingReview.comment && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Your Comment:</p>
                  <p className="text-gray-800 italic leading-relaxed">
                    "{existingReview.comment}"
                  </p>
                </div>
              )}
              
              <div className="flex items-center text-sm text-green-600">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Reviewed on {new Date(existingReview.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        )}

        {/* Remove duplicate inline review panel; we'll use the styled section below */}

              {/* Review Section */}
              <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mb-4 shadow-lg">
                    <FaStar className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Partagez votre expérience</h3>
                  <p className="text-gray-600">Aidez d'autres voyageurs en évaluant votre séjour</p>
                </div>
                
                <div className="max-w-2xl mx-auto space-y-6">
                  {/* Rating */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <label className="block text-lg font-semibold text-gray-900 mb-4 text-center">
                      Comment s'est passé votre séjour ? *
                    </label>
                    <div className="flex justify-center space-x-2 mb-4">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => handleRatingChange(star)}
                          className={`p-3 rounded-full transition-all duration-300 transform hover:scale-110 ${
                            star <= reviewData.rating
                              ? 'text-yellow-400 bg-yellow-50 shadow-lg'
                              : 'text-gray-300 hover:text-yellow-400 hover:bg-yellow-50'
                          }`}
                        >
                          <FaStar className="w-8 h-8" />
                        </button>
                      ))}
                    </div>
                    {reviewData.rating > 0 && (
                      <div className="text-center">
                        <div className="inline-block bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg px-6 py-3 border border-yellow-200">
                          <p className="text-lg font-semibold text-gray-900">
                            {reviewData.rating} star{reviewData.rating !== 1 ? 's' : ''} - {
                              reviewData.rating === 1 ? 'Poor' :
                              reviewData.rating === 2 ? 'Fair' :
                              reviewData.rating === 3 ? 'Good' :
                              reviewData.rating === 4 ? 'Very Good' :
                              reviewData.rating === 5 ? 'Excellent' : ''
                            }
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Comment */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <label className="block text-lg font-semibold text-gray-900 mb-4">
                      Parlez-nous davantage de votre expérience
                    </label>
                    <textarea
                      value={reviewData.comment}
                      onChange={handleCommentChange}
                      placeholder="Qu'avez-vous apprécié ? Que peut-on améliorer ? Partagez vos impressions..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none text-gray-700 placeholder-gray-500"
                      rows={4}
                    />
                    <p className="text-sm text-gray-500 mt-2 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Votre avis aide les autres voyageurs à faire un choix éclairé
                    </p>
                  </div>

                  {/* Submit Button */}
                  <div className="text-center">
                    <button
                      onClick={submitReview}
                      disabled={reviewLoading || reviewData.rating === 0}
                      className="bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-4 rounded-xl hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-4 focus:ring-green-300 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-3 font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 mx-auto"
                    >
                      {reviewLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Envoi de l'avis...
                        </>
                      ) : (
                        <>
                          <FaCheck className="w-5 h-5" />
                          Publier l'avis
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

            {/* Sidebar - Right Column */}
            <div className="lg:col-span-4 space-y-6">
              {/* Booking Summary */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-4">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Booking Summary</h3>
                </div>
            
            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <svg className="h-4 w-4 mr-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 12V11M4 7h16l-1 10H5L4 7z" />
                </svg>
                <div>
                  <p className="font-medium text-gray-900">Check-in</p>
                  <p className="text-gray-600">{new Date(booking.checkIn).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="flex items-center text-sm">
                <svg className="h-4 w-4 mr-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 12V11M4 7h16l-1 10H5L4 7z" />
                </svg>
                <div>
                  <p className="font-medium text-gray-900">Check-out</p>
                  <p className="text-gray-600">{new Date(booking.checkOut).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="flex items-center text-sm">
                <svg className="h-4 w-4 mr-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <div>
                  <p className="font-medium text-gray-900">Guests</p>
                  <p className="text-gray-600">{booking.guests} guest{booking.guests !== 1 ? 's' : ''}</p>
                </div>
              </div>

              <div className="flex items-center text-sm">
                <svg className="h-4 w-4 mr-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-medium text-gray-900">Duration</p>
                  <p className="text-gray-600">{booking.totalNights} night{booking.totalNights !== 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">Total</span>
                <span className="text-lg font-bold text-green-600">${booking.totalAmount}</span>
              </div>
              {booking.subtotal !== booking.totalAmount && (
                <div className="text-sm text-gray-600 mt-1">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${booking.subtotal}</span>
                  </div>
                  {booking.serviceFee > 0 && (
                    <div className="flex justify-between">
                      <span>Service fee:</span>
                      <span>${booking.serviceFee}</span>
                    </div>
                  )}
                  {booking.taxes > 0 && (
                    <div className="flex justify-between">
                      <span>Taxes:</span>
                      <span>${booking.taxes}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Host Info */}
          {booking.owner && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Host Information</h3>
              <div className="flex items-center">
                <img
                  src={booking.owner.profileImage || "https://via.placeholder.com/50x50?text=Host"}
                  alt={booking.owner.name}
                  className="w-12 h-12 rounded-full mr-4"
                />
                <div>
                  <p className="font-medium text-gray-900">{booking.owner.name}</p>
                  <p className="text-sm text-gray-600">{booking.owner.email}</p>
                  {booking.owner.phoneNumber && (
                    <p className="text-sm text-gray-600">{booking.owner.phoneNumber}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          {(booking.status === "pending" || booking.status === "confirmed") && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Actions</h3>
              <button
                onClick={handleCancel}
                className="w-full bg-red-600 text-white px-4 py-2 rounded-md font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
              >
                Cancel Booking
              </button>
              {booking.status === "confirmed" && (
                <p className="text-sm text-gray-600 mt-2">
                  Cancellation policy applies. Refund amount depends on cancellation timing.
                </p>
              )}
            </div>
          )}

          {/* Refund Info */}
          {booking.status === "cancelled" && booking.cancellation?.refundAmount > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-medium text-green-900 mb-2">Refund Information</h3>
              <p className="text-sm text-green-800">
                Refund amount: <span className="font-semibold">${booking.cancellation.refundAmount}</span>
              </p>
              <p className="text-xs text-green-600 mt-1">
                Refunds are typically processed within 3-5 business days.
              </p>
            </div>
          )}
            </div>
          </div>

          {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Write a Review</h3>
              <button
                onClick={closeReviewModal}
                className="text-gray-400 hover:text-gray-600 transition-colors text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Property Info */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-1">
                  {booking.property?.title || "Property"}
                </h4>
                <p className="text-sm text-gray-600">
                  {new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}
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
        </div>
      </div>
    </div>
  );
};

export default BookingDetails;