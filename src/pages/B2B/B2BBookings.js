import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../api';
import ReservationDetailModal from '../../components/B2B/ReservationDetailModal';
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  ClockIcon,
  CurrencyDollarIcon,
  FunnelIcon,
  EyeIcon,
  BuildingOfficeIcon,
  UserIcon
} from '@heroicons/react/24/outline';

export default function B2BBookings() {
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();

  // Filters
  const [statusFilter, setStatusFilter] = useState('all'); // all, past, upcoming, canceled, confirmed
  const [timeRangeFilter, setTimeRangeFilter] = useState('all'); // all, 1h, 2h, 6h, 12h, 24h, custom
  const [customStartTime, setCustomStartTime] = useState('');
  const [customEndTime, setCustomEndTime] = useState('');

  // Data
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);

  // Modal
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [showReservationModal, setShowReservationModal] = useState(false);

  useEffect(() => {
    if (user && user.role === 'b2b') {
      fetchBookings();
    }
  }, [user, statusFilter, timeRangeFilter, customStartTime, customEndTime, page]);

  const apiCall = async (endpoint, options = {}) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    try {
      const method = (options.method || 'GET').toUpperCase();
      const config = { headers };
      
      if (method === 'GET') {
        const response = await api.get(endpoint, config);
        return response.data;
      } else {
        const response = await api.request({
          url: endpoint,
          method,
          data: options.body ? JSON.parse(options.body) : undefined,
          ...config
        });
        return response.data;
      }
    } catch (err) {
      console.error(`Error calling ${endpoint}:`, err);
      throw err;
    }
  };

  const buildQueryParams = () => {
    const params = new URLSearchParams();
    
    if (statusFilter !== 'all') {
      params.append('status', statusFilter);
    }

    if (timeRangeFilter !== 'all') {
      if (timeRangeFilter === 'custom') {
        if (customStartTime) params.append('startTime', customStartTime);
        if (customEndTime) params.append('endTime', customEndTime);
      } else {
        params.append('timeRange', timeRangeFilter);
      }
    }

    params.append('page', page.toString());
    params.append('limit', limit.toString());

    return params.toString();
  };

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);

    try {
      const queryString = buildQueryParams();
      const response = await apiCall(`/api/b2b/bookings?${queryString}`).catch(() => {
        // Return mock data if API doesn't exist yet
        return {
          success: true,
          bookings: [],
          pagination: { current: 1, total: 1, count: 0 }
        };
      });

      if (response.success) {
        setBookings(response.bookings || []);
        setPage(response.pagination?.current || 1);
        setTotalPages(response.pagination?.total || 1);
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Erreur lors du chargement des réservations');
    } finally {
      setLoading(false);
    }
  };

  const handleReservationClick = (reservation) => {
    setSelectedReservation(reservation);
    setShowReservationModal(true);
  };

  const handleCloseModal = () => {
    setShowReservationModal(false);
    setSelectedReservation(null);
  };

  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
    setPage(1); // Reset to first page when filter changes
  };

  const handleTimeRangeFilterChange = (range) => {
    setTimeRangeFilter(range);
    setPage(1); // Reset to first page when filter changes
    if (range !== 'custom') {
      setCustomStartTime('');
      setCustomEndTime('');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      confirmed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Confirmée' },
      upcoming: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'À venir' },
      past: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Passée' },
      canceled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Annulée' }
    };

    const config = statusConfig[status] || statusConfig.past;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white pb-28">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-30 md:pl-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <button
                onClick={() => navigate('/b2b-dashboard')}
                className="md:hidden p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
              >
                <ArrowLeftIcon className="w-6 h-6 text-gray-600" />
              </button>
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <BuildingOfficeIcon className="w-6 h-6 text-green-700" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-2xl font-bold text-gray-900">Toutes les réservations</h1>
                  <p className="text-sm text-gray-600">Gérez toutes vos réservations</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <FunnelIcon className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Filtres</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Statut</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'all', label: 'Tous' },
                  { value: 'past', label: 'Passées' },
                  { value: 'upcoming', label: 'À venir' },
                  { value: 'confirmed', label: 'Confirmées' },
                  { value: 'canceled', label: 'Annulées' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleStatusFilterChange(option.value)}
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

            {/* Time Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <ClockIcon className="w-4 h-4 inline mr-1" />
                Période (début du service)
              </label>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'all', label: 'Toutes' },
                    { value: '1h', label: 'Prochaine heure' },
                    { value: '2h', label: '2 prochaines heures' },
                    { value: '6h', label: '6 prochaines heures' },
                    { value: '12h', label: '12 prochaines heures' },
                    { value: '24h', label: '24 prochaines heures' },
                    { value: 'custom', label: 'Personnalisé' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleTimeRangeFilterChange(option.value)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        timeRangeFilter === option.value
                          ? 'bg-green-700 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                {/* Custom Time Range Inputs */}
                {timeRangeFilter === 'custom' && (
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-200">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Début</label>
                      <input
                        type="datetime-local"
                        value={customStartTime}
                        onChange={(e) => setCustomStartTime(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Fin</label>
                      <input
                        type="datetime-local"
                        value={customEndTime}
                        onChange={(e) => setCustomEndTime(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 border border-gray-200 text-center">
            <CalendarDaysIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Aucune réservation trouvée</p>
            <p className="text-gray-500 text-sm mt-2">Essayez de modifier vos filtres</p>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-6">
              {bookings.map((booking) => (
                <div
                  key={booking._id}
                  onClick={() => handleReservationClick(booking)}
                  className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {booking.serviceItem?.name || 'Réservation'}
                        </h3>
                        {getStatusBadge(booking.status)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <UserIcon className="w-4 h-4" />
                          <span className="font-medium">Client:</span> {booking.customer?.fullName || 'N/A'}
                        </div>
                        <div className="flex items-center gap-2">
                          <ClockIcon className="w-4 h-4" />
                          <span className="font-medium">Début:</span> {formatDate(booking.serviceStartTime)}
                        </div>
                        <div className="flex items-center gap-2">
                          <CurrencyDollarIcon className="w-4 h-4" />
                          <span className="font-medium">Montant:</span> {formatCurrency(booking.totalAmount)}
                        </div>
                      </div>

                      {booking.serviceItem?.type && (
                        <p className="text-sm text-gray-500 mt-2">
                          Type: {booking.serviceItem.type}
                        </p>
                      )}
                    </div>
                    <button className="ml-4 p-3 text-gray-400 hover:text-green-700 transition-colors">
                      <EyeIcon className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Précédent
                </button>
                <span className="px-4 py-2 text-gray-700">
                  Page {page} sur {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Suivant
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Reservation Detail Modal */}
      {showReservationModal && selectedReservation && (
        <ReservationDetailModal
          reservation={selectedReservation}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}

