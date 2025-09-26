// src/Layout/CoHostPropertyLayout.jsx
import React, { useState, useEffect, useContext, useCallback } from "react";
import { ArrowLeftIcon, CheckIcon, CalendarIcon, ClockIcon } from "@heroicons/react/24/solid";
import S3Image from "../../components/S3Image";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import toast from "react-hot-toast";

const API_BASE = process.env.REACT_APP_API_URL;

export default function CoHostPropertyLayout({
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
  onCoHostClick,
  propertyId,
  showReservations = false
}) {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("reserved");
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch reservations for property owner
  const fetchReservations = useCallback(async () => {
    if (!user || !propertyId || !showReservations) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("Token d'authentification manquant");
      }

      console.log("Fetching reservations for property:", propertyId);
      
      const response = await axios.get(
        `${API_BASE}/api/booking/owner/property/${propertyId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      console.log("Reservations response:", response.data);

      if (response.data.success) {
        setReservations(response.data.bookings || []);
      } else {
        throw new Error(response.data.message || "Erreur lors du chargement des réservations");
      }
    } catch (err) {
      console.error("Error fetching reservations:", err);
      setError(err.message);
      toast.error("Erreur lors du chargement des réservations");
    } finally {
      setLoading(false);
    }
  }, [user, propertyId, showReservations]);

  useEffect(() => {
    if (showReservations) {
      fetchReservations();
    }
  }, [fetchReservations, showReservations]);

  // Handle reservation status change
  const handleReservationAction = async (reservationId, action) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("Token d'authentification manquant");
      }

      const response = await axios.patch(
        `${API_BASE}/api/booking/${reservationId}/${action}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        toast.success(`Réservation ${action === 'accept' ? 'acceptée' : 'refusée'} avec succès`);
        fetchReservations(); // Refresh the list
      } else {
        throw new Error(response.data.message || `Erreur lors de l'${action} de la réservation`);
      }
    } catch (err) {
      console.error(`Error ${action}ing reservation:`, err);
      toast.error(err.message);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
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

  const filteredReservations = reservations.filter(reservation => {
    if (activeTab === "reserved") {
      return reservation.status === "confirmed" || reservation.status === "completed";
    } else if (activeTab === "pending") {
      return reservation.status === "pending";
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto p-6 pb-28">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-4">
        <button 
          onClick={() => {
            // Navigate back to partner dashboard or explore page instead of potentially undefined history
            if (window.history.length > 1) {
              window.history.back();
            } else {
              window.location.href = '/partner-welcome';
            }
          }} 
          className="p-2 bg-gray-200 rounded-full"
        >
          <ArrowLeftIcon className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="text-3xl font-bold">{showReservations ? "Gérer mes réservations" : title}</h1>
      </div>

      {!showReservations && (
        <>
          <p className="text-gray-600 mb-2">{location}</p>
          <div className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
            <span>⭐ {rating}</span>
            <span>·</span>
            <span>{reviewCount} avis</span>
          </div>

          {/* Main Image */}
          <S3Image
            src={mainImage || "/villa1.jpg"}
            alt={title}
            className="w-full h-96 object-cover rounded-2xl shadow mb-6"
            fallbackSrc="/villa1.jpg"
          />

          {/* Features */}
          {features?.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {features.map((f, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  {f.icon}
                  <span>{f.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Associated Packs */}
          {associatedPacks?.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Packs associés</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {associatedPacks.map((pack, idx) => (
                  <div key={idx} className="rounded-xl shadow p-3">
                    <S3Image
                      src={pack.image}
                      alt={pack.name}
                      className="w-full h-32 object-cover rounded-lg"
                      fallbackSrc="/villa2.jpg"
                    />
                    <h3 className="mt-2 font-medium">{pack.name}</h3>
                    <p className="text-sm text-gray-500">{pack.location}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Host */}
          {host && (
            <div className="flex items-center space-x-4 mb-6">
              <S3Image
                src={host.photo || "/profilepic.jpg"}
                alt={host.name}
                className="w-14 h-14 rounded-full object-cover"
                fallbackSrc="/profilepic.jpg"
              />
              <div>
                <p className="font-semibold">{host.name}</p>
                <p className="text-sm text-gray-500">Hôte</p>
              </div>
            </div>
          )}

          {/* Co-Host Button */}
          <div className="text-center">
            <button
              onClick={onCoHostClick}
              className="bg-green-500 hover:bg-green-600 text-black rounded-2xl px-6 py-3 font-semibold shadow flex items-center justify-center mx-auto"
            >
              <CheckIcon className="w-5 h-5 mr-2" />
              Devenir Co-hoster
            </button>
          </div>
        </>
      )}

      {/* Reservation Management Section */}
      {showReservations && (
        <div className="mt-6">
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => setActiveTab("reserved")}
              className={`flex items-center px-6 py-3 font-medium text-lg border-b-2 transition-colors ${
                activeTab === "reserved"
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <CalendarIcon className="w-5 h-5 mr-2" />
              Réservée
            </button>
            <button
              onClick={() => setActiveTab("pending")}
              className={`flex items-center px-6 py-3 font-medium text-lg border-b-2 transition-colors ${
                activeTab === "pending"
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <ClockIcon className="w-5 h-5 mr-2" />
              En Attente
            </button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Chargement des réservations...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <p className="text-red-800">{error}</p>
              <button
                onClick={fetchReservations}
                className="text-red-600 underline hover:text-red-500 mt-2"
              >
                Réessayer
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredReservations.length === 0 && !error && (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <div className="mb-4">
                <CalendarIcon className="mx-auto h-16 w-16 text-gray-400" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">Aucune réservation</h3>
              <p className="text-gray-500">Les réservations de vos propriétés apparaîtront ici.</p>
            </div>
          )}

          {/* Reservations List */}
          {!loading && filteredReservations.length > 0 && (
            <div className="space-y-4">
              {filteredReservations.map((reservation) => (
                <div key={reservation._id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {reservation.property?.title || "Propriété"}
                      </h3>
                      <p className="text-gray-600">
                        Invité: {reservation.user?.firstName} {reservation.user?.lastName}
                      </p>
                      <p className="text-gray-600">
                        Email: {reservation.user?.email}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(reservation.status)}`}>
                      {reservation.status === 'confirmed' ? 'Confirmée' :
                       reservation.status === 'pending' ? 'En attente' :
                       reservation.status === 'cancelled' ? 'Annulée' :
                       reservation.status === 'completed' ? 'Terminée' :
                       reservation.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Arrivée</p>
                      <p className="font-medium">{formatDate(reservation.checkIn)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Départ</p>
                      <p className="font-medium">{formatDate(reservation.checkOut)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Invités</p>
                      <p className="font-medium">{reservation.guests} personne{reservation.guests > 1 ? 's' : ''}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-500">Montant total</p>
                    <p className="text-xl font-bold text-green-600">{reservation.totalAmount}€</p>
                  </div>

                  {reservation.guestMessage && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-500 mb-1">Message de l'invité:</p>
                      <p className="text-gray-700">{reservation.guestMessage}</p>
                    </div>
                  )}

                  {/* Action Buttons for Pending Reservations */}
                  {reservation.status === 'pending' && (
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleReservationAction(reservation._id, 'accept')}
                        className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors font-medium"
                      >
                        Accepter
                      </button>
                      <button
                        onClick={() => handleReservationAction(reservation._id, 'reject')}
                        className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors font-medium"
                      >
                        Refuser
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Co-hosting Request Section */}
          <div className="mt-12 bg-yellow-50 rounded-xl p-6">
            <div className="flex items-center mb-4">
              <div className="bg-yellow-100 p-2 rounded-full mr-3">
                <span className="text-2xl">🤝</span>
              </div>
              <h2 className="text-xl font-bold text-gray-800">Demandes de co-hébergement</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Gérez les demandes de partenariat pour cette propriété.
            </p>
            <button className="bg-green-600 text-white py-2 px-6 rounded-md hover:bg-green-700 transition-colors font-medium">
              Actualiser
            </button>
          </div>
        </div>
      )}
    </div>
  );
}