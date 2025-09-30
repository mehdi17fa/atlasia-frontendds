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
  }
};
