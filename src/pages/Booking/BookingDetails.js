import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import S3Image from "../../components/S3Image";
import ImageCarousel from "../../components/ImageCarousel";

const BookingDetails = () => {
  const { user, token, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const { bookingId } = useParams();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Create API instance with proper headers
  const apiCall = async (endpoint, options = {}) => {
    const baseURL = process.env.REACT_APP_API_URL || "http://localhost:4000";
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

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
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
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
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
      <div className="max-w-4xl mx-auto p-6">
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
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate("/my-bookings")}
          className="flex items-center text-green-600 hover:text-green-700 mb-4"
        >
          <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to My Bookings
        </button>
        
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Booking Details</h1>
          <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(booking.status)}`}>
            {getStatusLabel(booking.status)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Property Info */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="aspect-w-16 aspect-h-9">
              {booking.property?.photos && booking.property.photos.length > 0 ? (
                <ImageCarousel
                  images={booking.property.photos}
                  className="h-64"
                  showDots={booking.property.photos.length > 1}
                  showArrows={booking.property.photos.length > 1}
                />
              ) : (
                <S3Image
                  src={booking.property?.photos?.[0]}
                  alt={booking.property?.title || "Property"}
                  className="w-full h-64 object-cover"
                  fallbackSrc="https://via.placeholder.com/600x300?text=No+Image"
                />
              )}
            </div>
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {booking.property?.title || "Unknown Property"}
              </h2>
              <p className="text-gray-600 flex items-center mb-4">
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {formatLocation(booking.property?.localisation)}
              </p>
              
              {/* Property Equipment/Amenities */}
              {booking.property?.equipments && booking.property.equipments.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Amenities</h3>
                  <div className="flex flex-wrap gap-2">
                    {booking.property.equipments.map((equipment, index) => (
                      <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        {equipment}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Booking Timeline */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Booking Timeline</h3>
            <div className="space-y-4">
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

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Booking Summary */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Booking Summary</h3>
            
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
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Host Information</h3>
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
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Actions</h3>
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
    </div>
  );
};

export default BookingDetails;