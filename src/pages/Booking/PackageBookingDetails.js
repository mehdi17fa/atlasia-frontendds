import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import S3Image from "../../components/S3Image";
import ImageCarousel from "../../components/ImageCarousel";

const PackageBookingDetails = () => {
  const { user, token, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const { bookingId } = useParams();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


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
      console.log('🔍 Fetching package booking details for ID:', bookingId);
      
      // First try the debug endpoint to see if the booking exists
      try {
        const debugData = await apiCall(`/api/packagebooking/debug/${bookingId}`);
        console.log('🔍 Debug response:', debugData);
      } catch (debugErr) {
        console.log('🔍 Debug endpoint failed:', debugErr.message);
      }
      
      const data = await apiCall(`/api/packagebooking/${bookingId}`);
      console.log('✅ Package booking response:', data);

      if (data.success) {
        setBooking(data.booking);
      } else {
        throw new Error(data.message || "Failed to fetch booking details");
      }
    } catch (err) {
      console.error("Error fetching package booking details:", err);
      console.error("Error details:", {
        message: err.message,
        status: err.status,
        bookingId: bookingId
      });
      
      // Handle specific error cases
      if (err.message.includes("Session expired") || err.message.includes("Unauthorized")) {
        setError("Your session has expired. Please log in again.");
        logout();
        navigate("/login");
      } else if (err.message.includes("Not authorized")) {
        setError("You don't have permission to view this booking.");
      } else if (err.message.includes("Package booking not found") || err.message.includes("404")) {
        setError("This booking doesn't exist or has been removed.");
      } else if (err.message.includes("Invalid booking ID format")) {
        setError("Invalid booking ID format.");
      } else {
        setError(`Error: ${err.message}`);
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
      const data = await apiCall(`/api/packagebooking/${bookingId}/cancel`, {
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
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "confirmed":
        return "Confirmé";
      case "pending":
        return "En attente";
      case "cancelled":
        return "Annulé";
      case "completed":
        return "Terminé";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des détails de la réservation...</p>
          <p className="mt-2 text-sm text-gray-500">Booking ID: {bookingId}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6 pb-28">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erreur</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate("/my-bookings")}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Retour aux réservations
          </button>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Réservation introuvable</h2>
          <p className="text-gray-600 mb-6">Cette réservation n'existe pas ou a été supprimée.</p>
          <button
            onClick={() => navigate("/my-bookings")}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Retour aux réservations
          </button>
        </div>
      </div>
    );
  }

  const packageData = booking.package;
  const partner = packageData?.partner;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6 pb-28">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate("/my-bookings")}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour aux réservations
          </button>
          
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Détails de la réservation</h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
              {getStatusText(booking.status)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Package Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Informations du package</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900">{packageData?.name || "Package sans nom"}</h3>
                  <p className="text-gray-600 mt-1">{packageData?.description || "Aucune description"}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Type</p>
                    <p className="text-gray-900 capitalize">{packageData?.type || "Non spécifié"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Prix total</p>
                    <p className="text-gray-900 font-semibold">{packageData?.totalPrice || 0} MAD</p>
                  </div>
                </div>

                {packageData?.startDate && packageData?.endDate && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Période du package</p>
                    <p className="text-gray-900">
                      {new Date(packageData.startDate).toLocaleDateString('fr-FR')} - {new Date(packageData.endDate).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Booking Details */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Détails de la réservation</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Date d'arrivée</p>
                  <p className="text-gray-900">{new Date(booking.checkIn).toLocaleDateString('fr-FR')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Date de départ</p>
                  <p className="text-gray-900">{new Date(booking.checkOut).toLocaleDateString('fr-FR')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Nombre d'invités</p>
                  <p className="text-gray-900">{booking.guests}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Durée</p>
                  <p className="text-gray-900">
                    {Math.ceil((new Date(booking.checkOut) - new Date(booking.checkIn)) / (1000 * 60 * 60 * 24))} nuit(s)
                  </p>
                </div>
              </div>

              {booking.message && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-500">Message</p>
                  <p className="text-gray-900 mt-1">{booking.message}</p>
                </div>
              )}
            </div>

            {/* Services and Activities */}
            {(packageData?.services?.length > 0 || packageData?.activities?.length > 0) && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Services et activités inclus</h2>
                
                {packageData.services?.length > 0 && (
                  <div className="mb-4">
                    <h3 className="font-medium text-gray-900 mb-2">Services</h3>
                    <ul className="space-y-2">
                      {packageData.services.map((service, index) => (
                        <li key={index} className="flex items-center text-gray-600">
                          <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          {service.name} - {service.price} MAD
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {packageData.activities?.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Activités</h3>
                    <ul className="space-y-2">
                      {packageData.activities.map((activity, index) => (
                        <li key={index} className="flex items-center text-gray-600">
                          <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          {activity.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Partner Information */}
            {partner && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Partenaire</h3>
                <div className="flex items-center space-x-3">
                  {partner.profilePic || partner.profileImage ? (
                    <S3Image
                      src={partner.profilePic || partner.profileImage}
                      alt={partner.fullName || partner.displayName || 'Partenaire'}
                      className="w-10 h-10 rounded-full object-cover"
                      fallbackSrc="/profilepic.jpg"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 font-medium">
                        {(partner.fullName || partner.displayName || 'P').charAt(0)}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900">{partner.fullName || partner.displayName || "Partenaire"}</p>
                    <p className="text-sm text-gray-500">{partner.email}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Actions</h3>
              <div className="space-y-3">
                {booking.status === "confirmed" && (
                  <button
                    onClick={handleCancel}
                    className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Annuler la réservation
                  </button>
                )}
                
                <button
                  onClick={() => navigate("/my-bookings")}
                  className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Retour aux réservations
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PackageBookingDetails;
