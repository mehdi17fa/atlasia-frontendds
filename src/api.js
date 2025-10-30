import axios from "axios";
import './config/axios'; // Import global axios configuration
import { isTokenExpired } from './utils/tokenUtils';
import { tokenStorage } from './utils/tokenStorage';

// Prefer runtime-configurable base URL via window, fallback to env, then dev localhost
let API_URL = (typeof window !== 'undefined' && window.__API_BASE_URL__) || process.env.REACT_APP_API_URL || '';
if (!API_URL && typeof window !== 'undefined') {
  const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  if (isLocalhost) {
    API_URL = 'http://localhost:4000';
  }
}

// Log API configuration on startup
console.log('🔧 API Configuration:', {
  REACT_APP_API_URL: process.env.REACT_APP_API_URL,
  runtime_API_BASE_URL: typeof window !== 'undefined' ? window.__API_BASE_URL__ : undefined,
  API_URL: API_URL,
  isConfigured: typeof API_URL === 'string'
});

// Test API connection on startup
if (API_URL) {
  console.log('🔍 Testing API connection...');
  fetch(`${API_URL}/api/health`)
    .then(response => response.json())
    .then(data => console.log('✅ API connection test successful:', data))
    .catch(error => console.error('❌ API connection test failed:', error));
}

if (!API_URL) {
  console.error('❌ CRITICAL: REACT_APP_API_URL is not set!');
  console.error('Please create a .env file with: REACT_APP_API_URL=http://localhost:4000');
  console.error('Then restart the React development server.');
}

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

// Allow runtime override of base URL (e.g., from an injected config script)
export const setApiBaseUrl = (baseUrl) => {
  try {
    api.defaults.baseURL = baseUrl || '';
    if (typeof window !== 'undefined') {
      window.__API_BASE_URL__ = baseUrl || '';
    }
    console.log('🔧 API baseURL updated at runtime:', api.defaults.baseURL);
  } catch (e) {
    console.error('Failed to set API base URL at runtime:', e);
  }
};

// Add token automatically if available
api.interceptors.request.use((config) => {
  try {
    // Debug storage status
    const storageStatus = tokenStorage.getStorageStatus();
    const tokens = tokenStorage.getTokens();
    const { accessToken } = tokens;
    
    console.log("🔍 API Request interceptor DEBUG:", { 
      url: config.url,
      method: config.method,
      hasToken: !!accessToken, 
      tokenPreview: accessToken ? accessToken.substring(0, 20) + '...' : null,
      storageStatus: storageStatus,
      allTokens: {
        hasUser: !!tokens.user,
        hasAccessToken: !!tokens.accessToken,
        hasRefreshToken: !!tokens.refreshToken
      }
    });
    
    // Also check localStorage directly for comparison
    const directCheck = {
      atlasia_access_token: !!localStorage.getItem('atlasia_access_token'),
      accessToken: !!localStorage.getItem('accessToken'), 
      user: !!localStorage.getItem('atlasia_user')
    };
    console.log("🔍 Direct localStorage check:", directCheck);
    
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
      console.log("❌ No token available - checking AuthContext fallback");
      
      // Try getting token from AuthContext via window global
      if (window.authContextToken) {
        console.log("🔄 Using token from AuthContext global");
        config.headers.Authorization = `Bearer ${window.authContextToken}`;
      }
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
