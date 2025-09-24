import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaStar, FaHome, FaCalendarAlt, FaDollarSign, FaChartLine } from 'react-icons/fa';
import { AuthContext } from '../../contexts/AuthContext';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000';

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
        navigate("/login");
        return;
      }

      // Fetch partner performance data
      const response = await axios.get(`${API_BASE}/api/partner/performance`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setPerformanceData(response.data.performance);
      }
    } catch (error) {
      console.error('Error fetching performance data:', error);
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
      <div className="max-w-md mx-auto min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des performances...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-white p-4 pb-28">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={handleGoBack}
          className="flex items-center gap-2 text-green-700 hover:text-green-800 transition-colors"
        >
          <FaArrowLeft className="w-5 h-5" />
          <span className="font-medium">Retour</span>
        </button>
        <div className="text-center font-bold text-green-700 text-2xl">
          Atlasia
        </div>
        <div className="w-16"></div> {/* Spacer for centering */}
      </div>

      {/* Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Performance Partenaire
        </h1>
        <p className="text-gray-600">
          {user?.fullName || 'M. Ezzaim'}
        </p>
      </div>

      {/* Performance Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200 transition-transform hover:shadow-lg hover:scale-[1.02]">
          <div className="flex items-center justify-between mb-2">
            <FaHome className="text-green-600 w-5 h-5" />
            <span className="text-2xl font-bold text-green-700">{performanceData.managedProperties}</span>
          </div>
          <p className="text-sm text-gray-700">Propriétés Gérées</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200 transition-transform hover:shadow-lg hover:scale-[1.02]">
          <div className="flex items-center justify-between mb-2">
            <FaCalendarAlt className="text-blue-600 w-5 h-5" />
            <span className="text-2xl font-bold text-blue-700">{performanceData.monthlyReservations}</span>
          </div>
          <p className="text-sm text-gray-700">Réservations du mois</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200 transition-transform hover:shadow-lg hover:scale-[1.02]">
          <div className="flex items-center justify-between mb-2">
            <FaDollarSign className="text-yellow-600 w-5 h-5" />
            <span className="text-2xl font-bold text-yellow-700">{performanceData.totalRevenue.toLocaleString()} MAD</span>
          </div>
          <p className="text-sm text-gray-700">Revenu Total</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200 transition-transform hover:shadow-lg hover:scale-[1.02]">
          <div className="flex items-center justify-between mb-2">
            <FaChartLine className="text-purple-600 w-5 h-5" />
            <span className="text-2xl font-bold text-purple-700">{performanceData.occupancyRate}%</span>
          </div>
          <p className="text-sm text-gray-700">Taux d'occupation</p>
        </div>
      </div>

      {/* Rating Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Note Moyenne</h3>
        <div className="flex items-center gap-3">
          {renderStars(performanceData.rating)}
          <span className="text-lg font-medium text-gray-700">
            {performanceData.rating.toFixed(1)} sur 5
          </span>
        </div>
      </div>

      {/* Customer Reviews */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Avis Clients</h2>
        <div className="space-y-4 max-h-64 overflow-y-auto">
          {performanceData.reviews.map((review) => (
            <div key={review.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-gray-800">{review.customerName}</p>
                <div className="flex items-center gap-1">
                  {renderStars(review.rating)}
                </div>
              </div>
              <p className="text-sm text-gray-600">{review.comment}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Performance;