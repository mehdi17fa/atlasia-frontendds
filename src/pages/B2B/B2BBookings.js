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
        const now = new Date();
        const generateMockBookings = () => {
          const tajineDishes = [
            'Tajine aux Pruneaux et Amandes',
            'Tajine de Poulet aux Citrons Confits',
            'Tajine d\'Agneau aux Légumes',
            'Tajine de Kefta aux Œufs',
            'Tajine de Poisson aux Olives',
            'Tajine de Bœuf aux Carottes',
            'Tajine de Poulet aux Olives',
            'Tajine de Légumes',
            'Tajine de Mouton aux Haricots Verts',
            'Tajine de Poulet aux Amandes',
            'Tajine d\'Agneau aux Pruneaux',
            'Tajine de Poisson aux Tomates',
            'Tajine de Kefta aux Tomates',
            'Tajine de Bœuf aux Pruneaux',
            'Tajine de Poulet aux Légumes',
            'Tajine d\'Agneau aux Olives',
            'Tajine de Poisson aux Citrons',
            'Tajine de Légumes aux Herbes'
          ];
          const customerNames = [
            { fullName: 'Ahmed Benali', email: 'ahmed.benali@example.com', phoneNumber: '+212612345678' },
            { fullName: 'Fatima Alami', email: 'fatima.alami@example.com', phoneNumber: '+212698765432' },
            { fullName: 'Youssef Idrissi', email: 'youssef.idrissi@example.com', phoneNumber: '+212655443322' },
            { fullName: 'Aicha Bensaid', email: 'aicha.bensaid@example.com', phoneNumber: '+212677889900' },
            { fullName: 'Mohamed Tazi', email: 'mohamed.tazi@example.com', phoneNumber: '+212644556677' },
            { fullName: 'Sanae El Fassi', email: 'sanae.elfassi@example.com', phoneNumber: '+212633445566' },
            { fullName: 'Karim Amrani', email: 'karim.amrani@example.com', phoneNumber: '+212622334455' },
            { fullName: 'Nadia Berrada', email: 'nadia.berrada@example.com', phoneNumber: '+212611223344' }
          ];
          
          const getTableSize = (index) => {
            const sizes = [2, 2, 3, 4, 2, 4, 3, 2, 4, 3, 2, 4, 2, 3, 4, 2, 3, 4];
            return sizes[index % sizes.length];
          };
          
          const bookings = [
            // Upcoming bookings within different time ranges
            {
              _id: 'mock_booking_1',
              status: 'confirmed',
              customer: customerNames[0],
              serviceItem: {
                name: tajineDishes[0],
                type: 'restaurant',
                description: `Table pour ${getTableSize(0)} personnes - Réservation table`
              },
              serviceStartTime: new Date(now.getTime() + 30 * 60 * 1000).toISOString(), // 30 min from now (within 1h)
              bookingDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
              totalAmount: 280,
              createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
              notes: 'Préférence pour table près de la fenêtre, demande spéciale: tajine bien cuit'
            },
            {
              _id: 'mock_booking_2',
              status: 'upcoming',
              customer: customerNames[1],
              serviceItem: {
                name: tajineDishes[1],
                type: 'restaurant',
                description: `Table pour ${getTableSize(1)} personnes - Réservation table`
              },
              serviceStartTime: new Date(now.getTime() + 90 * 60 * 1000).toISOString(), // 1.5h from now (within 2h)
              bookingDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              totalAmount: 320,
              createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              notes: 'Anniversaire - gâteau souhaité'
            },
            {
              _id: 'mock_booking_3',
              status: 'confirmed',
              customer: customerNames[2],
              serviceItem: {
                name: tajineDishes[2],
                type: 'restaurant',
                description: `Table pour ${getTableSize(2)} personnes - Réservation table`
              },
              serviceStartTime: new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString(), // 4h from now (within 6h)
              bookingDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
              totalAmount: 450,
              createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
              notes: 'Table en terrasse si possible'
            },
            {
              _id: 'mock_booking_4',
              status: 'upcoming',
              customer: customerNames[3],
              serviceItem: {
                name: tajineDishes[3],
                type: 'restaurant',
                description: `Table pour ${getTableSize(3)} personnes - Réservation table`
              },
              serviceStartTime: new Date(now.getTime() + 10 * 60 * 60 * 1000).toISOString(), // 10h from now (within 12h)
              bookingDate: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
              totalAmount: 380,
              createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
              notes: 'Allergie aux noix - attention'
            },
            {
              _id: 'mock_booking_5',
              status: 'confirmed',
              customer: customerNames[4],
              serviceItem: {
                name: tajineDishes[4],
                type: 'restaurant',
                description: `Table pour ${getTableSize(4)} personnes - Réservation table`
              },
              serviceStartTime: new Date(now.getTime() + 20 * 60 * 60 * 1000).toISOString(), // 20h from now (within 24h)
              bookingDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
              totalAmount: 290,
              createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
              notes: 'Première visite - recommandations bienvenues'
            },
            {
              _id: 'mock_booking_6',
              status: 'confirmed',
              customer: customerNames[5],
              serviceItem: {
                name: tajineDishes[5],
                type: 'restaurant',
                description: `Table pour ${getTableSize(5)} personnes - Réservation table`
              },
              serviceStartTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
              bookingDate: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
              totalAmount: 520,
              createdAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
              notes: 'Dîner d\'affaires'
            },
            {
              _id: 'mock_booking_7',
              status: 'upcoming',
              customer: customerNames[6],
              serviceItem: {
                name: tajineDishes[6],
                type: 'restaurant',
                description: `Table pour ${getTableSize(6)} personnes - Réservation table`
              },
              serviceStartTime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
              bookingDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
              totalAmount: 420,
              createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
              notes: 'Célébration - musique douce souhaitée'
            },
            // Past bookings
            {
              _id: 'mock_booking_8',
              status: 'past',
              customer: customerNames[0],
              serviceItem: {
                name: tajineDishes[7],
                type: 'restaurant',
                description: `Table pour ${getTableSize(7)} personnes - Réservation table`
              },
              serviceStartTime: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
              bookingDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
              totalAmount: 280,
              createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
              notes: 'Excellent service - client satisfait'
            },
            {
              _id: 'mock_booking_9',
              status: 'past',
              customer: customerNames[1],
              serviceItem: {
                name: tajineDishes[8],
                type: 'restaurant',
                description: `Table pour ${getTableSize(8)} personnes - Réservation table`
              },
              serviceStartTime: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
              bookingDate: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000).toISOString(),
              totalAmount: 480,
              createdAt: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000).toISOString(),
              notes: 'Famille avec enfants'
            },
            {
              _id: 'mock_booking_10',
              status: 'past',
              customer: customerNames[2],
              serviceItem: {
                name: tajineDishes[9],
                type: 'restaurant',
                description: `Table pour ${getTableSize(9)} personnes - Réservation table`
              },
              serviceStartTime: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
              bookingDate: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString(),
              totalAmount: 360,
              createdAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString(),
              notes: 'Client régulier'
            },
            // Canceled bookings
            {
              _id: 'mock_booking_11',
              status: 'canceled',
              customer: customerNames[3],
              serviceItem: {
                name: tajineDishes[10],
                type: 'restaurant',
                description: `Table pour ${getTableSize(10)} personnes - Réservation table`
              },
              serviceStartTime: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
              bookingDate: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(),
              totalAmount: 520,
              createdAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(),
              notes: 'Annulé par le client - changement de plans'
            },
            {
              _id: 'mock_booking_12',
              status: 'canceled',
              customer: customerNames[4],
              serviceItem: {
                name: tajineDishes[11],
                type: 'restaurant',
                description: `Table pour ${getTableSize(11)} personnes - Réservation table`
              },
              serviceStartTime: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
              bookingDate: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
              totalAmount: 480,
              createdAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
              notes: 'Annulé - client malade'
            },
            // More upcoming bookings
            {
              _id: 'mock_booking_13',
              status: 'confirmed',
              customer: customerNames[5],
              serviceItem: {
                name: tajineDishes[12],
                type: 'restaurant',
                description: `Table pour ${getTableSize(12)} personnes - Réservation table`
              },
              serviceStartTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
              bookingDate: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000).toISOString(),
              totalAmount: 280,
              createdAt: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000).toISOString(),
              notes: 'Déjeuner romantique'
            },
            {
              _id: 'mock_booking_14',
              status: 'upcoming',
              customer: customerNames[6],
              serviceItem: {
                name: tajineDishes[13],
                type: 'restaurant',
                description: `Table pour ${getTableSize(13)} personnes - Réservation table`
              },
              serviceStartTime: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days from now
              bookingDate: new Date(now.getTime() - 11 * 24 * 60 * 60 * 1000).toISOString(),
              totalAmount: 420,
              createdAt: new Date(now.getTime() - 11 * 24 * 60 * 60 * 1000).toISOString(),
              notes: 'Groupe d\'amis'
            },
            {
              _id: 'mock_booking_15',
              status: 'confirmed',
              customer: customerNames[7],
              serviceItem: {
                name: tajineDishes[14],
                type: 'restaurant',
                description: `Table pour ${getTableSize(14)} personnes - Réservation table`
              },
              serviceStartTime: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days from now
              bookingDate: new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000).toISOString(),
              totalAmount: 560,
              createdAt: new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000).toISOString(),
              notes: 'Réunion de famille'
            },
            {
              _id: 'mock_booking_16',
              status: 'past',
              customer: customerNames[0],
              serviceItem: {
                name: tajineDishes[15],
                type: 'restaurant',
                description: `Table pour ${getTableSize(15)} personnes - Réservation table`
              },
              serviceStartTime: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
              bookingDate: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(),
              totalAmount: 300,
              createdAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(),
              notes: 'Client très satisfait'
            },
            {
              _id: 'mock_booking_17',
              status: 'confirmed',
              customer: customerNames[1],
              serviceItem: {
                name: tajineDishes[16],
                type: 'restaurant',
                description: `Table pour ${getTableSize(16)} personnes - Réservation table`
              },
              serviceStartTime: new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days from now
              bookingDate: new Date(now.getTime() - 16 * 24 * 60 * 60 * 1000).toISOString(),
              totalAmount: 450,
              createdAt: new Date(now.getTime() - 16 * 24 * 60 * 60 * 1000).toISOString(),
              notes: 'Célébration spéciale'
            },
            {
              _id: 'mock_booking_18',
              status: 'past',
              customer: customerNames[2],
              serviceItem: {
                name: tajineDishes[17],
                type: 'restaurant',
                description: `Table pour ${getTableSize(17)} personnes - Réservation table`
              },
              serviceStartTime: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
              bookingDate: new Date(now.getTime() - 18 * 24 * 60 * 60 * 1000).toISOString(),
              totalAmount: 560,
              createdAt: new Date(now.getTime() - 18 * 24 * 60 * 60 * 1000).toISOString(),
              notes: 'Excellent tajine - recommandé à des amis'
            }
          ];
          
          return bookings;
        };
        
        const allBookings = generateMockBookings();
        const currentPage = parseInt(new URLSearchParams(queryString).get('page') || '1');
        const limit = parseInt(new URLSearchParams(queryString).get('limit') || '10');
        const statusFilter = new URLSearchParams(queryString).get('status');
        const timeRange = new URLSearchParams(queryString).get('timeRange');
        const startTime = new URLSearchParams(queryString).get('startTime');
        const endTime = new URLSearchParams(queryString).get('endTime');
        
        // Filter bookings based on status
        let filteredBookings = allBookings;
        if (statusFilter && statusFilter !== 'all') {
          filteredBookings = filteredBookings.filter(booking => booking.status === statusFilter);
        }
        
        // Filter bookings based on time range
        if (timeRange || startTime || endTime) {
          filteredBookings = filteredBookings.filter(booking => {
            const serviceTime = new Date(booking.serviceStartTime);
            const now = new Date();
            
            if (startTime && endTime) {
              const start = new Date(startTime);
              const end = new Date(endTime);
              return serviceTime >= start && serviceTime <= end;
            }
            
            if (timeRange) {
              const hours = parseInt(timeRange.replace('h', ''));
              const futureTime = new Date(now.getTime() + hours * 60 * 60 * 1000);
              return serviceTime >= now && serviceTime <= futureTime;
            }
            
            return true;
          });
        }
        
        // Paginate
        const startIndex = (currentPage - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedBookings = filteredBookings.slice(startIndex, endIndex);
        const totalPages = Math.ceil(filteredBookings.length / limit);
        
        return {
          success: true,
          bookings: paginatedBookings,
          pagination: {
            current: currentPage,
            total: totalPages,
            count: filteredBookings.length
          }
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

