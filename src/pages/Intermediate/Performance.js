import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaStar, FaHome, FaCalendarAlt, FaDollarSign, FaChartLine, FaUser } from 'react-icons/fa';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL;

const Performance = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [performanceData, setPerformanceData] = useState({
    managedProperties: 0,
    monthlyReservations: 0,
    totalRevenue: 0,
    occupancyRate: 0,
    rating: 5.0,
    reviews: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPerformanceData();
  }, []);

  const fetchPerformanceData = async () => {
    try {
      const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
      if (!token) {
        console.log("No token found, redirecting to login");
        navigate("/login");
        return;
      }

      console.log("Fetching performance data with token:", token.substring(0, 20) + "...");
      
      // Fetch partner performance data
      const response = await axios.get(`${API_BASE}/api/partner/performance`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Performance API response:", response.data);
      
      if (response.data.success) {
        setPerformanceData(response.data.data || response.data.performance);
      }
    } catch (error) {
      console.error('Error fetching performance data:', error);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      // Use mock data if API fails
      setPerformanceData({
        managedProperties: 7,
        monthlyReservations: 14,
        totalRevenue: 12000,
        occupancyRate: 75,
        rating: 5.0,
        reviews: [
          {
            id: 1,
            customerName: "Fatima Z.",
            rating: 5,
            comment: "Très bon service, je recommande fortement !"
          },
          {
            id: 2,
            customerName: "Mohamed A.",
            rating: 4,
            comment: "Bonne communication et bon suivi."
          },
          {
            id: 3,
            customerName: "Salma R.",
            rating: 5,
            comment: "Service rapide et efficace. Merci !"
          },
          {
            id: 4,
            customerName: "Akram Ezzaim",
            rating: 5,
            comment: "Chi haja lkher lahoma barik hhhhh"
          }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate('/acceuill');
  };

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    return (
      <div className="flex items-center gap-1">
        {[...Array(fullStars)].map((_, i) => (
          <FaStar key={i} className="text-yellow-400" />
        ))}
        {hasHalfStar && <FaStar className="text-yellow-400 opacity-50" />}
        {[...Array(5 - fullStars - (hasHalfStar ? 1 : 0))].map((_, i) => (
          <FaStar key={i + fullStars + (hasHalfStar ? 1 : 0)} className="text-gray-300" />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des performances...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* Header Section */}
      <div className="sticky top-0 z-50 bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            {/* Left: Back Button */}
            <button
              onClick={handleGoBack}
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
        {/* Section Title */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Performance Partenaire
          </h1>
          <p className="text-gray-600">
            {user?.fullName || 'M. Ezzaim'}
          </p>
        </div>

        {/* Performance Cards - Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 md:p-6 rounded-lg border border-green-200 transition-transform hover:shadow-lg hover:scale-[1.02]">
            <div className="flex items-center justify-between mb-2">
              <FaHome className="text-green-600 w-5 h-5 md:w-6 md:h-6" />
              <span className="text-2xl md:text-3xl font-bold text-green-700">{performanceData.managedProperties || 0}</span>
            </div>
            <p className="text-sm md:text-base text-gray-700">Propriétés Gérées</p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 md:p-6 rounded-lg border border-blue-200 transition-transform hover:shadow-lg hover:scale-[1.02]">
            <div className="flex items-center justify-between mb-2">
              <FaCalendarAlt className="text-blue-600 w-5 h-5 md:w-6 md:h-6" />
              <span className="text-2xl md:text-3xl font-bold text-blue-700">{performanceData.monthlyReservations || 0}</span>
            </div>
            <p className="text-sm md:text-base text-gray-700">Réservations du mois</p>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 md:p-6 rounded-lg border border-yellow-200 transition-transform hover:shadow-lg hover:scale-[1.02]">
            <div className="flex items-center justify-between mb-2">
              <FaDollarSign className="text-yellow-600 w-5 h-5 md:w-6 md:h-6" />
              <span className="text-xl md:text-2xl font-bold text-yellow-700">{(performanceData.totalRevenue || 0).toLocaleString()} MAD</span>
            </div>
            <p className="text-sm md:text-base text-gray-700">Revenu Total</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 md:p-6 rounded-lg border border-purple-200 transition-transform hover:shadow-lg hover:scale-[1.02]">
            <div className="flex items-center justify-between mb-2">
              <FaChartLine className="text-purple-600 w-5 h-5 md:w-6 md:h-6" />
              <span className="text-2xl md:text-3xl font-bold text-purple-700">{performanceData.occupancyRate || 0}%</span>
            </div>
            <p className="text-sm md:text-base text-gray-700">Taux d'occupation</p>
          </div>
        </div>

        {/* Main Content Grid - Desktop: 2 columns, Mobile: 1 column */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Rating Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6">
            <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-4">Note Moyenne</h3>
            <div className="flex items-center gap-3 mb-4">
              {renderStars(performanceData.rating || 0)}
              <span className="text-lg md:text-xl font-medium text-gray-700">
                {(performanceData.rating || 0).toFixed(1)} sur 5
              </span>
            </div>
            <div className="text-sm text-gray-600">
              Basé sur {performanceData.reviews?.length || 0} avis clients
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6">
            <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-4">Statistiques Rapides</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Revenu moyen par propriété</span>
                <span className="font-semibold text-gray-900">
                  {performanceData.managedProperties > 0 
                    ? Math.round((performanceData.totalRevenue || 0) / performanceData.managedProperties).toLocaleString() 
                    : 0} MAD
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Réservations moyennes</span>
                <span className="font-semibold text-gray-900">
                  {performanceData.managedProperties > 0 
                    ? Math.round((performanceData.monthlyReservations || 0) / performanceData.managedProperties) 
                    : 0} / mois
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Performance</span>
                <span className={`font-semibold ${
                  (performanceData.occupancyRate || 0) >= 80 ? 'text-green-600' :
                  (performanceData.occupancyRate || 0) >= 60 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {(performanceData.occupancyRate || 0) >= 80 ? 'Excellent' :
                   (performanceData.occupancyRate || 0) >= 60 ? 'Bon' : 'À améliorer'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Reviews - Full Width */}
        <div className="mt-8">
          <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-6">Avis Clients</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {(performanceData.reviews || []).map((review) => (
              <div key={review.id} className="bg-white border border-gray-200 rounded-lg p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-medium text-gray-800">{review.customerName}</p>
                  <div className="flex items-center gap-1">
                    {renderStars(review.rating)}
                  </div>
                </div>
                <p className="text-sm md:text-base text-gray-600 leading-relaxed">{review.comment}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Performance;