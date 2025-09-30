import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/adminApi';
import { FaUsers, FaHome, FaCalendarAlt, FaDollarSign, FaChartLine, FaClock, FaEye, FaSync, FaUser, FaBuilding, FaChartPie, FaTimes, FaFileAlt } from 'react-icons/fa';

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

      setStats(statsRes.stats);
      setChartData(chartRes.data);
      setActivities(activitiesRes.activities);
      setAnalytics(analyticsRes.analytics);
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
        const userData = await adminApi.getUserDetails(activity.id);
        setUserDetails(userData);
      } catch (err) {
        console.error('Error fetching user details:', err);
        setError('Failed to load user details');
      }
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD'
    }).format(amount);
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
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
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto"
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
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="7d">7 derniers jours</option>
                <option value="30d">30 derniers jours</option>
                <option value="90d">90 derniers jours</option>
                <option value="1y">1 an</option>
              </select>
              <button
                onClick={fetchDashboardData}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
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
                  ? 'border-blue-500 text-blue-600'
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
                  ? 'border-blue-500 text-blue-600'
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
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FaClock className="w-4 h-4 inline mr-2" />
              Activités Récentes
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

            {/* Recent Activities */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Activité Récente</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {activities.slice(0, 10).map((activity, index) => (
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
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-8">
            {/* User Type Distribution */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Répartition des Types d'Utilisateurs</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats?.users?.roles && Object.entries(stats.users.roles).map(([role, count]) => {
                  const percentage = ((count / stats.users.total) * 100).toFixed(1);
                  return (
                    <div key={role} className="text-center">
                      <div className="text-3xl font-bold text-gray-900">{count}</div>
                      <div className="text-sm text-gray-600">{getRoleLabel(role)}</div>
                      <div className="text-lg font-semibold text-blue-600">{percentage}%</div>
                    </div>
                  );
                })}
                    </div>
                  </div>

            {/* Revenue Chart Placeholder */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Revenus dans le Temps</h3>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <FaChartLine className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Graphique des revenus (à implémenter)</p>
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
              {activities.map((activity, index) => (
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
                ))}
            </div>
          </div>
        )}
          </div>

      {/* User Details Modal */}
      {selectedUser && userDetails && (
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
                  <h4 className="text-2xl font-bold text-gray-900">{userDetails.user.fullName || userDetails.user.email}</h4>
                  <p className="text-gray-600 text-lg">{userDetails.user.email}</p>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(userDetails.user.role)}`}>
                    {getRoleLabel(userDetails.user.role)}
                  </span>
                  <p className="text-sm text-gray-500 mt-1">
                    Membre depuis: {formatDate(userDetails.user.createdAt)}
                  </p>
            </div>
          </div>

              {/* Statistics Cards */}
              <div className={`grid grid-cols-1 gap-4 ${userDetails.user.role === 'owner' ? 'md:grid-cols-5' : 'md:grid-cols-4'}`}>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{formatCurrency(userDetails.stats?.totalRevenue || 0)}</div>
                  <div className="text-sm text-blue-800">Revenus Totaux</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{userDetails.stats?.totalBookings || 0}</div>
                  <div className="text-sm text-green-800">Réservations</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{userDetails.stats?.propertyCount || 0}</div>
                  <div className="text-sm text-purple-800">Propriétés</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{userDetails.stats?.documentCount || 0}</div>
                  <div className="text-sm text-orange-800">Documents Personnels</div>
                </div>
                {userDetails.user.role === 'owner' && (
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
              {userDetails.user.role === 'owner' && userDetails.properties && userDetails.properties.length > 0 && (
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
                              <p className="text-gray-600">Statut: <span className={`px-2 py-1 rounded text-xs ${property.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{property.status}</span></p>
                              <p className="text-gray-600">Ville: {property.localisation?.city || 'Non spécifiée'}</p>
                              
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
                                            {isExternalUrl ? (
                                              <a 
                                                href={doc} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                                              >
                                                Voir
                                              </a>
                                            ) : (
                                              <span className="text-gray-400 text-xs">
                                                {isLocalUrl ? 'Fichier local' : 'Document'}
                                              </span>
                                            )}
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
              {userDetails.user.role === 'partner' && userDetails.packages && userDetails.packages.length > 0 && (
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
                    {userDetails.user.role === 'owner' ? 'Réservations de Mes Propriétés' :
                     userDetails.user.role === 'partner' ? 'Réservations de Mes Packages' :
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
                  <h5 className="text-xl font-semibold text-gray-900 mb-4">Documents Personnels ({userDetails.documents.length})</h5>
                  <div className="space-y-3">
                    {userDetails.documents.map((document) => (
                      <div key={document._id} className="bg-gray-50 p-4 rounded-lg border">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <FaFileAlt className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{document.filename}</p>
                                <p className="text-sm text-gray-600">Type: {document.type}</p>
                                <p className="text-sm text-gray-500">Uploadé: {formatDate(document.uploadedAt)}</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              document.status === 'verified' ? 'bg-green-100 text-green-800' :
                              document.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {document.status}
                            </span>
                            {document.url && (
                              <a 
                                href={document.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                              >
                                Voir le document
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Property Documents Section for Owners */}
              {userDetails.user.role === 'owner' && userDetails.propertyDocuments && userDetails.propertyDocuments.length > 0 && (
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
              {userDetails.user.role === 'owner' && (!userDetails.properties || userDetails.properties.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <FaHome className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>Aucune propriété trouvée</p>
                </div>
              )}

              {userDetails.user.role === 'partner' && (!userDetails.packages || userDetails.packages.length === 0) && (
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
    </div>
  );
};

export default AdminDashboard;