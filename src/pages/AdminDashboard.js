import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/adminApi';
import { FaUsers, FaHome, FaCalendarAlt, FaDollarSign, FaChartLine, FaClock, FaSync, FaUser, FaBuilding, FaChartPie, FaTimes, FaFileAlt, FaSearch, FaFilter, FaDownload, FaEye } from 'react-icons/fa';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [activities, setActivities] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [selectedProperty, setSelectedProperty] = useState(null);
  
  // Management data states
  const [allUsers, setAllUsers] = useState([]);
  const [allProperties, setAllProperties] = useState([]);
  const [allDocuments, setAllDocuments] = useState([]);
  const [managementLoading, setManagementLoading] = useState(false);
  
  // Search and filter states
  const [userSearch, setUserSearch] = useState('');
  const [propertySearch, setPropertySearch] = useState('');
  const [documentSearch, setDocumentSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchDashboardData();
  }, [selectedPeriod]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Starting to fetch dashboard data...');
      console.log('🔍 API URL:', process.env.REACT_APP_API_URL);
      
      const [statsRes, chartRes, activitiesRes, analyticsRes] = await Promise.all([
        adminApi.getDashboardStats(),
        adminApi.getChartData(selectedPeriod),
        adminApi.getRecentActivities(),
        adminApi.getAnalytics(selectedPeriod)
      ]);

      console.log('✅ Dashboard data fetched successfully:', {
        stats: statsRes,
        chartData: chartRes,
        activities: activitiesRes,
        analytics: analyticsRes
      });

      setStats(statsRes.data || null);
      setChartData(chartRes.data || null);
      setActivities(activitiesRes.activities || []);
      setAnalytics(analyticsRes.data || null);
    } catch (err) {
      console.error('❌ Error fetching dashboard data:', err);
      console.error('❌ Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        config: err.config
      });
      setError(`Failed to load dashboard data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = async (activity) => {
    if (activity.type === 'user') {
      setSelectedUser(activity);
      try {
        const response = await adminApi.getUserDetails(activity.id);
        console.log('📊 User details response:', response);
        // Backend returns { success: true, data: { user, statistics, recentReviews } }
        if (response.success && response.data) {
          const stats = response.data.statistics || {};
          console.log('🏠 Properties data:', stats.properties);
          console.log('💰 First property price:', stats.properties?.[0]?.price);
          
          setUserDetails({
            user: response.data.user,
            stats: {
              totalRevenue: stats.totalRevenue || 0,
              totalBookings: stats.totalBookings || stats.totalBookingsReceived || 0,
              propertyCount: stats.propertiesOwned || 0,
              documentCount: 0, // Will need to fetch separately
              packageBookings: stats.packageBookings || 0,
              totalSpent: stats.totalSpent || 0,
              propertyDocumentCount: 0
            },
            reviews: response.data.recentReviews,
            properties: stats.properties || [],
            packages: stats.recentPackages || [],
            bookings: stats.recentBookings || stats.recentPackageBookings || [],
            documents: [],
            propertyRevenue: [],
            propertyDocuments: []
          });
        }
      } catch (err) {
        console.error('Error fetching user details:', err);
        setError('Failed to load user details');
      }
    }
  };

  const handlePropertyClick = (property) => {
    setSelectedProperty(property);
  };

  const handleDownloadDocument = async (documentUrl, fileName) => {
    try {
      console.log('📥 Downloading document:', { documentUrl, fileName });
      
      if (!documentUrl) {
        console.error('❌ No document URL provided');
        alert('Aucune URL de document disponible');
        return;
      }
      
      // Check if it's an external URL
      if (documentUrl.startsWith('http')) {
        console.log('🌐 Opening external URL:', documentUrl);
        window.open(documentUrl, '_blank');
      } else {
        // For API paths, construct the full URL
        const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:4000';
        const fullUrl = documentUrl.startsWith('/') ? `${baseUrl}${documentUrl}` : `${baseUrl}/${documentUrl}`;
        console.log('📄 Opening document at:', fullUrl);
        
        // Test if URL is accessible
        fetch(fullUrl, { method: 'HEAD' })
          .then(response => {
            console.log('📡 Document URL status:', response.status);
            if (response.ok) {
              window.open(fullUrl, '_blank');
            } else {
              console.error('❌ Document not accessible, status:', response.status);
              alert(`Le document n'est pas accessible (Status: ${response.status})`);
            }
          })
          .catch(fetchErr => {
            console.error('❌ Error checking document URL:', fetchErr);
            // Try to open anyway
            window.open(fullUrl, '_blank');
          });
      }
    } catch (err) {
      console.error('❌ Error in handleDownloadDocument:', err);
      console.error('❌ Error stack:', err.stack);
      alert(`Erreur lors du téléchargement du document: ${err.message}`);
    }
  };

  // Helper function to fetch all users
  const fetchAllUsers = async () => {
    setManagementLoading(true);
    try {
      const response = await adminApi.getAllUsers({ 
        search: userSearch, 
        role: roleFilter 
      });
      setAllUsers(response.users || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setManagementLoading(false);
    }
  };

  // Helper function to fetch all properties
  const fetchAllProperties = async () => {
    setManagementLoading(true);
    try {
      const response = await adminApi.getAllProperties({ 
        search: propertySearch, 
        status: statusFilter 
      });
      setAllProperties(response.properties || []);
    } catch (err) {
      console.error('Error fetching properties:', err);
    } finally {
      setManagementLoading(false);
    }
  };

  // Helper function to fetch all documents
  const fetchAllDocuments = async () => {
    setManagementLoading(true);
    try {
      const response = await adminApi.getAllDocuments({ 
        search: documentSearch, 
        role: roleFilter 
      });
      console.log('📄 Documents fetched:', response.documents);
      console.log('📄 First document URL:', response.documents?.[0]?.url);
      setAllDocuments(response.documents || []);
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
      setManagementLoading(false);
    }
  };

  // Auto-fetch data when switching to management tabs
  useEffect(() => {
    const fetchManagementData = async () => {
      if (activeTab === 'users' && allUsers.length === 0 && !managementLoading) {
        console.log('🔄 Auto-loading users...');
        await fetchAllUsers();
      } else if (activeTab === 'properties' && allProperties.length === 0 && !managementLoading) {
        console.log('🔄 Auto-loading properties...');
        await fetchAllProperties();
      } else if (activeTab === 'documents' && allDocuments.length === 0 && !managementLoading) {
        console.log('🔄 Auto-loading documents...');
        await fetchAllDocuments();
      }
    };
    
    fetchManagementData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, allUsers.length, allProperties.length, allDocuments.length]);

  const formatCurrency = (amount) => {
    // Check if amount is a valid number
    if (amount === null || amount === undefined || isNaN(amount) || amount === '') {
      return 'Non spécifié';
    }
    
    // Convert to number if it's a string
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    // Double-check after conversion
    if (isNaN(numAmount)) {
      return 'Non spécifié';
    }
    
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD'
    }).format(numAmount);
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'Date inconnue';
    return new Date(isoString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'tourist': return 'Touriste';
      case 'owner': return 'Propriétaire';
      case 'partner': return 'Partenaire';
      default: return 'Inconnu';
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'tourist': return 'bg-blue-100 text-blue-800';
      case 'owner': return 'bg-green-100 text-green-800';
      case 'partner': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'user': return <FaUser className="w-4 h-4" />;
      case 'property': return <FaHome className="w-4 h-4" />;
      case 'booking': return <FaCalendarAlt className="w-4 h-4" />;
      case 'package': return <FaBuilding className="w-4 h-4" />;
      default: return <FaClock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Erreur</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 mx-auto"
          >
            <FaSync className="w-4 h-4" />
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Tableau de Bord Admin</h1>
              <p className="text-gray-600">Gestion et analyse de la plateforme Atlasia</p>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="7d">7 derniers jours</option>
                <option value="30d">30 derniers jours</option>
                <option value="90d">90 derniers jours</option>
                <option value="1y">1 an</option>
              </select>
              <button
                onClick={fetchDashboardData}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <FaSync className="w-4 h-4" />
                Actualiser
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FaChartLine className="w-4 h-4 inline mr-2" />
              Vue d'ensemble
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'analytics'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FaChartPie className="w-4 h-4 inline mr-2" />
              Analytiques
            </button>
            <button
              onClick={() => setActiveTab('activities')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'activities'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FaClock className="w-4 h-4 inline mr-2" />
              Activités Récentes
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FaUsers className="w-4 h-4 inline mr-2" />
              Utilisateurs
            </button>
            <button
              onClick={() => setActiveTab('properties')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'properties'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FaHome className="w-4 h-4 inline mr-2" />
              Propriétés
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'documents'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FaFileAlt className="w-4 h-4 inline mr-2" />
              Documents
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                    <FaUsers className="w-6 h-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Utilisateurs</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats?.users?.total || 0}</p>
                    <p className="text-sm text-green-600">+{stats?.users?.newThisMonth || 0} ce mois</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-green-100 text-green-600">
                    <FaHome className="w-6 h-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Propriétés</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats?.properties?.total || 0}</p>
                    <p className="text-sm text-green-600">{stats?.properties?.published || 0} publiées</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                    <FaCalendarAlt className="w-6 h-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Réservations</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats?.bookings?.total || 0}</p>
                    <p className="text-sm text-green-600">+{stats?.bookings?.newThisMonth || 0} ce mois</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                    <FaDollarSign className="w-6 h-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Revenus</p>
                    <p className="text-2xl font-semibold text-gray-900">{formatCurrency(stats?.revenue?.total || 0)}</p>
                    <p className="text-sm text-green-600">{formatCurrency(stats?.revenue?.thisMonth || 0)} ce mois</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Statistics Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Properties Breakdown */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FaHome className="w-5 h-5 mr-2 text-green-600" />
                  Propriétés
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total</span>
                    <span className="text-lg font-bold text-gray-900">{stats?.properties?.total || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Publiées</span>
                    <span className="text-lg font-bold text-green-600">{stats?.properties?.published || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Brouillons</span>
                    <span className="text-lg font-bold text-yellow-600">{(stats?.properties?.total || 0) - (stats?.properties?.published || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Avec réservations</span>
                    <span className="text-lg font-bold text-blue-600">{stats?.properties?.withBookings || 0}</span>
                  </div>
                </div>
              </div>

              {/* Users Breakdown */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FaUsers className="w-5 h-5 mr-2 text-blue-600" />
                  Utilisateurs par Rôle
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Touristes</span>
                    <span className="text-lg font-bold text-blue-600">{stats?.users?.tourists || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Propriétaires</span>
                    <span className="text-lg font-bold text-green-600">{stats?.users?.propertyOwners || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Partenaires</span>
                    <span className="text-lg font-bold text-purple-600">{stats?.users?.intermediaries || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Administrateurs</span>
                    <span className="text-lg font-bold text-red-600">{stats?.users?.admins || 0}</span>
                  </div>
                </div>
              </div>

              {/* Bookings Breakdown */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FaCalendarAlt className="w-5 h-5 mr-2 text-yellow-600" />
                  Réservations par Statut
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Confirmées</span>
                    <span className="text-lg font-bold text-green-600">{stats?.bookings?.confirmed || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">En attente</span>
                    <span className="text-lg font-bold text-yellow-600">{stats?.bookings?.pending || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Terminées</span>
                    <span className="text-lg font-bold text-blue-600">{stats?.bookings?.completed || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Annulées</span>
                    <span className="text-lg font-bold text-red-600">{stats?.bookings?.cancelled || 0}</span>
                  </div>
                </div>
              </div>

              {/* Documents Breakdown */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FaFileAlt className="w-5 h-5 mr-2 text-indigo-600" />
                  Documents par Acteur
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total de documents</span>
                    <span className="text-lg font-bold text-gray-900">{stats?.documents?.total || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Documents des touristes</span>
                    <span className="text-lg font-bold text-blue-600">{stats?.documents?.byUserRole?.find(d => d._id === 'tourist')?.count || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Documents des propriétaires</span>
                    <span className="text-lg font-bold text-green-600">{stats?.documents?.byUserRole?.find(d => d._id === 'owner')?.count || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Documents des partenaires</span>
                    <span className="text-lg font-bold text-purple-600">{stats?.documents?.byUserRole?.find(d => d._id === 'partner')?.count || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activities */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Activité Récente</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {activities && activities.length > 0 ? activities.slice(0, 10).map((activity, index) => (
                  <div
                    key={index}
                    className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleUserClick(activity)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                            {getActivityIcon(activity.type)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {activity.title}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <p className="text-sm text-gray-500">
                              Email: {activity.details?.email || activity.details?.guest || activity.details?.owner || activity.details?.partner}
                            </p>
                            {activity.details?.role && (
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(activity.details.role)}`}>
                                {getRoleLabel(activity.details.role)}
                              </span>
            )}
          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-sm text-gray-500">
                        {formatDate(activity.createdAt)}
                    </div>
                    </div>
                  </div>
                )) : (
                  <div className="px-6 py-8 text-center text-gray-500">
                    <p>Aucune activité récente</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-8">
            {/* User Type Distribution */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FaUsers className="w-5 h-5 mr-2 text-blue-600" />
                Répartition des Types d'Utilisateurs
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {stats?.users?.roles && Object.entries(stats.users.roles).map(([role, count]) => {
                  const percentage = ((count / stats.users.total) * 100).toFixed(1);
                  const roleColors = {
                    tourist: 'text-blue-600',
                    owner: 'text-green-600',
                    partner: 'text-purple-600',
                    admin: 'text-red-600'
                  };
                  return (
                    <div key={role} className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className={`text-4xl font-bold ${roleColors[role] || 'text-gray-900'}`}>{count}</div>
                      <div className="text-sm text-gray-600 mt-1">{getRoleLabel(role)}</div>
                      <div className="text-lg font-semibold text-green-600 mt-2">{percentage}%</div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div 
                          className={`h-2 rounded-full ${roleColors[role]?.replace('text-', 'bg-') || 'bg-gray-600'}`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Properties Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Properties by Type */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FaHome className="w-5 h-5 mr-2 text-green-600" />
                  Propriétés par Type
                </h3>
                <div className="space-y-3">
                  {stats?.properties?.byType && stats.properties.byType.length > 0 ? (
                    stats.properties.byType.map((type) => {
                      const percentage = ((type.count / stats.properties.total) * 100).toFixed(1);
                      return (
                        <div key={type._id} className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700 capitalize">{type._id || 'Non spécifié'}</span>
                            <span className="text-sm font-bold text-gray-900">{type.count} ({percentage}%)</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-gray-500 text-sm">Aucune donnée disponible</p>
                  )}
                </div>
              </div>

              {/* Properties by City */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FaBuilding className="w-5 h-5 mr-2 text-indigo-600" />
                  Top 10 Villes
                </h3>
                <div className="space-y-3">
                  {stats?.properties?.byCity && stats.properties.byCity.length > 0 ? (
                    stats.properties.byCity.map((city) => {
                      const percentage = ((city.count / stats.properties.total) * 100).toFixed(1);
                      return (
                        <div key={city._id} className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">{city._id || 'Non spécifiée'}</span>
                            <span className="text-sm font-bold text-gray-900">{city.count} ({percentage}%)</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-gray-500 text-sm">Aucune donnée disponible</p>
                  )}
                </div>
              </div>
            </div>

            {/* Revenue & Booking Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Statistics */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FaDollarSign className="w-5 h-5 mr-2 text-purple-600" />
                  Statistiques de Revenus
                </h3>
                <div className="space-y-4">
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="text-sm text-gray-600">Revenus Totaux</div>
                    <div className="text-3xl font-bold text-purple-600">{formatCurrency(stats?.revenue?.total || 0)}</div>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="text-sm text-gray-600">Revenus ce Mois</div>
                    <div className="text-3xl font-bold text-green-600">{formatCurrency(stats?.revenue?.thisMonth || 0)}</div>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="text-sm text-gray-600">Valeur Moyenne par Réservation</div>
                    <div className="text-3xl font-bold text-blue-600">{formatCurrency(stats?.bookings?.revenue?.average || 0)}</div>
                  </div>
                </div>
              </div>

              {/* Documents Statistics */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FaFileAlt className="w-5 h-5 mr-2 text-orange-600" />
                  Documents par Type d'Utilisateur
                </h3>
                <div className="space-y-3">
                  {stats?.documents?.byUserRole && stats.documents.byUserRole.length > 0 ? (
                    stats.documents.byUserRole.map((doc) => {
                      const percentage = ((doc.count / stats.documents.total) * 100).toFixed(1);
                      const roleColors = {
                        tourist: 'bg-blue-500',
                        owner: 'bg-green-500',
                        partner: 'bg-purple-500',
                        admin: 'bg-red-500'
                      };
                      return (
                        <div key={doc._id} className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">{getRoleLabel(doc._id)}</span>
                            <span className="text-sm font-bold text-gray-900">{doc.count} docs ({percentage}%)</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${roleColors[doc._id] || 'bg-gray-500'}`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-gray-500 text-sm">Aucune donnée disponible</p>
                  )}
                </div>
              </div>
            </div>

            {/* Partnership & Review Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Partnerships */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Partenariats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total</span>
                    <span className="text-xl font-bold text-gray-900">{stats?.partnerships?.total || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Acceptés</span>
                    <span className="text-xl font-bold text-green-600">{stats?.partnerships?.accepted || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">En attente</span>
                    <span className="text-xl font-bold text-yellow-600">{stats?.partnerships?.pending || 0}</span>
                  </div>
                </div>
              </div>

              {/* Reviews */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Avis & Évaluations</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total d'avis</span>
                    <span className="text-xl font-bold text-gray-900">{stats?.reviews?.total || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Avis publiés</span>
                    <span className="text-xl font-bold text-green-600">{stats?.reviews?.published || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Note moyenne</span>
                    <span className="text-xl font-bold text-yellow-500 flex items-center">
                      {(stats?.reviews?.averageRating || 0).toFixed(1)} ⭐
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'activities' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Toutes les Activités Récentes</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {activities && activities.length > 0 ? activities.map((activity, index) => (
                <div
                  key={index}
                  className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleUserClick(activity)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          {getActivityIcon(activity.type)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {activity.title}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <p className="text-sm text-gray-500">
                            Email: {activity.details?.email || activity.details?.guest || activity.details?.owner || activity.details?.partner}
                          </p>
                          {activity.details?.role && (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(activity.details.role)}`}>
                              {getRoleLabel(activity.details.role)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-sm text-gray-500">
                      {formatDate(activity.createdAt)}
                    </div>
                    </div>
                  </div>
                )) : (
                  <div className="px-6 py-8 text-center text-gray-500">
                    <p>Aucune activité récente</p>
                  </div>
                )}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Search and Filter Bar */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher par nom ou email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="all">Tous les rôles</option>
                  <option value="tourist">Touristes</option>
                  <option value="owner">Propriétaires</option>
                  <option value="partner">Partenaires</option>
                  <option value="admin">Administrateurs</option>
                </select>
                <button
                  onClick={fetchAllUsers}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <FaSearch className="w-4 h-4" />
                  Rechercher
                </button>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {managementLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                </div>
              ) : allUsers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Utilisateur
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rôle
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Documents
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Inscription
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {allUsers.map((user) => (
                        <tr key={user._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 flex-shrink-0">
                                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                  <FaUser className="h-5 w-5 text-green-600" />
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {user.fullName || 'Sans nom'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{user.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                              {getRoleLabel(user.role)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-900">
                              <FaFileAlt className="mr-1 text-gray-400" />
                              {user.documentCount || 0}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(user.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleUserClick({ type: 'user', id: user._id })}
                              className="text-green-600 hover:text-green-900 mr-3"
                            >
                              Voir détails
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FaUsers className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun utilisateur</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Commencez par rechercher des utilisateurs.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'properties' && (
          <div className="space-y-6">
            {/* Search and Filter Bar */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher par titre ou ville..."
                    value={propertySearch}
                    onChange={(e) => setPropertySearch(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="published">Publiées</option>
                  <option value="draft">Brouillons</option>
                </select>
                <button
                  onClick={fetchAllProperties}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <FaSearch className="w-4 h-4" />
                  Rechercher
                </button>
              </div>
            </div>

            {/* Properties Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {managementLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                </div>
              ) : allProperties.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Propriété
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Propriétaire
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Localisation
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Prix
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Statut
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Réservations
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Documents
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {allProperties.map((property) => (
                        <tr key={property._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 flex-shrink-0">
                                {property.images && property.images.length > 0 ? (
                                  <img 
                                    src={property.images[0]} 
                                    alt={property.title}
                                    className="h-10 w-10 rounded object-cover"
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center">
                                    <FaHome className="h-5 w-5 text-gray-400" />
                                  </div>
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {property.title}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {property.owner?.fullName || property.owner?.email || 'Inconnu'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {property.localisation?.city || 'Non spécifié'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(property.price)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              property.status === 'published' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {property.status === 'published' ? 'Publiée' : 'Brouillon'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-900">
                              <FaCalendarAlt className="mr-1 text-gray-400" />
                              {property.bookingCount || 0}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-900">
                              <FaFileAlt className="mr-1 text-gray-400" />
                              {property.documents?.length || 0}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-3">
                              <button
                                onClick={() => handlePropertyClick(property)}
                                className="text-green-600 hover:text-green-900 flex items-center gap-1"
                              >
                                <FaEye />
                                Voir
                              </button>
                              <button
                                onClick={() => {
                                  if (property.owner?._id) {
                                    handleUserClick({ type: 'user', id: property.owner._id });
                                  }
                                }}
                                className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                              >
                                <FaUser />
                                Propriétaire
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FaHome className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune propriété</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Commencez par rechercher des propriétés.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="space-y-6">
            {/* Search and Filter Bar */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher par nom de fichier..."
                    value={documentSearch}
                    onChange={(e) => setDocumentSearch(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="all">Tous les utilisateurs</option>
                  <option value="tourist">Touristes</option>
                  <option value="owner">Propriétaires</option>
                  <option value="partner">Partenaires</option>
                </select>
                <button
                  onClick={fetchAllDocuments}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <FaSearch className="w-4 h-4" />
                  Rechercher
                </button>
              </div>
            </div>

            {/* Documents Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {managementLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                </div>
              ) : allDocuments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Document
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Uploadé par
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rôle
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date d'upload
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {allDocuments.map((document) => (
                        <tr key={document._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <FaFileAlt className="h-5 w-5 text-gray-400 mr-3" />
                              <div className="text-sm font-medium text-gray-900">
                                {document.fileName}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {document.type || document.documentType || 'Autre'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {document.user?.fullName || document.user?.email || 'Inconnu'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(document.user?.role)}`}>
                              {getRoleLabel(document.user?.role)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(document.uploadedAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-3">
                              {document.url && (
                                <>
                                  <button
                                    onClick={() => window.open(document.url, '_blank')}
                                    className="text-green-600 hover:text-green-900 flex items-center gap-1"
                                  >
                                    <FaEye />
                                    Voir
                                  </button>
                                  <button
                                    onClick={() => handleDownloadDocument(document.url, document.fileName)}
                                    className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                                  >
                                    <FaDownload />
                                    Télécharger
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => {
                                  if (document.user?._id) {
                                    handleUserClick({ type: 'user', id: document.user._id });
                                  }
                                }}
                                className="text-purple-600 hover:text-purple-900 flex items-center gap-1"
                              >
                                <FaUser />
                                Utilisateur
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FaFileAlt className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun document</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Commencez par rechercher des documents.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {selectedUser && userDetails && userDetails.user && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 xl:w-2/3 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Détails de l'Utilisateur</h3>
              <button
                onClick={() => {
                  setSelectedUser(null);
                  setUserDetails(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* User Basic Info */}
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                  <FaUser className="w-10 h-10 text-gray-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-2xl font-bold text-gray-900">{userDetails.user?.fullName || userDetails.user?.email || 'Utilisateur'}</h4>
                  <p className="text-gray-600 text-lg">{userDetails.user?.email || 'Non spécifié'}</p>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(userDetails.user?.role)}`}>
                    {getRoleLabel(userDetails.user?.role)}
                  </span>
                  <p className="text-sm text-gray-500 mt-1">
                    Membre depuis: {formatDate(userDetails.user?.createdAt)}
                  </p>
                </div>
              </div>

              {/* Statistics Cards */}
              <div className={`grid grid-cols-1 gap-4 ${userDetails.user?.role === 'owner' ? 'md:grid-cols-5' : userDetails.user?.role === 'tourist' ? 'md:grid-cols-3' : 'md:grid-cols-4'}`}>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{formatCurrency(userDetails.stats?.totalRevenue || 0)}</div>
                  <div className="text-sm text-blue-800">Revenus Totaux</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{userDetails.stats?.totalBookings || 0}</div>
                  <div className="text-sm text-green-800">Réservations</div>
                </div>
                {userDetails.user?.role === 'owner' && (
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{userDetails.stats?.propertyCount || 0}</div>
                    <div className="text-sm text-purple-800">Propriétés</div>
                  </div>
                )}
                <div className={`p-4 rounded-lg ${userDetails.user?.role === 'tourist' ? 'bg-blue-50' : 'bg-orange-50'}`}>
                  <div className={`text-2xl font-bold ${userDetails.user?.role === 'tourist' ? 'text-blue-600' : 'text-orange-600'}`}>
                    {userDetails.stats?.documentCount || 0}
                  </div>
                  <div className={`text-sm ${userDetails.user?.role === 'tourist' ? 'text-blue-800' : 'text-orange-800'}`}>
                    {userDetails.user?.role === 'tourist' ? 'Documents d\'Identité' : 'Documents Personnels'}
                  </div>
                  {userDetails.user?.role === 'tourist' && userDetails.stats?.documentCount > 0 && (
                    <div className="text-xs text-blue-600 font-medium mt-1">
                      ✓ Identité vérifiée
                    </div>
                  )}
                </div>
                {userDetails.user?.role === 'owner' && (
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-indigo-600">{userDetails.stats?.propertyDocumentCount || 0}</div>
                    <div className="text-sm text-indigo-800">Documents Propriétés</div>
                  </div>
                )}
              </div>

              {/* Booking Statistics Summary */}
              {userDetails.bookings && userDetails.bookings.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h6 className="font-semibold text-gray-900 mb-3">Statistiques des Réservations</h6>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">
                        {userDetails.bookings.filter(b => b.status === 'confirmed').length}
                      </div>
                      <div className="text-gray-600">Confirmées</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-yellow-600">
                        {userDetails.bookings.filter(b => b.status === 'pending').length}
                      </div>
                      <div className="text-gray-600">En attente</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-red-600">
                        {userDetails.bookings.filter(b => b.status === 'cancelled' || b.status === 'rejected').length}
                      </div>
                      <div className="text-gray-600">Annulées/Rejetées</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">
                        {userDetails.bookings.filter(b => b.status === 'completed').length}
                      </div>
                      <div className="text-gray-600">Terminées</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Properties Section for Owners */}
              {userDetails.user?.role === 'owner' && userDetails.properties && userDetails.properties.length > 0 && (
                <div className="border-t pt-6">
                  <h5 className="text-xl font-semibold text-gray-900 mb-4">Propriétés ({userDetails.properties.length})</h5>
                  <div className="space-y-4">
                    {userDetails.properties.map((property) => {
                      const propertyStats = userDetails.propertyRevenue?.find(p => p.propertyId.toString() === property._id.toString());
                      const propertyDocs = userDetails.propertyDocuments?.find(p => p.propertyId.toString() === property._id.toString());
                      return (
                        <div key={property._id} className="bg-gray-50 p-4 rounded-lg border">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h6 className="font-semibold text-gray-900 text-lg">{property.title}</h6>
                              <p className="text-gray-600">Prix: {formatCurrency(property.price)}</p>
                              <p className="text-gray-600">Statut: <span className={`px-2 py-1 rounded text-xs ${property.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{property.status === 'published' ? 'Publiée' : 'Brouillon'}</span></p>
                              <p className="text-gray-600">Ville: {property.localisation?.city || 'Non spécifiée'}</p>
                              {property.type && <p className="text-gray-600">Type: {property.type}</p>}
                              
                              {/* Property Documents */}
                              {propertyDocs && propertyDocs.documents && propertyDocs.documents.length > 0 ? (
                                <div className="mt-3">
                                  <p className="text-sm font-medium text-gray-700 mb-2">Documents de la propriété ({propertyDocs.documents.length}):</p>
                                  <div className="space-y-2">
                                    {propertyDocs.documents.map((doc, index) => {
                                      const fileName = doc.split('/').pop() || `Document ${index + 1}`;
                                      const isExternalUrl = doc.startsWith('http');
                                      const isLocalUrl = doc.startsWith('http://localhost');
                                      
                                      return (
                                        <div key={index} className="bg-white p-2 rounded border flex items-center justify-between">
                                          <div className="flex items-center space-x-2">
                                            <FaFileAlt className="w-4 h-4 text-green-600" />
                                            <span className="text-sm text-gray-700">{fileName}</span>
                                            {isLocalUrl && (
                                              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                                                Local
                                              </span>
                                            )}
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <button
                                              onClick={() => window.open(doc, '_blank')}
                                              className="text-green-600 hover:text-green-800 text-xs font-medium flex items-center gap-1"
                                            >
                                              <FaEye className="w-3 h-3" />
                                              Voir
                                            </button>
                                            <button
                                              onClick={() => handleDownloadDocument(doc, fileName)}
                                              className="text-blue-600 hover:text-blue-800 text-xs font-medium flex items-center gap-1"
                                            >
                                              <FaDownload className="w-3 h-3" />
                                              Télécharger
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              ) : (
                                <div className="mt-3">
                                  <p className="text-sm text-gray-500 italic">Aucun document de propriété trouvé</p>
                                </div>
                              )}
                            </div>
                            {propertyStats && (
                              <div className="text-right">
                                <div className="text-lg font-bold text-green-600">{formatCurrency(propertyStats.totalRevenue)}</div>
                                <div className="text-sm text-gray-600">Revenus</div>
                                <div className="text-sm text-gray-600">{propertyStats.bookingCount} réservations</div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Packages Section for Partners */}
              {userDetails.user?.role === 'partner' && userDetails.packages && userDetails.packages.length > 0 && (
                <div className="border-t pt-6">
                  <h5 className="text-xl font-semibold text-gray-900 mb-4">Packages ({userDetails.packages.length})</h5>
                  <div className="space-y-4">
                    {userDetails.packages.map((packageItem) => (
                      <div key={packageItem._id} className="bg-gray-50 p-4 rounded-lg border">
                        <h6 className="font-semibold text-gray-900 text-lg">{packageItem.name}</h6>
                        <p className="text-gray-600">Prix: {formatCurrency(packageItem.totalPrice || 0)}</p>
                        <p className="text-gray-600">Statut: <span className={`px-2 py-1 rounded text-xs ${packageItem.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{packageItem.status}</span></p>
                        <p className="text-gray-600">Créé: {formatDate(packageItem.createdAt)}</p>
                      </div>
                    ))}
                  </div>
            </div>
              )}

              {/* All Bookings Section */}
              {userDetails.bookings && userDetails.bookings.length > 0 && (
                <div className="border-t pt-6">
                  <h5 className="text-xl font-semibold text-gray-900 mb-4">
                    {userDetails.user?.role === 'owner' ? 'Réservations de Mes Propriétés' :
                     userDetails.user?.role === 'partner' ? 'Réservations de Mes Packages' :
                     'Mes Réservations'} ({userDetails.bookings.length})
                  </h5>
                  <div className="space-y-3">
                    {userDetails.bookings.map((booking) => (
                      <div key={booking._id} className="bg-gray-50 p-4 rounded-lg border">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h6 className="font-semibold text-gray-900">
                                {booking.property?.title || booking.package?.name || 'Réservation'}
                              </h6>
                              {booking.property && booking.package && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                  Package + Propriété
                                </span>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                              {booking.guest && (
                                <div>
                                  <span className="font-medium">Client:</span> {booking.guest.fullName || booking.guest.email}
                                </div>
                              )}
                              {booking.property && (
                                <div>
                                  <span className="font-medium">Propriété:</span> {booking.property.title}
                                </div>
                              )}
                              {booking.package && (
                                <div>
                                  <span className="font-medium">Package:</span> {booking.package.name}
                                </div>
                              )}
                              <div>
                                <span className="font-medium">Dates:</span> {
                                  booking.checkIn && booking.checkOut ? 
                                    `${formatDate(booking.checkIn)} - ${formatDate(booking.checkOut)}` : 
                                    formatDate(booking.createdAt)
                                }
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right space-y-2">
                            <div className="font-bold text-green-600 text-lg">
                              {formatCurrency(booking.totalAmount || 0)}
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                              booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              booking.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              booking.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {booking.status === 'confirmed' ? 'Confirmé' :
                               booking.status === 'pending' ? 'En attente' :
                               booking.status === 'cancelled' ? 'Annulé' :
                               booking.status === 'rejected' ? 'Rejeté' :
                               booking.status === 'completed' ? 'Terminé' :
                               booking.status}
                            </span>
                            <div className="text-xs text-gray-500">
                              {formatDate(booking.createdAt)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* User Documents Section */}
              {userDetails.documents && userDetails.documents.length > 0 && (
                <div className="border-t pt-6">
                  <h5 className="text-xl font-semibold text-gray-900 mb-4">
                    {userDetails.user?.role === 'tourist' ? 'Documents d\'Identité' : 'Documents Personnels'} ({userDetails.documents.length})
                  </h5>
                  
                  {/* Special highlighting for tourist identity documents */}
                  {userDetails.user?.role === 'tourist' && (
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                          <FaUser className="w-3 h-3 text-blue-600" />
                        </div>
                        <p className="text-sm font-medium text-blue-800">
                          Documents d'identité du touriste - Carte nationale, passeport ou permis de conduire
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    {userDetails.documents.map((document) => {
                      const isIdentityDoc = document.type === 'identity';
                      const isTourist = userDetails.user?.role === 'tourist';
                      
                      return (
                        <div key={document._id} className={`p-4 rounded-lg border ${
                          isIdentityDoc && isTourist 
                            ? 'bg-blue-50 border-blue-200' 
                            : 'bg-gray-50 border-gray-200'
                        }`}>
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                  isIdentityDoc && isTourist 
                                    ? 'bg-blue-100' 
                                    : 'bg-gray-100'
                                }`}>
                                  <FaFileAlt className={`w-5 h-5 ${
                                    isIdentityDoc && isTourist 
                                      ? 'text-blue-600' 
                                      : 'text-gray-600'
                                  }`} />
                                </div>
                                <div>
                                  <p className={`font-medium ${
                                    isIdentityDoc && isTourist 
                                      ? 'text-blue-900' 
                                      : 'text-gray-900'
                                  }`}>
                                    {document.filename}
                                  </p>
                                  <p className={`text-sm ${
                                    isIdentityDoc && isTourist 
                                      ? 'text-blue-700' 
                                      : 'text-gray-600'
                                  }`}>
                                    Type: {document.type === 'identity' ? 'Pièce d\'identité' : document.type}
                                  </p>
                                  <p className={`text-sm ${
                                    isIdentityDoc && isTourist 
                                      ? 'text-blue-600' 
                                      : 'text-gray-500'
                                  }`}>
                                    Uploadé: {formatDate(document.uploadedAt)}
                                  </p>
                                  {isIdentityDoc && isTourist && (
                                    <p className="text-xs text-blue-600 font-medium mt-1">
                                      ✓ Document d'identité du touriste
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end space-y-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                document.status === 'verified' ? 'bg-green-100 text-green-800' :
                                document.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                isIdentityDoc && isTourist ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {document.status === 'verified' ? 'Vérifié' :
                                 document.status === 'pending' ? 'En attente' :
                                 isIdentityDoc && isTourist ? 'Identité' :
                                 document.status}
                              </span>
                              {document.url && (
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => window.open(document.url, '_blank')}
                                    className={`text-sm font-medium flex items-center gap-1 ${
                                      isIdentityDoc && isTourist 
                                        ? 'text-blue-600 hover:text-blue-800' 
                                        : 'text-green-600 hover:text-green-800'
                                    }`}
                                  >
                                    <FaEye />
                                    Voir
                                  </button>
                                  <button
                                    onClick={() => handleDownloadDocument(document.url, document.filename)}
                                    className="text-sm font-medium flex items-center gap-1 text-blue-600 hover:text-blue-800"
                                  >
                                    <FaDownload />
                                    Télécharger
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Property Documents Section for Owners */}
              {userDetails.user?.role === 'owner' && userDetails.propertyDocuments && userDetails.propertyDocuments.length > 0 && (
                <div className="border-t pt-6">
                  <h5 className="text-xl font-semibold text-gray-900 mb-4">Documents des Propriétés</h5>
                  <div className="space-y-4">
                    {userDetails.propertyDocuments.map((property) => (
                      <div key={property.propertyId} className="bg-gray-50 p-4 rounded-lg border">
                        <h6 className="font-semibold text-gray-900 mb-3">{property.propertyTitle}</h6>
                        {property.documents && property.documents.length > 0 ? (
                          <div className="space-y-2">
                            {property.documents.map((doc, index) => (
                              <div key={index} className="bg-white p-3 rounded border">
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                                      <FaFileAlt className="w-4 h-4 text-green-600" />
                                    </div>
                                    <div>
                                      <p className="font-medium text-gray-900">{doc}</p>
                                      <p className="text-sm text-gray-600">Document de propriété</p>
                                    </div>
                                  </div>
                                  <a 
                                    href={doc} 
                            target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                  >
                                    Voir
                                  </a>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm">Aucun document de propriété</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No Data Messages */}
              {userDetails.user?.role === 'owner' && (!userDetails.properties || userDetails.properties.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <FaHome className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>Aucune propriété trouvée</p>
                </div>
              )}

              {userDetails.user?.role === 'partner' && (!userDetails.packages || userDetails.packages.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <FaBuilding className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>Aucun package créé</p>
                </div>
              )}

              {(!userDetails.bookings || userDetails.bookings.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <FaCalendarAlt className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>Aucune réservation trouvée</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Property Details Modal */}
      {selectedProperty && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 xl:w-2/3 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Détails de la Propriété</h3>
              <button
                onClick={() => setSelectedProperty(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Property Basic Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-2xl font-bold text-gray-900 mb-2">{selectedProperty.title}</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-semibold text-gray-700">Prix:</span>
                    <p className="text-gray-900">{formatCurrency(selectedProperty.price)}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Statut:</span>
                    <p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        selectedProperty.status === 'published' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {selectedProperty.status === 'published' ? 'Publiée' : 'Brouillon'}
                      </span>
                    </p>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Ville:</span>
                    <p className="text-gray-900">{selectedProperty.localisation?.city || 'Non spécifiée'}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Réservations:</span>
                    <p className="text-gray-900 flex items-center">
                      <FaCalendarAlt className="mr-1 text-gray-400" />
                      {selectedProperty.bookingCount || 0}
                    </p>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Date de création:</span>
                    <p className="text-gray-900">{formatDate(selectedProperty.createdAt)}</p>
                  </div>
                </div>
              </div>

              {/* Owner Info */}
              {selectedProperty.owner && (
                <div className="border-t pt-4">
                  <h5 className="text-lg font-semibold text-gray-900 mb-3">Propriétaire</h5>
                  <div className="bg-gray-50 p-4 rounded-lg flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                        <FaUser className="w-6 h-6 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{selectedProperty.owner.fullName}</p>
                        <p className="text-sm text-gray-600">{selectedProperty.owner.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (selectedProperty.owner?._id) {
                          handleUserClick({ type: 'user', id: selectedProperty.owner._id });
                          setSelectedProperty(null);
                        }
                      }}
                      className="text-blue-600 hover:text-blue-900 text-sm font-medium flex items-center gap-1"
                    >
                      <FaUser />
                      Voir le profil
                    </button>
                  </div>
                </div>
              )}

              {/* Property Images */}
              {selectedProperty.images && selectedProperty.images.length > 0 && (
                <div className="border-t pt-4">
                  <h5 className="text-lg font-semibold text-gray-900 mb-3">Images ({selectedProperty.images.length})</h5>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedProperty.images.slice(0, 6).map((image, index) => (
                      <div key={index} className="relative group">
                        <img 
                          src={image} 
                          alt={`${selectedProperty.title} - ${index + 1}`}
                          className="w-full h-40 object-cover rounded-lg"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/300x200?text=Image+non+disponible';
                          }}
                        />
                        <button
                          onClick={() => window.open(image, '_blank')}
                          className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 flex items-center justify-center transition-all duration-200 rounded-lg"
                        >
                          <FaEye className="text-white opacity-0 group-hover:opacity-100 w-8 h-8" />
                        </button>
                      </div>
                    ))}
                  </div>
                  {selectedProperty.images.length > 6 && (
                    <p className="text-sm text-gray-500 mt-2">
                      + {selectedProperty.images.length - 6} autres images
                    </p>
                  )}
                </div>
              )}

              {/* Property Documents */}
              {selectedProperty.documents && selectedProperty.documents.length > 0 && (
                <div className="border-t pt-4">
                  <h5 className="text-lg font-semibold text-gray-900 mb-3">Documents ({selectedProperty.documents.length})</h5>
                  <div className="space-y-2">
                    {selectedProperty.documents.map((doc, index) => {
                      const fileName = typeof doc === 'string' ? doc.split('/').pop() : `Document ${index + 1}`;
                      const docUrl = typeof doc === 'string' ? doc : doc.url;
                      
                      return (
                        <div key={index} className="bg-gray-50 p-3 rounded-lg flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <FaFileAlt className="w-5 h-5 text-green-600" />
                            <span className="text-sm font-medium text-gray-900">{fileName}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => window.open(docUrl, '_blank')}
                              className="text-green-600 hover:text-green-900 flex items-center gap-1 text-sm"
                            >
                              <FaEye />
                              Voir
                            </button>
                            <button
                              onClick={() => handleDownloadDocument(docUrl, fileName)}
                              className="text-blue-600 hover:text-blue-900 flex items-center gap-1 text-sm"
                            >
                              <FaDownload />
                              Télécharger
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;