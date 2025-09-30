import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../../api";
import SectionTitle from "../../components/shared/SectionTitle";
import S3Image from "../../components/S3Image";
import ImageCarousel from "../../components/ImageCarousel";
import ListingCardGrid from "../../components/ListingCard/ListingCardGrid";

import Calendar from "../../components/shared/Calendar";
import OwnerBottomNavbar from "../../components/shared/NavbarPropriétaire";
import { AuthContext } from "../../context/AuthContext";
import { tokenStorage } from "../../utils/tokenStorage";
import toast, { Toaster } from "react-hot-toast";
import { FaArrowLeft, FaUser } from 'react-icons/fa';
import { 
  PlusIcon, 
  HomeIcon, 
  CalendarDaysIcon, 
  ClockIcon,
  ArrowPathIcon,
  CheckIcon,
  XMarkIcon,
  SparklesIcon,
  MapPinIcon,
  EyeIcon,
  CurrencyDollarIcon // Added for income button
} from '@heroicons/react/24/outline';

const API_BASE = process.env.REACT_APP_API_URL;


function CoHostRequestCard({ request, onAccept, onReject, loading, isHighlighted = false }) {
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = String(name).trim().split(/\s+/);
    const first = parts[0]?.[0] || '';
    const second = parts[1]?.[0] || '';
    return (first + second).toUpperCase() || 'U';
  };
  return (
    <div className={`bg-white border rounded-xl p-4 mb-4 shadow-sm transition-all duration-300 hover:shadow-md ${
      isHighlighted ? 'border-green-500 bg-green-50 ring-2 ring-green-200' : 'border-gray-200'
    }`}>
      {isHighlighted && (
        <div className="bg-green-600 text-white text-xs px-2 py-1 rounded-full inline-flex items-center mb-2 font-semibold">
          <SparklesIcon className="w-3 h-3 inline mr-1" />
          Nouvelle demande
        </div>
      )}
      <div className="flex items-stretch gap-3">
        {request.partner?.profilePic ? (
          <img
            src={request.partner.profilePic}
            alt="Partner"
            className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
          />
        ) : (
          <div className="w-12 h-12 rounded-full border-2 border-gray-200 bg-gray-100 text-gray-700 flex items-center justify-center text-sm font-semibold">
            {getInitials(request.partner?.fullName || request.partner?.displayName)}
          </div>
        )}
        <div className="flex-1 flex flex-col">
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 leading-snug">
                {request.partner?.fullName || request.partner?.displayName || "Utilisateur"}
              </h4>
              <p className="text-sm text-gray-600 truncate">{request.partner?.email}</p>
              
              {/* Property info moved below to span full card width */}
            </div>
            <div className="flex flex-col space-y-2 ml-2 min-w-[120px]">
              <button
                onClick={() => onAccept(request._id)}
                disabled={loading}
                className="bg-green-600 text-white px-4 py-2 rounded-full text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center"
              >
                {loading ? "..." : (
                  <>
                    <CheckIcon className="w-4 h-4 mr-1" />
                    Accepter
                  </>
                )}
              </button>
              <button
                onClick={() => onReject(request._id)}
                disabled={loading}
                className="bg-red-600 text-white px-4 py-2 rounded-full text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center"
              >
                {loading ? "..." : (
                  <>
                    <XMarkIcon className="w-4 h-4 mr-1" />
                    Refuser
                  </>
                )}
              </button>
            </div>
          </div>
          {/* request info moved below property info */}
        </div>
      </div>
      {/* Full-width Property Info */}
      <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-100 w-full">
        <div className="flex items-center gap-4">
          {request.property?.photos?.[0] && (
            <S3Image
              src={request.property.photos[0]}
              alt="Property"
              className="w-24 h-16 rounded-lg object-cover"
              fallbackSrc="/placeholder.jpg"
            />
          )}
          <div className="flex-1">
            <p className="text-sm font-medium text-green-700">
              {request.property?.title || "Titre non disponible"}
            </p>
            <p className="text-xs text-gray-600 flex items-center">
              <MapPinIcon className="w-3 h-3 mr-1" />
              {request.property?.localisation?.city || "Localisation non spécifiée"}
              {request.property?.localisation?.address && `, ${request.property.localisation.address}`}
            </p>
          </div>
        </div>
      </div>
      {/* Request meta info under property info */}
      <div className="flex items-center justify-between mt-3">
        <p className="text-xs text-gray-500 flex items-center">
          <CalendarDaysIcon className="w-3 h-3 mr-1" />
          Demande reçue le {new Date(request.createdAt).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
        <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-medium flex items-center">
          <ClockIcon className="w-3 h-3 mr-1" />
          En attente
        </span>
      </div>
    </div>
  );
}

