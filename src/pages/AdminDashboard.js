import React, { useState, useEffect } from 'react';
import { 
  FaUsers, FaHome, FaCalendarCheck, FaBox, FaFileAlt, 
  FaStar, FaHandshake, FaDollarSign, FaArrowUp, FaArrowDown,
  FaEye, FaUserTie, FaUserFriends, FaBuilding, FaChartLine,
  FaCloudUploadAlt, FaClock, FaCheckCircle, FaTimesCircle,
  FaDownload, FaCheck, FaTimes, FaTrash, FaFilter, FaSearch
} from 'react-icons/fa';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [recentActivities, setRecentActivities] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [usersByType, setUsersByType] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetailsModal, setUserDetailsModal] = useState(false);
  const [userDetailsLoading, setUserDetailsLoading] = useState(false);
  const [documentsData, setDocumentsData] = useState(null);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentFilters, setDocumentFilters] = useState({
    documentType: 'all',
    userType: 'all',
    search: ''
  });

  useEffect(() => {
    fetchDashboardData();
    fetchRecentActivities();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(() => {
      fetchDashboardData();
      fetchRecentActivities();
    }, 300000);

    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/admin/dashboard`);
      if (response.data.success) {
        setDashboardData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/admin/recent-activities`);
      if (response.data.success) {
        setRecentActivities(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching recent activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsersByType = async (userType) => {
    try {
      if (usersByType[userType]) return; // Already loaded

      const response = await axios.get(`${API_BASE}/api/admin/users/${userType}`);
      if (response.data.success) {
        setUsersByType(prev => ({
          ...prev,
          [userType]: response.data.data
        }));
      }
    } catch (error) {
      console.error(`Error fetching ${userType} users:`, error);
    }
  };

  const fetchUserDetails = async (userId) => {
    if (!userId) return;
    
    setUserDetailsLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/api/admin/user/${userId}`);
      if (response.data.success) {
        setSelectedUser(response.data.data);
        setUserDetailsModal(true);
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
      setUserDetailsLoading(false);
    }
  };

  const fetchDocuments = React.useCallback(async (page = 1) => {
    setDocumentsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...documentFilters
      });
      
      console.log('📥 Fetching documents with params:', Object.fromEntries(params));
      
      const response = await axios.get(`${API_BASE}/api/admin/documents?${params}`);
      if (response.data.success) {
        console.log('📄 Documents response:', response.data);
        setDocumentsData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setDocumentsLoading(false);
    }
  }, [documentFilters]);

  const updateDocumentStatus = async (documentId, status, notes = '') => {
    try {
      const response = await axios.patch(`${API_BASE}/api/admin/document/${documentId}/status`, {
        status,
        notes
      });
      
      if (response.data.success) {
        // Refresh documents list
        fetchDocuments();
        return true;
      }
    } catch (error) {
      console.error('Error updating document status:', error);
    }
    return false;
  };

  const deleteDocument = async (documentId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      return;
    }

    try {
      const response = await axios.delete(`${API_BASE}/api/admin/document/${documentId}`);
      if (response.data.success) {
        fetchDocuments();
        return true;
      }
    } catch (error) {
      console.error('Error deleting document:', error);
    }
    return false;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const StatCard = ({ icon: Icon, title, value, change, changeType, color, subtitle }) => (
    <div className={`bg-gradient-to-br ${color} p-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 border border-opacity-20`}>
      <div className="flex items-center justify-between mb-4">
        <Icon className="w-8 h-8 text-white opacity-90" />
        {change !== undefined && (
          <div className={`flex items-center text-sm font-medium ${changeType === 'positive' ? 'text-green-100' : 'text-red-100'}`}>
            {changeType === 'positive' ? <FaArrowUp className="w-4 h-4 mr-1" /> : <FaArrowDown className="w-4 h-4 mr-1" />}
            {change > 0 ? '+' : ''}{change}%
          </div>
        )}
      </div>
      <div className="text-white">
        <h3 className="text-2xl font-bold mb-1">{typeof value === 'number' ? value.toLocaleString() : value}</h3>
        <p className="text-sm opacity-90 font-medium">{title}</p>
        {subtitle && <p className="text-xs opacity-75 mt-1">{subtitle}</p>}
      </div>
    </div>
  );

  const ChartCard = ({ title, children }) => (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <h3 className="text-xl font-bold text-gray-800 mb-4">{title}</h3>
      {children}
    </div>
  );

  const ProgressBar = ({ label, value, total, color }) => {
    const percentage = total > 0 ? (value / total) * 100 : 0;
    return (
      <div className="mb-4">
        <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
          <span>{label}</span>
          <span>{value} / {total}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className={`h-3 rounded-full ${color} transition-all duration-500`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          ></div>
        </div>
        <div className="text-xs text-gray-500 mt-1">{percentage.toFixed(1)}%</div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <FaTimesCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Erreur de chargement des données</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Vue d\'ensemble', icon: FaChartLine },
    { id: 'users', name: 'Utilisateurs', icon: FaUsers },
    { id: 'owners', name: 'Propriétaires', icon: FaBuilding },
    { id: 'partners', name: 'Intermédiaires', icon: FaUserTie },
    { id: 'tourists', name: 'Touristes', icon: FaUserFriends },
    { id: 'properties', name: 'Propriétés', icon: FaHome },
    { id: 'bookings', name: 'Réservations', icon: FaCalendarCheck },
    { id: 'documents', name: 'Documents', icon: FaFileAlt },
    { id: 'activities', name: 'Activités', icon: FaClock }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <div className="bg-gradient-to-r from-green-600 to-blue-600 w-10 h-10 rounded-lg flex items-center justify-center mr-4">
                  <FaChartLine className="text-white w-5 h-5" />
                </div>
                Atlasia Admin Dashboard
              </h1>
              <p className="text-gray-600 mt-2">
                Tableau de bord administrateur - Dernière mise à jour: {formatDate(dashboardData.timestamp)}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
                <FaEye className="w-4 h-4 inline mr-2" />
                Accès Public
              </div>
              <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
                Revenus Total: {formatCurrency(dashboardData.totalRevenue)}
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 overflow-x-auto">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                        activeTab === tab.id
                          ? 'border-green-500 text-green-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {tab.name}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard 
                icon={FaUsers}
                title="Utilisateurs Total"
                value={dashboardData.users.total}
                subtitle={`+${dashboardData.users.recent} ce mois`}
                color="from-blue-500 to-blue-700"
              />
              <StatCard 
                icon={FaHome}
                title="Propriétés"
                value={dashboardData.properties.total}
                subtitle={`${dashboardData.properties.withBookings} avec réservations`}
                color="from-green-500 to-green-700"
              />
              <StatCard 
                icon={FaDollarSign}
                title="Revenus Total"
                value={formatCurrency(dashboardData.totalRevenue)}
                subtitle="Propriétés + Packages"
                color="from-yellow-500 to-orange-600"
              />
              <StatCard 
                icon={FaCalendarCheck}
                title="Réservations"
                value={dashboardData.bookings.total}
                subtitle={`${dashboardData.bookings.confirmed} confirmées`}
                color="from-purple-500 to-purple-700"
              />
            </div>

            {/* Revenue & Booking Trends */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard title="Réservations Mensuelles (6 derniers mois)">
                <div className="space-y-3">
                  {dashboardData.bookings.monthly.slice(-6).map((month, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">
                        {month._id.month}/{month._id.year}
                      </span>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-800">{month.count} réservations</span>
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full"
                            style={{ 
                              width: `${(month.count / Math.max(...dashboardData.bookings.monthly.map(m => m.count))) * 100}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ChartCard>

              <ChartCard title="Distribution des Utilisateurs">
                <div className="space-y-4">
                  <ProgressBar 
                    label="Touristes" 
                    value={dashboardData.users.tourists}
                    total={dashboardData.users.total}
                    color="bg-gradient-to-r from-blue-500 to-blue-600"
                  />
                  <ProgressBar 
                    label="Propriétaires" 
                    value={dashboardData.users.propertyOwners}
                    total={dashboardData.users.total}
                    color="bg-gradient-to-r from-green-500 to-green-600"
                  />
                  <ProgressBar 
                    label="Intermédiaires" 
                    value={dashboardData.users.intermediaries}
                    total={dashboardData.users.total}
                    color="bg-gradient-to-r from-purple-500 to-purple-600"
                  />
                </div>
              </ChartCard>
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard 
                icon={FaBox}
                title="Packages"
                value={dashboardData.packages.total}
                subtitle={`${dashboardData.packages.bookings} réservations`}
                color="from-indigo-500 to-indigo-700"
              />
              <StatCard 
                icon={FaFileAlt}
                title="Documents"
                value={dashboardData.documents.total}
                subtitle={`+${dashboardData.documents.recent} ce mois`}
                color="from-teal-500 to-teal-700"
              />
              <StatCard 
                icon={FaStar}
                title="Note Moyenne"
                value={dashboardData.reviews.averageRating.toFixed(1)}
                subtitle={`${dashboardData.reviews.published} avis publiés`}
                color="from-yellow-500 to-yellow-700"
              />
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Répartition par Rôle">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center">
                    <FaUserFriends className="w-6 h-6 text-blue-600 mr-3" />
                    <span className="font-medium text-gray-800">Touristes</span>
                  </div>
                  <span className="text-2xl font-bold text-blue-600">{dashboardData.users.tourists}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center">
                    <FaBuilding className="w-6 h-6 text-green-600 mr-3" />
                    <span className="font-medium text-gray-800">Propriétaires</span>
                  </div>
                  <span className="text-2xl font-bold text-green-600">{dashboardData.users.propertyOwners}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center">
                    <FaUserTie className="w-6 h-6 text-purple-600 mr-3" />
                    <span className="font-medium text-gray-800">Intermédiaires</span>
                  </div>
                  <span className="text-2xl font-bold text-purple-600">{dashboardData.users.intermediaries}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <FaUsers className="w-6 h-6 text-gray-600 mr-3" />
                    <span className="font-medium text-gray-800">Administrateurs</span>
                  </div>
                  <span className="text-2xl font-bold text-gray-600">{dashboardData.users.admins}</span>
                </div>
              </div>
            </ChartCard>

            <ChartCard title="Utilisateurs Récents">
              {recentActivities?.users?.map((user, index) => (
                <div key={user._id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                  <div>
                    <p className="font-medium text-gray-800">{user.fullName}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      user.role === 'tourist' ? 'bg-blue-100 text-blue-800' :
                      user.role === 'owner' ? 'bg-green-100 text-green-800' :
                      user.role === 'partner' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role === 'tourist' ? 'Touriste' :
                       user.role === 'owner' ? 'Propriétaire' :
                       user.role === 'partner' ? 'Intermédiaire' : user.role}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">{formatDate(user.createdAt)}</p>
                  </div>
                </div>
              ))}
            </ChartCard>
          </div>
        )}

        {activeTab === 'properties' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Propriétés par Type">
              <div className="space-y-3">
                {dashboardData.properties.byType.map((type, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-gray-700 font-medium capitalize">{type._id || 'Non spécifié'}</span>
                    <div className="flex items-center space-x-3">
                      <span className="text-gray-800 font-bold">{type.count}</span>
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full"
                          style={{ 
                            width: `${(type.count / dashboardData.properties.total) * 100}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ChartCard>

            <ChartCard title="Propriétés par Ville (Top 10)">
              <div className="space-y-3">
                {dashboardData.properties.byCity.map((city, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-gray-700 font-medium">{city._id || 'Ville non spécifiée'}</span>
                    <div className="flex items-center space-x-3">
                      <span className="text-gray-800 font-bold">{city.count}</span>
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                          style={{ 
                            width: `${(city.count / Math.max(...dashboardData.properties.byCity.map(c => c.count))) * 100}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ChartCard>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-blue-500">
                <div className="flex items-center">
                  <FaCalendarCheck className="w-8 h-8 text-blue-500 mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-gray-800">{dashboardData.bookings.confirmed}</p>
                    <p className="text-sm text-gray-600">Confirmées</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-green-500">
                <div className="flex items-center">
                  <FaCheckCircle className="w-8 h-8 text-green-500 mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-gray-800">{dashboardData.bookings.completed}</p>
                    <p className="text-sm text-gray-600">Complétées</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-yellow-500">
                <div className="flex items-center">
                  <FaClock className="w-8 h-8 text-yellow-500 mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-gray-800">{dashboardData.bookings.pending}</p>
                    <p className="text-sm text-gray-600">En attente</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-red-500">
                <div className="flex items-center">
                  <FaTimesCircle className="w-8 h-8 text-red-500 mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-gray-800">{dashboardData.bookings.cancelled}</p>
                    <p className="text-sm text-gray-600">Annulées</p>
                  </div>
                </div>
              </div>
            </div>

            <ChartCard title="Revenus par Mois">
              <div className="space-y-4">
                {dashboardData.bookings.monthly.slice(-6).map((month, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-800">{month._id.month}/{month._id.year}</p>
                      <p className="text-sm text-gray-600">{month.count} réservations</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">{formatCurrency(month.revenue)}</p>
                      <div className="w-32 bg-gray-200 rounded-full h-2 mt-2">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full"
                          style={{ 
                            width: `${(month.revenue / Math.max(...dashboardData.bookings.monthly.map(m => m.revenue))) * 100}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ChartCard>
          </div>
        )}

        {activeTab === 'documents' && (
          <DocumentManagement 
            documentsData={documentsData}
            loading={documentsLoading}
            filters={documentFilters}
            onFiltersChange={setDocumentFilters}
            onLoadDocuments={fetchDocuments}
            onUpdateDocumentStatus={updateDocumentStatus}
            onDeleteDocument={deleteDocument}
            formatDate={formatDate}
            apiBase={API_BASE}
          />
        )}

        {activeTab === 'activities' && recentActivities && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Nouvelles Propriétés">
              {recentActivities.properties.map((property, index) => (
                <div key={property._id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                  <div>
                    <p className="font-medium text-gray-800">{property.title}</p>
                    <p className="text-sm text-gray-500">{property.localisation?.city}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">{property.owner?.fullName}</p>
                    <p className="text-xs text-gray-500">{formatDate(property.createdAt)}</p>
                  </div>
                </div>
              ))}
            </ChartCard>

            <ChartCard title="Nouvelles Réservations">
              {recentActivities.bookings.map((booking, index) => (
                <div key={booking._id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                  <div>
                    <p className="font-medium text-gray-800">{booking.property?.title}</p>
                    <p className="text-sm text-gray-500">Par {booking.guest?.fullName}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      booking.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {booking.status}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">{formatDate(booking.createdAt)}</p>
                  </div>
                </div>
              ))}
            </ChartCard>
          </div>
        )}

        {/* User Management Tabs */}
        {(activeTab === 'owners' || activeTab === 'partners' || activeTab === 'tourists') && (
          <UserListTab 
            userType={activeTab === 'owners' ? 'owner' : activeTab === 'partners' ? 'partner' : 'tourist'}
            users={usersByType[activeTab === 'owners' ? 'owner' : activeTab === 'partners' ? 'partner' : 'tourist']}
            onLoadUsers={fetchUsersByType}
            onUserClick={fetchUserDetails}
          />
        )}
      </div>

      {/* User Details Modal */}
      {userDetailsModal && selectedUser && (
        <UserDetailsModal 
          user={selectedUser}
          isOpen={userDetailsModal}
          onClose={() => {
            setUserDetailsModal(false);
            setSelectedUser(null);
          }}
          loading={userDetailsLoading}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
        />
      )}
    </div>
  );
};

// User List Tab Component
const UserListTab = ({ userType, users, onLoadUsers, onUserClick }) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  
  React.useEffect(() => {
    onLoadUsers(userType);
  }, [userType, onLoadUsers]);

  const getUserTypeLabel = (type) => {
    switch(type) {
      case 'owner': return 'Propriétaires';
      case 'partner': return 'Intermédiaires';
      case 'tourist': return 'Touristes';
      default: return 'Utilisateurs';
    }
  };

  const filteredUsers = users?.users?.filter(user => 
    user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">{getUserTypeLabel(userType)}</h2>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
              <FaUsers className="h-5 w-5 text-gray-400" />
            </div>
          </div>
          <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
            Total: {users?.pagination?.totalUsers || 0}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((user) => (
          <div
            key={user._id}
            onClick={() => onUserClick(user._id)}
            className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow border border-gray-200"
          >
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                  {user.fullName ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-medium text-gray-900 truncate">
                  {user.fullName || 'Nom non disponible'}
                </h3>
                <p className="text-sm text-gray-500 truncate">{user.email}</p>
                {user.phone && (
                  <p className="text-sm text-gray-500">{user.phone}</p>
                )}
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                user.role === 'owner' ? 'bg-green-100 text-green-800' :
                user.role === 'partner' ? 'bg-purple-100 text-purple-800' :
                user.role === 'tourist' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {user.role === 'owner' ? 'Propriétaire' :
                 user.role === 'partner' ? 'Intermédiaire' :
                 user.role === 'tourist' ? 'Touriste' : user.role}
              </span>
              <span className="text-xs text-gray-500">
                {new Date(user.createdAt).toLocaleDateString('fr-FR')}
              </span>
            </div>
          </div>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <FaUsers className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">Aucun utilisateur trouvé</h3>
          <p className="mt-1 text-gray-500">
            {searchTerm ? 'Essayez avec d\'autres termes de recherche.' : 'Aucun utilisateur de ce type pour le moment.'}
          </p>
        </div>
      )}
    </div>
  );
};

// User Details Modal Component
const UserDetailsModal = ({ user, isOpen, onClose, loading, formatCurrency, formatDate }) => {
  if (!isOpen || !user) return null;

  const renderUserStats = () => {
    const { statistics } = user;
    const userRole = user.user.role;

    if (userRole === 'owner') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <FaHome className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-green-600">{statistics.propertiesOwned}</p>
                <p className="text-sm text-gray-600">Propriétés</p>
              </div>
            </div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <FaCalendarCheck className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-blue-600">{statistics.totalBookingsReceived}</p>
                <p className="text-sm text-gray-600">Réservations</p>
              </div>
            </div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center">
              <FaDollarSign className="h-8 w-8 text-yellow-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-yellow-600">{formatCurrency(statistics.totalRevenue)}</p>
                <p className="text-sm text-gray-600">Revenus</p>
              </div>
            </div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center">
              <FaStar className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-purple-600">{statistics.averagePropertyRating.toFixed(1)}</p>
                <p className="text-sm text-gray-600">Note moyenne</p>
              </div>
            </div>
          </div>
        </div>
      );
    } else if (userRole === 'partner') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <FaHandshake className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-green-600">{statistics.propertiesManaged}</p>
                <p className="text-sm text-gray-600">Propriétés gérées</p>
              </div>
            </div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <FaBox className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-blue-600">{statistics.packagesCreated}</p>
                <p className="text-sm text-gray-600">Packages créés</p>
              </div>
            </div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center">
              <FaDollarSign className="h-8 w-8 text-yellow-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-yellow-600">{formatCurrency(statistics.packageRevenue)}</p>
                <p className="text-sm text-gray-600">Revenus packages</p>
              </div>
            </div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center">
              <FaCalendarCheck className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-purple-600">{statistics.packageBookings}</p>
                <p className="text-sm text-gray-600">Réservations packages</p>
              </div>
            </div>
          </div>
        </div>
      );
    } else if (userRole === 'tourist') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <FaCalendarCheck className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-blue-600">{statistics.totalBookings}</p>
                <p className="text-sm text-gray-600">Réservations</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <FaBox className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-green-600">{statistics.packageBookings}</p>
                <p className="text-sm text-gray-600">Packages réservés</p>
              </div>
            </div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center">
              <FaDollarSign className="h-8 w-8 text-yellow-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-yellow-600">{formatCurrency(statistics.totalSpent)}</p>
                <p className="text-sm text-gray-600">Total dépensé</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900">
            Détails de l'utilisateur
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* User Basic Info */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="flex items-center space-x-6">
                <div className="flex-shrink-0">
                  <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                    {user.user.fullName ? user.user.fullName.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
                  </div>
                </div>
                <div>
                  <h4 className="text-2xl font-bold text-gray-900">{user.user.fullName}</h4>
                  <p className="text-gray-600">{user.user.email}</p>
                  {user.user.phone && <p className="text-gray-600">{user.user.phone}</p>}
                  <div className="mt-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      user.user.role === 'owner' ? 'bg-green-100 text-green-800' :
                      user.user.role === 'partner' ? 'bg-purple-100 text-purple-800' :
                      user.user.role === 'tourist' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {user.user.role === 'owner' ? 'Propriétaire' :
                       user.user.role === 'partner' ? 'Intermédiaire' :
                       user.user.role === 'tourist' ? 'Touriste' : user.user.role}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Inscrit le {formatDate(user.user.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div>
              <h5 className="text-xl font-semibold text-gray-900 mb-4">Statistiques</h5>
              {renderUserStats()}
            </div>

            {/* Recent Reviews */}
            {user.recentReviews && user.recentReviews.length > 0 && (
              <div>
                <h5 className="text-xl font-semibold text-gray-900 mb-4">Avis récents donnés</h5>
                <div className="space-y-3">
                  {user.recentReviews.map((review, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{review.property?.title}</span>
                        <div className="flex items-center">
                          {[...Array(review.rating)].map((_, i) => (
                            <FaStar key={i} className="text-yellow-400 w-4 h-4" />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm">{review.comment}</p>
                      <p className="text-xs text-gray-500 mt-2">{formatDate(review.createdAt)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Document Management Component
const DocumentManagement = ({ 
  documentsData, 
  loading, 
  filters, 
  onFiltersChange, 
  onLoadDocuments, 
  onUpdateDocumentStatus, 
  onDeleteDocument,
  formatDate,
  apiBase
}) => {
  React.useEffect(() => {
    onLoadDocuments();
  }, [onLoadDocuments]);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case 'approved': return 'Approuvé';
      case 'rejected': return 'Rejeté';
      case 'pending': return 'En attente';
      default: return status;
    }
  };

  const getUserRoleLabel = (role) => {
    switch(role) {
      case 'owner': return 'Propriétaire';
      case 'partner': return 'Intermédiaire';
      case 'tourist': return 'Touriste';
      default: return role;
    }
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {documentsData?.statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
            <div className="flex items-center">
              <FaFileAlt className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-blue-600">{documentsData.statistics.totalDocuments}</p>
                <p className="text-sm text-gray-600">Total Documents</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
            <div className="flex items-center">
              <FaUsers className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-green-600">{documentsData.pagination?.totalDocuments || 0}</p>
                <p className="text-sm text-gray-600">Documents visibles</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
            <div className="flex items-center">
              <FaCloudUploadAlt className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-purple-600">{documentsData.documents?.length || 0}</p>
                <p className="text-sm text-gray-600">Cette page</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center space-x-2">
            <FaFilter className="text-gray-500" />
            <span className="font-medium text-gray-700">Filtres:</span>
          </div>
          

          <select
            value={filters.userType}
            onChange={(e) => onFiltersChange({ ...filters, userType: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500"
          >
            <option value="all">Tous les utilisateurs</option>
            <option value="owner">Propriétaires</option>
            <option value="partner">Intermédiaires</option>
          </select>

          <div className="relative flex-1 max-w-md">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom de fichier ou utilisateur..."
              value={filters.search}
              onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
      </div>

      {/* Documents List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Documents téléchargés ({documentsData?.pagination?.totalDocuments || 0})
          </h3>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Document
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {documentsData?.documents?.map((document) => (
                  <tr key={document._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FaFileAlt className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {document.originalName || document.fileName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatFileSize(document.fileSize)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{document.user.fullName}</div>
                        <div className="text-sm text-gray-500">{document.user.email}</div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          document.user.role === 'owner' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {getUserRoleLabel(document.user.role)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                      {document.documentType || 'Non spécifié'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        Téléchargé
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(document.uploadedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => window.open(`${apiBase}/api/documents/download/${document._id}`, '_blank')}
                          className="text-blue-600 hover:text-blue-900 flex items-center px-3 py-1 rounded-md border border-blue-300 hover:bg-blue-50"
                          title="Télécharger"
                        >
                          <FaDownload className="h-4 w-4 mr-1" />
                          Voir
                        </button>
                        
                        <button
                          onClick={() => onDeleteDocument(document._id)}
                          className="text-red-600 hover:text-red-900 flex items-center px-3 py-1 rounded-md border border-red-300 hover:bg-red-50"
                          title="Supprimer"
                        >
                          <FaTrash className="h-4 w-4 mr-1" />
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {documentsData?.documents?.length === 0 && !loading && (
          <div className="text-center py-12">
            <FaFileAlt className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">Aucun document trouvé</h3>
            <p className="mt-1 text-gray-500">
              Aucun document ne correspond à vos critères de recherche.
            </p>
          </div>
        )}

        {/* Pagination */}
        {documentsData?.pagination && documentsData.pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Page {documentsData.pagination.currentPage} sur {documentsData.pagination.totalPages}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => onLoadDocuments(documentsData.pagination.currentPage - 1)}
                  disabled={!documentsData.pagination.hasPrev}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Précédent
                </button>
                <button
                  onClick={() => onLoadDocuments(documentsData.pagination.currentPage + 1)}
                  disabled={!documentsData.pagination.hasNext}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Suivant
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
