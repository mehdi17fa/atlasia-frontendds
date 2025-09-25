import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { FaArrowLeft, FaUser } from 'react-icons/fa';

const API_BASE_URL = process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL}/api` : 'http://localhost:4000/api';

const OwnerIncomePage = () => {
  const { user, token, isLoading, isAuthenticated } = useAuth();
  const [incomeData, setIncomeData] = useState({ income: 0, bookingCount: 0, properties: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const navigate = useNavigate();

  // Fetch income data
  const fetchIncome = async (startDate = '', endDate = '') => {
    // Wait for auth to initialize if still loading
    if (isLoading) {
      console.log('⏳ Auth still loading, waiting...');
      return;
    }

    // Check authentication
    if (!isAuthenticated || !token || !user?._id) {
      console.log('❌ Authentication failed:', {
        isAuthenticated,
        hasToken: !!token,
        hasUserId: !!user?._id,
        user: user
      });
      toast.error('Please log in to view your income');
      navigate('/login');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      params.append('status', 'confirmed,completed');

      console.log('📤 Fetching income:', {
        url: `${API_BASE_URL}/booking/income?${params.toString()}`,
        userId: user._id,
        startDate: startDate || 'none',
        endDate: endDate || 'none'
      });

      const response = await axios.get(`${API_BASE_URL}/booking/income?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log('📥 Income response:', response.data);

      if (response.data.success) {
        setIncomeData(response.data);
        if (response.data.bookingCount === 0) {
          const period = startDate && endDate ? `from ${startDate} to ${endDate}` : 'all time';
          toast(`No confirmed or completed bookings found for ${period}.`, {
            icon: 'ℹ️',
            style: { background: '#fff', color: '#333' },
          });
        }
      } else {
        setError('Failed to fetch income data');
        toast.error('Failed to fetch income data');
      }
    } catch (err) {
      console.error('Error fetching income:', err);
      const errorMessage = err.response?.data?.message || 'An unexpected error occurred';
      setError(errorMessage);
      if (err.response?.status === 401 || err.response?.status === 403) {
        console.log('🔐 Token invalid or expired, redirecting to login');
        toast.error('Session expired, please log in again');
        // Use the proper logout function instead of manual clearing
        if (window.authLogout) {
          window.authLogout();
        } else {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');
          localStorage.removeItem('refreshToken');
        }
        navigate('/login');
      } else if (err.response?.status === 500) {
        console.log('⚠️ Server error:', err.response?.data);
        toast.error('Unable to fetch income due to a server error. Please try again later.');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Load initial data on mount
  // Initial fetch on mount - wait for auth to be ready
  useEffect(() => {
    if (!isLoading) {
      fetchIncome();
    }
  }, [isLoading]); // Trigger when isLoading changes

  // Handle date filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setDateRange((prev) => ({ ...prev, [name]: value }));
  };

  // Apply date filter
  const applyFilter = () => {
    fetchIncome(dateRange.startDate, dateRange.endDate);
  };

  // Reset filter
  const resetFilter = () => {
    setDateRange({ startDate: '', endDate: '' });
    fetchIncome();
  };

  // Show loading state while auth is initializing
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700 mx-auto mb-4"></div>
          <p className="text-gray-600">Initialisation de l'authentification...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <Toaster position="top-right" reverseOrder={false} />
      
      {/* Header Section */}
      <div className="sticky top-0 z-50 bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            {/* Left: Back Button */}
            <button
              onClick={() => navigate('/')}
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
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Vos Revenus</h1>
          <p className="text-gray-600">Consultez vos revenus et statistiques de réservation</p>
        </div>

      {/* Date Filter */}
      <div className="w-full max-w-lg bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Filter by Stay Dates</h3>
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="date"
            name="startDate"
            value={dateRange.startDate}
            onChange={handleFilterChange}
            placeholder="jj/mm/aaaa"
            className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
          <input
            type="date"
            name="endDate"
            value={dateRange.endDate}
            onChange={handleFilterChange}
            placeholder="jj/mm/aaaa"
            className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>
        <div className="flex gap-4 mt-4">
          <button
            onClick={applyFilter}
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition duration-200"
          >
            Apply Filter
          </button>
          <button
            onClick={resetFilter}
            className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition duration-200"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Income Summary */}
      {loading && (
        <div className="text-gray-600 text-lg">Loading income data...</div>
      )}
      {error && (
        <div className="text-red-600 text-lg bg-red-100 p-4 rounded-md">
          Error: {error}
        </div>
      )}
      {!loading && !error && (
        <div className="w-full max-w-lg bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Total Income</h2>
          <p className="text-3xl font-bold text-green-600">
            ${incomeData.income.toLocaleString()}
          </p>
          <p className="text-gray-600 mt-2">
            From {incomeData.bookingCount} booking{incomeData.bookingCount !== 1 ? 's' : ''}
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Income is based on subtotal (base rental amount before fees).
          </p>
        </div>
      )}

      {/* Property Breakdown */}
      {!loading && !error && incomeData.properties?.length > 0 && (
        <div className="w-full max-w-lg bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Income by Property</h2>
          <div className="space-y-4">
            {incomeData.properties.map((property) => (
              <div
                key={property.propertyId}
                className="flex justify-between items-center p-4 bg-green-50 rounded-md"
              >
                <div>
                  <p className="text-gray-800 font-medium">{property.propertyTitle}</p>
                  <p className="text-gray-600 text-sm">
                    {property.bookingCount} booking{property.bookingCount !== 1 ? 's' : ''}
                  </p>
                </div>
                <p className="text-green-600 font-bold">
                  ${property.propertyIncome.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next Steps: Link to detailed bookings */}
      <div className="mt-6 text-center">
        <p className="text-gray-600">
          To view detailed bookings, check your{' '}
          <a
            href="/owner/bookings?status=confirmed,completed"
            className="text-green-600 hover:text-green-800 underline"
          >
            booking requests
          </a>.
        </p>
      </div>
      </div>
    </div>
  );
};

export default OwnerIncomePage;