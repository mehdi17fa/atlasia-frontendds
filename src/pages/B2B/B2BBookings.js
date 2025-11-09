import React, { useContext, useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../api';
import {
  ArrowLeftIcon,
  BuildingOfficeIcon,
  CalendarDaysIcon,
  ClockIcon,
  UsersIcon,
  EnvelopeIcon,
  PhoneIcon,
  CheckBadgeIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'En attente' },
  { value: 'confirmed', label: 'Confirmées' },
  { value: 'cancelled', label: 'Annulées' },
  { value: 'all', label: 'Toutes' }
];

const STATUS_STYLES = {
  pending: { label: 'En attente', bg: 'bg-yellow-100', text: 'text-yellow-800' },
  confirmed: { label: 'Confirmée', bg: 'bg-green-100', text: 'text-green-800' },
  cancelled: { label: 'Annulée', bg: 'bg-red-100', text: 'text-red-700' },
  completed: { label: 'Terminée', bg: 'bg-blue-100', text: 'text-blue-800' }
};

const formatDate = (date) => {
  if (!date) return '—';
  try {
    return new Date(date).toLocaleDateString('fr-FR', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return date;
  }
};

export default function B2BBookings() {
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [isUpdating, setIsUpdating] = useState(false);

  const filteredBookings = useMemo(() => {
    if (statusFilter === 'all') return bookings;
    return bookings.filter((booking) => booking.status === statusFilter);
  }, [bookings, statusFilter]);

  const loadBookings = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (statusFilter && statusFilter !== 'all') {
        params.status = statusFilter;
      }
      const response = await api.get('/api/service-bookings/business/my', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      if (response.data?.success) {
        setBookings(response.data.bookings || []);
      } else {
        setBookings([]);
      }
    } catch (err) {
      console.error('Error fetching restaurant bookings', err);
      const serverMessage = err?.response?.data?.message;
      setError(serverMessage || "Impossible de charger vos réservations. Veuillez réessayer plus tard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'b2b') {
      loadBookings();
    }
  }, [user, statusFilter]);

  const updateBooking = async (bookingId, action, reason) => {
    if (!token) return;
    setIsUpdating(true);
    try {
      const endpoint = `/api/service-bookings/${bookingId}/${action}`;
      const response = await api.patch(endpoint, reason ? { reason } : undefined, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data?.success) {
        setBookings((prev) =>
          prev.map((booking) =>
            booking._id === bookingId ? response.data.booking : booking
          )
        );
      }
    } catch (err) {
      console.error(`Failed to ${action} booking`, err);
      alert("Une erreur est survenue lors de la mise à jour. Réessayez.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleConfirm = (bookingId) => updateBooking(bookingId, 'confirm');

  const handleDecline = (bookingId) => {
    const reason = window.prompt("Indiquez la raison du refus (optionnel) :");
    updateBooking(bookingId, 'cancel', reason);
  };

  if (!user || user.role !== 'b2b') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Cette page est réservée aux comptes B2B.</p>
          <button
            onClick={() => navigate('/profile')}
            className="text-green-700 hover:text-green-800 underline"
          >
            Retour au profil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white pb-24">
      <div className="bg-white shadow-sm border-b sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center gap-4">
          <button
            onClick={() => navigate('/b2b-dashboard')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeftIcon className="w-6 h-6 text-gray-600" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <BuildingOfficeIcon className="w-6 h-6 text-green-700" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Réservations restaurant</h1>
              <p className="text-sm text-gray-600">
                Gérez les demandes reçues et confirmez vos tables.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5 mb-6">
          <span className="text-sm font-semibold text-gray-700 block mb-3">
            Filtrer par statut
          </span>
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setStatusFilter(option.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === option.value
                    ? 'bg-green-700 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-12 text-center">
            <CalendarDaysIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Aucune réservation {statusFilter === 'all' ? '' : STATUS_STYLES[statusFilter]?.label?.toLowerCase()}.</p>
            <p className="text-gray-500 text-sm mt-2">
              Vous recevrez un e-mail et une notification lorsqu'un client effectuera une réservation.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => {
              const statusInfo = STATUS_STYLES[booking.status] || STATUS_STYLES.pending;
              return (
                <div key={booking._id} className="bg-white rounded-xl shadow-md border border-gray-200 p-5">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {booking.service?.title || booking.service?.businessName || 'Restaurant'}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.bg} ${statusInfo.text}`}>
                          {statusInfo.label}
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
                        {booking.tourist?.email && (
                          <div className="flex items-center gap-2">
                            <EnvelopeIcon className="w-4 h-4" />
                            <span>{booking.tourist.email}</span>
                          </div>
                        )}
                      </div>

                      {booking.notes && (
                        <div className="text-sm text-gray-600 bg-gray-50 border border-gray-100 rounded-lg p-3">
                          <span className="font-semibold text-gray-700 block mb-1">Notes:</span>
                          {booking.notes}
                        </div>
                      )}

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

                      {booking.cancellation?.reason && (
                        <div className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg p-3">
                          <span className="font-semibold block">Motif du refus :</span>
                          {booking.cancellation.reason}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 min-w-[200px]">
                      {booking.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleConfirm(booking._id)}
                            disabled={isUpdating}
                            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold transition disabled:opacity-50"
                          >
                            Confirmer
                          </button>
                          <button
                            onClick={() => handleDecline(booking._id)}
                            disabled={isUpdating}
                            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 transition disabled:opacity-50"
                          >
                            Refuser
                          </button>
                        </>
                      )}
                      {booking.tourist?.email && (
                        <button
                          onClick={() => (window.location.href = `mailto:${booking.tourist.email}`)}
                          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 transition"
                        >
                          <EnvelopeIcon className="w-4 h-4" />
                          Contacter
                        </button>
                      )}
                      {booking.service?.contactPhone && (
                        <button
                          onClick={() => window.open(`tel:${booking.service.contactPhone}`, '_self')}
                          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 transition"
                        >
                          <PhoneIcon className="w-4 h-4" />
                          Appeler
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