export default function WelcomeOwner() {
  const [reservationTab, setReservationTab] = useState("reserved");
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [selectedDates, setSelectedDates] = useState(null);
  const [coHostRequests, setCoHostRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [highlightedRequestId, setHighlightedRequestId] = useState(null);
  
  // New states for properties
  const [ownerProperties, setOwnerProperties] = useState([]);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [showAllProperties, setShowAllProperties] = useState(false);
  const [propertiesError, setPropertiesError] = useState(null);
  
  // New states for reservations
  const [reservations, setReservations] = useState([]);
  const [loadingReservations, setLoadingReservations] = useState(true);
  const [reservationsError, setReservationsError] = useState(null);
  
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [searchParams] = useSearchParams();

  // Check if we need to highlight a specific request (from email link)
  useEffect(() => {
    const highlightRequest = searchParams.get('highlight');
    console.log("🎯 Highlight request ID from URL:", highlightRequest);
    console.log("👤 Current user:", user);
    console.log("🏠 User role:", user?.role);
    
    if (highlightRequest) {
      setHighlightedRequestId(highlightRequest);
      // Scroll to requests section after component loads
      setTimeout(() => {
        const requestsSection = document.getElementById('cohost-requests-section');
        if (requestsSection) {
          requestsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 500);
    }
  }, [searchParams, user]);

  // Fetch co-host requests when component mounts
  useEffect(() => {
    fetchCoHostRequests();
  }, []);

  // Fetch owner properties when component mounts
  useEffect(() => {
    fetchOwnerProperties();
  }, []);

  // Fetch reservations when component mounts
  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchOwnerProperties = async () => {
    try {
      setLoadingProperties(true);
      setPropertiesError(null);
      
      console.log("🔍 Fetching owner properties...");

      const response = await api.get(`/api/property/mine/all`);
      
      console.log("📡 Properties API Response:", response.data);
      
      if (response.data.properties) {
        setOwnerProperties(response.data.properties);
        console.log("✅ Properties loaded:", response.data.properties.length);
      } else {
        console.log("⚠️ No properties found in response");
        setOwnerProperties([]);
      }
    } catch (err) {
      console.error("❌ Error fetching owner properties:", err);
      console.error("📋 Error details:", {
        status: err.response?.status,
        message: err.response?.data?.message,
        data: err.response?.data
      });
      
      setPropertiesError("Erreur lors du chargement des propriétés");
      
      if (err.response?.status === 401) {
        toast.error("Session expirée, veuillez vous reconnecter");
      } else if (err.response?.status === 403) {
        toast.error("Accès non autorisé");
      } else {
        toast.error("Erreur lors du chargement des propriétés");
      }
    } finally {
      setLoadingProperties(false);
    }
  };

  const fetchReservations = async () => {
    try {
      setLoadingReservations(true);
      setReservationsError(null);
      
      const response = await api.get(`/api/booking/owner`);
      
      if (response.data.success && response.data.bookings) {
        setReservations(response.data.bookings);
      } else {
        setReservations([]);
      }
    } catch (err) {
      setReservationsError("Erreur lors du chargement des réservations");
      
      if (err.response?.status === 401) {
        toast.error("Session expirée, veuillez vous reconnecter");
      } else if (err.response?.status === 403) {
        toast.error("Accès non autorisé");
      } else {
        toast.error("Erreur lors du chargement des réservations");
      }
    } finally {
      setLoadingReservations(false);
    }
  };

  const handleBookingResponse = async (bookingId, action) => {
    try {
      const response = await api.patch(
        `/api/booking/${bookingId}/respond`,
        { 
          action: action, 
          message: action === 'reject' ? 'Demande refusée par le propriétaire' : '' 
        }
      );

      if (response.data.success) {
        toast.success(action === 'accept' ? 'Réservation acceptée!' : 'Réservation refusée');
        // Refresh reservations
        fetchReservations();
      } else {
        toast.error(response.data.message || 'Erreur lors de la réponse');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la réponse à la réservation');
    }
  };


  const fetchCoHostRequests = async () => {
    try {
      console.log("🔍 Fetching co-host requests...");

      const response = await api.get(`/api/partner/requests`);
      
      console.log("📡 API Response:", response.data);
      
      if (response.data.success) {
        setCoHostRequests(response.data.requests);
        console.log("✅ Requests loaded:", response.data.requests.length);
      } else {
        console.log("⚠️ API returned success: false");
      }
    } catch (err) {
      console.error("❌ Error fetching co-host requests:", err);
      console.error("📋 Error details:", {
        status: err.response?.status,
        message: err.response?.data?.message,
        data: err.response?.data
      });
      
      if (err.response?.status === 401) {
        toast.error("Session expirée, veuillez vous reconnecter");
      } else if (err.response?.status === 403) {
        toast.error("Accès non autorisé");
      } else {
        toast.error("Erreur lors du chargement des demandes");
      }
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    setActionLoading(true);
    try {
      const response = await api.patch(`/api/partner/accept/${requestId}`, {});

      if (response.data.success) {
        // Remove accepted request from list
        setCoHostRequests(prev => prev.filter(req => req._id !== requestId));
        toast.success("🎉 Demande de co-hébergement acceptée avec succès !");
        
        // Remove highlight
        if (highlightedRequestId === requestId) {
          setHighlightedRequestId(null);
        }
      }
    } catch (err) {
      console.error("Error accepting request:", err);
      const errorMsg = err.response?.data?.message || "Erreur lors de l'acceptation de la demande";
      toast.error(errorMsg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectRequest = async (requestId) => {
    setActionLoading(true);
    try {
      const response = await api.patch(`/api/partner/reject/${requestId}`, {});

      if (response.data.success) {
        // Remove rejected request from list
        setCoHostRequests(prev => prev.filter(req => req._id !== requestId));
        toast.success("Demande de co-hébergement refusée");
        
        // Remove highlight
        if (highlightedRequestId === requestId) {
          setHighlightedRequestId(null);
        }
      }
    } catch (err) {
      console.error("Error rejecting request:", err);
      const errorMsg = err.response?.data?.message || "Erreur lors du refus de la demande";
      toast.error(errorMsg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCardClick = (property) => {
    setSelectedProperty(property);
    setShowCalendar(true);
  };

  const handleCalendarChange = (dates) => {
    setSelectedDates(dates);
    console.log("Selected dates for property:", selectedProperty, dates);
  };

  const closeModal = () => {
    setShowCalendar(false);
    setSelectedProperty(null);
    setSelectedDates(null);
  };

  // Determine how many properties to show
  const propertiesToShow = showAllProperties ? ownerProperties : ownerProperties.slice(0, 6);
  const pendingReservationsCount = reservations.filter(r => r.status === 'pending').length;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-28">
      <Toaster position="top-right" reverseOrder={false} />
      
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        <h1 className="text-2xl font-bold text-green-900 mb-2 mt-4">
          Bienvenue {user?.firstName || user?.fullName || "Propriétaire"} 👋
        </h1>

        <SectionTitle title="Gérer mes propriétés" />
        <div className="flex gap-2 mb-6">
          <button 
            className="bg-green-700 text-white px-4 py-2 rounded-full font-semibold text-sm shadow hover:bg-green-800 transition flex items-center" 
            onClick={() => navigate('/create-property')}
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Créer propriété
          </button>
          <button 
            className="border border-green-800 text-green-700 px-4 py-2 rounded-full font-semibold text-sm bg-white hover:bg-green-50 transition flex items-center" 
            onClick={() => navigate('/my-properties')}
          >
            <HomeIcon className="w-4 h-4 mr-2" />
            Voir mes propriétés
          </button>
          <button 
            className="border border-green-800 text-green-700 px-4 py-2 rounded-full font-semibold text-sm bg-white hover:bg-green-50 transition flex items-center" 
            onClick={() => navigate('/owner/income')}
          >
            <CurrencyDollarIcon className="w-4 h-4 mr-2" />
            Voir mes revenus
          </button>
        </div>

        {/* Owner Properties Grid */}
        <div className="mb-8">
          {loadingProperties ? (
            <div className="text-center py-8">
              <div className="animate-spin inline-block w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full"></div>
              <p className="text-gray-500 mt-2">Chargement de vos propriétés...</p>
            </div>
          ) : propertiesError ? (
            <div className="text-center py-8 bg-red-50 rounded-lg border border-red-200">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-lg font-semibold text-red-700 mb-2">Erreur de chargement</h3>
              <p className="text-red-600 text-sm mb-4">{propertiesError}</p>
              <button 
                onClick={fetchOwnerProperties}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center mx-auto"
              >
                <ArrowPathIcon className="w-4 h-4 mr-2" />
                Réessayer
              </button>
            </div>
          ) : ownerProperties.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-6xl mb-4">🏠</div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Aucune propriété</h3>
              <p className="text-gray-500 text-sm mb-4">
                Vous n'avez pas encore ajouté de propriétés. Commencez par ajouter votre première propriété.
              </p>
              <div className="flex gap-2 justify-center">
                <button 
                  onClick={() => navigate('/create-property')}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Créer propriété
                </button>
              </div>
            </div>
          ) : (
            <>
              <ListingCardGrid
                listings={propertiesToShow}
                onCardClick={handleCardClick}
                showOptionsMenu={true}
                onPropertyEdit={(property) => navigate(`/edit-property/${property._id}`)}
                onPropertyDelete={async (property) => {
                  if (window.confirm(`Êtes-vous sûr de vouloir supprimer la propriété "${property.title || 'cette propriété'}" ?`)) {
                    try {
                      const deleteUrl = `/api/property/${property._id}`;
                      console.log('🗑️ Attempting to delete property:', {
                        propertyId: property._id,
                        url: deleteUrl,
                        fullUrl: `${api.defaults.baseURL}${deleteUrl}`,
                        method: 'DELETE'
                      });
                      
                      const response = await api.delete(deleteUrl);
                      
                      console.log('✅ Delete response:', response);
                      
                      if (response.data.success) {
                        // Refresh properties list
                        fetchOwnerProperties();
                        // Show success message
                        alert('Propriété supprimée avec succès');
                      } else {
                        throw new Error(response.data.message || 'Erreur lors de la suppression');
                      }
                    } catch (error) {
                      console.error('❌ Error deleting property:', {
                        error: error,
                        response: error.response,
                        status: error.response?.status,
                        statusText: error.response?.statusText,
                        data: error.response?.data,
                        message: error.message
                      });
                      
                      const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de la suppression de la propriété';
                      alert(`Erreur: ${errorMessage} (Status: ${error.response?.status || 'N/A'})`);
                      throw error; // Re-throw to let PropertyOptionsMenu handle it
                    }
                  }
                }}
                onPropertyInfo={(property) => navigate(`/property/${property._id}`)}
              />
              
              {ownerProperties.length > 6 && (
                <div className="text-center mt-6">
                  <button
                    onClick={() => setShowAllProperties(!showAllProperties)}
                    className="bg-white border border-green-600 text-green-600 px-6 py-2 rounded-lg hover:bg-green-50 transition-colors font-medium flex items-center mx-auto"
                  >
                    <EyeIcon className="w-4 h-4 mr-2" />
                    {showAllProperties ? 
                      `Voir moins (${ownerProperties.length - 6} masquées)` : 
                      `Voir plus (${ownerProperties.length - 6} autres)`
                    }
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex items-center justify-between mb-4">
          <SectionTitle title="Gérer mes réservations" />
          <button
            onClick={fetchReservations}
            className="flex items-center text-green-700 font-semibold text-sm hover:underline"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true" data-slot="icon" className="w-4 h-4 mr-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"></path>
            </svg>
            Actualiser
          </button>
        </div>
        <div className="flex border-b border-gray-200 mb-4">
          <button
            className={`flex-1 py-2 font-semibold text-sm flex items-center justify-center ${
              reservationTab === "reserved" 
                ? "text-green-700 border-b-2 border-green-700" 
                : "text-gray-500"
            }`}
            onClick={() => setReservationTab("reserved")}
          >
            <CalendarDaysIcon className="w-4 h-4 mr-1" />
            Réservée
          </button>
          <button
            className={`flex-1 py-2 font-semibold text-sm flex items-center justify-center ${
              reservationTab === "pending" 
                ? "text-green-700 border-b-2 border-green-700" 
                : "text-gray-500"
            }`}
            onClick={() => setReservationTab("pending")}
          >
            <ClockIcon className="w-4 h-4 mr-1" />
            En Attente
            {pendingReservationsCount > 0 && (
              <span className="ml-2 bg-red-600 text-white rounded-full text-[10px] px-2 py-0.5">
                {pendingReservationsCount}
              </span>
            )}
          </button>
          <button
            className={`flex-1 py-2 font-semibold text-sm flex items-center justify-center ${
              reservationTab === "cancelled" 
                ? "text-red-700 border-b-2 border-red-700" 
                : "text-gray-500"
            }`}
            onClick={() => setReservationTab("cancelled")}
          >
            <XMarkIcon className="w-4 h-4 mr-1" />
            Annulée
          </button>
        </div>
        
        {/* Reservations Content */}
        <div className="mb-6">
          {loadingReservations ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Chargement des réservations...</p>
            </div>
          ) : reservationsError ? (
            <div className="text-center py-8 bg-red-50 rounded-lg border border-red-200">
              <div className="text-4xl mb-4">❌</div>
              <h3 className="text-lg font-semibold text-red-700 mb-2">Erreur</h3>
              <p className="text-red-600 text-sm mb-4">{reservationsError}</p>
              <button
                onClick={fetchReservations}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Réessayer
              </button>
            </div>
          ) : (() => {
            const filteredReservations = reservations.filter(reservation => {
              if (reservationTab === "reserved") {
                return reservation.status === "confirmed" || reservation.status === "completed";
              } else if (reservationTab === "pending") {
                return reservation.status === "pending";
              } else if (reservationTab === "cancelled") {
                return reservation.status === "cancelled" || reservation.status === "rejected";
              }
              return false;
            });

            return filteredReservations.length === 0 ? (
              <div>
                {reservationTab === 'pending' && pendingReservationsCount > 0 && (
                  <div className="mb-3 rounded-md border border-yellow-200 bg-yellow-50 px-4 py-2 text-yellow-900 flex items-center">
                    <ClockIcon className="w-4 h-4 mr-2" />
                    <span>
                      Vous avez {pendingReservationsCount} demande{pendingReservationsCount > 1 ? 's' : ''} en attente d'approbation.
                    </span>
                  </div>
                )}
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="text-6xl mb-4">📅</div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Aucune réservation</h3>
                  <p className="text-gray-500 text-sm">
                    {reservationTab === "pending" 
                      ? "Aucune réservation en attente."
                      : reservationTab === "cancelled"
                      ? "Aucune réservation annulée."
                      : "Aucune réservation confirmée."
                    }
                  </p>
                </div>
              </div>
            ) : (
              <div>
                {reservationTab === 'pending' && pendingReservationsCount > 0 && (
                  <div className="mb-3 rounded-md border border-yellow-200 bg-yellow-50 px-4 py-2 text-yellow-900 flex items-center">
                    <ClockIcon className="w-4 h-4 mr-2" />
                    <span>
                      Vous avez {pendingReservationsCount} demande{pendingReservationsCount > 1 ? 's' : ''} en attente d'approbation.
                    </span>
                  </div>
                )}
                <div className="space-y-4">
                  {filteredReservations.map((reservation) => (
                    <div key={reservation._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">
                          {reservation.property?.title || "Propriété"}
                        </h4>
                        <p className="text-sm text-gray-600 mb-2">
                          Invité: {reservation.guest?.name || "N/A"} ({reservation.guest?.email || "N/A"})
                        </p>
                        <div className="flex items-center text-sm text-gray-600 space-x-4">
                          <span>📅 {new Date(reservation.checkIn).toLocaleDateString()} - {new Date(reservation.checkOut).toLocaleDateString()}</span>
                          <span>👥 {reservation.guests} invité{reservation.guests > 1 ? 's' : ''}</span>
                          <span>💰 {reservation.totalAmount} MAD</span>
                        </div>
                        {reservation.guestMessage && (
                          <p className="text-sm text-gray-700 mt-2 italic">
                            "{reservation.guestMessage}"
                          </p>
                        )}
                        {(reservation.status === 'cancelled' || reservation.status === 'rejected') && reservation.cancellation?.reason && (
                          <p className="text-sm text-red-600 mt-2 italic">
                            Raison: {reservation.cancellation.reason}
                          </p>
                        )}
                        {reservation.status === 'rejected' && reservation.ownerResponse?.message && (
                          <p className="text-sm text-red-600 mt-2 italic">
                            Message du propriétaire: "{reservation.ownerResponse.message}"
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          reservation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          reservation.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          reservation.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                          reservation.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          reservation.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {reservation.status === 'pending' ? 'En Attente' :
                           reservation.status === 'confirmed' ? 'Confirmé' :
                           reservation.status === 'completed' ? 'Terminé' :
                           reservation.status === 'cancelled' ? 'Annulé' :
                           reservation.status === 'rejected' ? 'Rejeté' :
                           reservation.status}
                        </span>
                        {reservation.status === 'pending' && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleBookingResponse(reservation._id, 'accept')}
                              className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700"
                            >
                              Accepter
                            </button>
                            <button
                              onClick={() => handleBookingResponse(reservation._id, 'reject')}
                              className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700"
                            >
                              Refuser
                            </button>
                          </div>
                        )}
                      </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Co-Host Requests Section */}
        <div id="cohost-requests-section" className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-green-900 font-bold text-lg flex items-center">
              🤝 Demandes de co-hébergement
              {coHostRequests.length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {coHostRequests.length}
                </span>
              )}
            </span>
            <button 
              className="flex items-center text-green-700 font-semibold text-sm hover:underline"
              onClick={() => window.location.reload()}
            >
              <ArrowPathIcon className="w-4 h-4 mr-1" />
              Actualiser
            </button>
          </div>
          
          {loadingRequests ? (
            <div className="text-center py-8">
              <div className="animate-spin inline-block w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full"></div>
              <p className="text-gray-500 mt-2">Chargement des demandes...</p>
            </div>
          ) : coHostRequests.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Aucune demande en attente</h3>
              <p className="text-gray-500 text-sm">
                Les demandes de co-hébergement apparaîtront ici quand des partenaires souhaitent gérer vos propriétés.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {coHostRequests.map((request) => (
                <CoHostRequestCard
                  key={request._id}
                  request={request}
                  onAccept={handleAcceptRequest}
                  onReject={handleRejectRequest}
                  loading={actionLoading}
                  isHighlighted={highlightedRequestId === request._id}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Calendar Modal */}
      {showCalendar && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 relative w-[350px]">
            <button 
              className="absolute top-2 right-2 text-gray-500 hover:text-red-600 text-xl font-bold" 
              onClick={closeModal}
            >
              &times;
            </button>
            <h3 className="text-lg font-bold mb-2 text-green-900">
              Disponibilités pour {selectedProperty?.title}
            </h3>
            <Calendar value={selectedDates} onChange={handleCalendarChange} mode="range" />
            <button 
              className="mt-4 w-full bg-green-700 text-white py-2 rounded-lg font-semibold hover:bg-green-800 transition" 
              onClick={closeModal}
            >
              Valider
            </button>
          </div>
        </div>
      )}

      <OwnerBottomNavbar />
    </div>
  );
}