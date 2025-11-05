import { api } from '../api';

export const adminApi = {
  // Get dashboard statistics
  getDashboardStats: async () => {
    console.log('🔍 Making request to /api/admin/dashboard');
    console.log('🔍 API base URL:', api.defaults.baseURL);
    const response = await api.get('/api/admin/dashboard');
    console.log('✅ Dashboard response:', response.data);
    return response.data;
  },

  // Get chart data for trends
  getChartData: async (period = '30d') => {
    const response = await api.get(`/api/admin/charts?period=${period}`);
    return response.data;
  },

  // Get recent activities
  getRecentActivities: async () => {
    const response = await api.get('/api/admin/recent-activities');
    return response.data;
  },

  // Get detailed analytics
  getAnalytics: async (period = '30d') => {
    const response = await api.get(`/api/admin/analytics?period=${period}`);
    return response.data;
  },

  // Get user details
  getUserDetails: async (userId) => {
    const response = await api.get(`/api/admin/user/${userId}`);
    return response.data;
  },

  // Get all users
  getAllUsers: async (params = {}) => {
    const { search, role, page = 1, limit = 50 } = params;
    const queryParams = new URLSearchParams();
    if (search) queryParams.append('search', search);
    if (role && role !== 'all') queryParams.append('role', role);
    queryParams.append('page', page);
    queryParams.append('limit', limit);
    
    const response = await api.get(`/api/admin/users/all?${queryParams.toString()}`);
    return response.data;
  },

  // Get all properties
  getAllProperties: async (params = {}) => {
    const { search, status, page = 1, limit = 50 } = params;
    const queryParams = new URLSearchParams();
    if (search) queryParams.append('search', search);
    if (status && status !== 'all') queryParams.append('status', status);
    queryParams.append('page', page);
    queryParams.append('limit', limit);
    
    const response = await api.get(`/api/admin/properties/all?${queryParams.toString()}`);
    return response.data;
  },

  // Get all documents
  getAllDocuments: async (params = {}) => {
    const { search, role, page = 1, limit = 50 } = params;
    const queryParams = new URLSearchParams();
    if (search) queryParams.append('search', search);
    if (role && role !== 'all') queryParams.append('role', role);
    queryParams.append('page', page);
    queryParams.append('limit', limit);
    
    const response = await api.get(`/api/admin/documents/all?${queryParams.toString()}`);
    return response.data;
  }
};
