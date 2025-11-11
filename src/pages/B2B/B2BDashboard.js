import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../api';
import { 
  BuildingOfficeIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ClockIcon,
  ArrowRightIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import ReservationDetailModal from '../../components/B2B/ReservationDetailModal';

export default function B2BDashboard() {
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Dashboard stats
  const [stats, setStats] = useState({
    totalBookings: 0,
    revenue: 0,
    popularService: null
  });
  
  // Upcoming reservations (next 3)
  const [upcomingReservations, setUpcomingReservations] = useState([]);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [showReservationModal, setShowReservationModal] = useState(false);

  useEffect(() => {
    if (user && user.role === 'b2b') {
      fetchDashboardData();
    }
  }, [user]);

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

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch dashboard stats
      const statsResponse = await apiCall('/api/b2b/dashboard/stats').catch(() => {
        // Return mock data if API doesn't exist yet
        return {
          success: true,
          stats: {
            totalBookings: 24,
            revenue: 45000,
            popularService: {
              name: 'Tajine',
              count: 12
            }
          }
        };
      });

      if (statsResponse.success && statsResponse.stats) {
        setStats(statsResponse.stats);
      }

      // Fetch upcoming reservations (next 3)
      const bookingsResponse = await apiCall('/api/b2b/bookings?limit=3&status=upcoming').catch(() => {
        // Return mock data if API doesn't exist yet
        const now = new Date();
        const mockUpcomingReservations = [
          {
            _id: 'mock_booking_1',
            status: 'confirmed',
            customer: {
              fullName: 'Ahmed Benali',
              email: 'ahmed.benali@example.com',
              phoneNumber: '+212612345678'
            },
            serviceItem: {
              name: 'Tajine aux Pruneaux et Amandes',
              type: 'restaurant',
              description: 'Table pour 2 personnes - Réservation table'
            },
            serviceStartTime: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
            bookingDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
            totalAmount: 280,
            createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            notes: 'Préférence pour table près de la fenêtre, demande spéciale: tajine bien cuit'
          },
          {
            _id: 'mock_booking_2',
            status: 'upcoming',
            customer: {
              fullName: 'Fatima Alami',
              email: 'fatima.alami@example.com',
              phoneNumber: '+212698765432'
            },
            serviceItem: {
              name: 'Tajine de Poulet aux Citrons Confits',
              type: 'restaurant',
              description: 'Table pour 4 personnes - Réservation table'
            },
            serviceStartTime: new Date(now.getTime() + 18 * 60 * 60 * 1000).toISOString(), // 18 hours from now
            bookingDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
            totalAmount: 520,
            createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            notes: 'Anniversaire - gâteau souhaité'
          },
          {
            _id: 'mock_booking_3',
            status: 'confirmed',
            customer: {
              fullName: 'Youssef Idrissi',
              email: 'youssef.idrissi@example.com',
              phoneNumber: '+212655443322'
            },
            serviceItem: {
              name: 'Tajine d\'Agneau aux Légumes',
              type: 'restaurant',
              description: 'Table pour 3 personnes - Réservation table'
            },
            serviceStartTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
            bookingDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
            totalAmount: 450,
            createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            notes: 'Table en terrasse si possible'
          }
        ];
        return {
          success: true,
          bookings: mockUpcomingReservations
        };
      });

      if (bookingsResponse.success && bookingsResponse.bookings) {
        setUpcomingReservations(bookingsResponse.bookings);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Erreur lors du chargement des données');
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD'
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
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <BuildingOfficeIcon className="w-6 h-6 text-green-700" />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
                <p className="text-sm text-gray-600 truncate">{user.businessName || 'Bienvenue'}</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/b2b-profile')}
              className="px-4 py-2 text-green-700 hover:text-green-800 font-medium transition-colors whitespace-nowrap flex-shrink-0"
            >
              Mon profil
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        ) : (
          <>
            {/* Welcome Section */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-green-800 mb-2">
                Bienvenue, {user.fullName || user.businessName}!
              </h2>
              <p className="text-gray-600">Voici un aperçu de votre activité</p>
            </div>

            {/* General Insights Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Total Bookings Card */}
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <CalendarDaysIcon className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">Total des réservations</h3>
                <p className="text-3xl font-bold text-gray-900">{stats.totalBookings || 0}</p>
              </div>

              {/* Revenue Card */}
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <CurrencyDollarIcon className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">Revenus générés</h3>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.revenue)}</p>
              </div>

              {/* Popular Service Card */}
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <ChartBarIcon className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">Service le plus populaire</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.popularService?.name || 'Aucun'}
                </p>
                {stats.popularService && (
                  <p className="text-sm text-gray-500 mt-1">
                    {stats.popularService.count} réservation(s)
                  </p>
                )}
              </div>
            </div>

            {/* Upcoming Reservations Section */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Prochaines réservations</h2>
                  <p className="text-sm text-gray-600 mt-1">Vos 3 prochaines réservations</p>
                </div>
                <button
                  onClick={() => navigate('/b2b-bookings')}
                  className="flex items-center gap-2 px-4 py-2 bg-green-700 hover:bg-green-800 text-white rounded-lg transition-colors font-medium"
                >
                  Voir tout
                  <ArrowRightIcon className="w-5 h-5" />
                </button>
              </div>

              {upcomingReservations.length === 0 ? (
                <div className="text-center py-12">
                  <CalendarDaysIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">Aucune réservation à venir</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingReservations.map((reservation) => (
                    <div
                      key={reservation._id}
                      onClick={() => handleReservationClick(reservation)}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {reservation.serviceItem?.name || 'Réservation'}
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              reservation.status === 'confirmed' 
                                ? 'bg-green-100 text-green-800'
                                : reservation.status === 'upcoming'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {reservation.status === 'confirmed' ? 'Confirmée' : 
                               reservation.status === 'upcoming' ? 'À venir' : 
                               reservation.status}
                            </span>
                          </div>
                          <div className="space-y-1 text-sm text-gray-600">
                            <p className="flex items-center gap-2">
                              <span className="font-medium">Client:</span> 
                              {reservation.customer?.fullName || 'N/A'}
                            </p>
                            <p className="flex items-center gap-2">
                              <ClockIcon className="w-4 h-4" />
                              <span className="font-medium">Début du service:</span> 
                              {formatDate(reservation.serviceStartTime)}
                            </p>
                            <p className="flex items-center gap-2">
                              <CurrencyDollarIcon className="w-4 h-4" />
                              <span className="font-medium">Montant:</span> 
                              {formatCurrency(reservation.totalAmount)}
                            </p>
                          </div>
                        </div>
                        <button className="ml-4 p-2 text-gray-400 hover:text-green-700 transition-colors">
                          <EyeIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
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

