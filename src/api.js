import axios from "axios";
import './config/axios'; // Import global axios configuration
import { isTokenExpired } from './utils/tokenUtils';
import { tokenStorage } from './utils/tokenStorage';

const API_URL = process.env.REACT_APP_API_URL;

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Important for CORS with credentials
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Global navigation function to be set by the app
let globalNavigate = null;

export const setGlobalNavigate = (navigate) => {
  globalNavigate = navigate;
};

// Add token automatically if available
api.interceptors.request.use((config) => {
  try {
    const { accessToken } = tokenStorage.getTokens();
    console.log("🔍 API Request interceptor:", { 
      hasToken: !!accessToken, 
      url: config.url,
      tokenPreview: accessToken ? accessToken.substring(0, 20) + '...' : null
    });
    
    if (accessToken) {
      if (!isTokenExpired(accessToken)) {
        config.headers.Authorization = `Bearer ${accessToken}`;
        console.log("✅ Adding valid token to request");
      } else {
        console.log("⚠️ Access token is expired, will attempt refresh on response");
        // Still add the token - let the response interceptor handle refresh
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    } else {
      console.log("❌ No token available");
    }
  } catch (error) {
    console.error("❌ Error in request interceptor:", error);
  }
  
  return config;
});

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.log("🔍 API Response interceptor error:", {
      status: error.response?.status,
      url: error.config?.url,
      hasRetry: error.config?._retry
    });
    
    const originalRequest = error.config;

    // If error is 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log("🔄 401 error detected, attempting token refresh");
      originalRequest._retry = true;

      const { refreshToken } = tokenStorage.getTokens();
      console.log("🔍 Refresh token available:", !!refreshToken);
      
      if (refreshToken) {
        try {
          console.log('🔄 Attempting to refresh token...');
          
          const response = await axios.post(`${API_URL}/api/auth/refresh`, {
            refreshToken: refreshToken
          });

          if (response.data.accessToken) {
            console.log('✅ Token refreshed successfully');
            
            // Update stored tokens in all locations
            tokenStorage.setTokens(response.data.user, response.data.accessToken, response.data.refreshToken);
            
            // Update AuthContext if available
            if (window.authContextUpdate) {
              window.authContextUpdate(response.data.user, response.data.accessToken);
            }

            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          console.error('❌ Token refresh failed:', refreshError);
          
          // Refresh failed, clear tokens from all locations
          tokenStorage.clearTokens();
          
          // Trigger logout if available
          if (window.authLogout) {
            window.authLogout();
          }
          
          // Use React Router navigation instead of hard redirect
          if (globalNavigate) {
            globalNavigate('/login');
          } else {
            // Fallback to window.location only if navigate is not available
            window.location.href = '/login';
          }
        }
      } else {
        // No refresh token available, clear everything
        tokenStorage.clearTokens();
        
        // Use React Router navigation instead of hard redirect
        if (globalNavigate) {
          globalNavigate('/login');
        } else {
          // Fallback to window.location only if navigate is not available
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);
