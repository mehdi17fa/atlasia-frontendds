import React, { createContext, useState, useEffect } from 'react';
import { isTokenExpired, isTokenExpiringSoon } from '../utils/tokenUtils';

export const AuthContext = createContext();

// localStorage keys for consistency - match tokenStorage keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'atlasia_access_token',
  REFRESH_TOKEN: 'atlasia_refresh_token', 
  USER: 'atlasia_user'
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Helper function to store tokens in localStorage
  const storeTokens = (userData, accessToken, refreshTokenValue) => {
    try {
      if (userData) {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
      }
      if (accessToken) {
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      }
      if (refreshTokenValue) {
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshTokenValue);
      }
      console.log("✅ Tokens stored in localStorage");
    } catch (error) {
      console.error("❌ Error storing tokens:", error);
    }
  };

  // Helper function to clear tokens from localStorage
  const clearStoredTokens = () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.USER);
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      
      // Also clear any old storage keys that might be lingering
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('accessToken');
      
      // Clear from sessionStorage as backup
      sessionStorage.removeItem(STORAGE_KEYS.USER);
      sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      sessionStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      
      console.log("🧹 All tokens and user data cleared from localStorage");
    } catch (error) {
      console.error("❌ Error clearing tokens:", error);
    }
  };

  // Initialize auth state from localStorage on app startup
  useEffect(() => {
    const initializeAuth = async () => {
      console.log("🔄 Initializing auth from localStorage...");
      setIsLoading(true);
      
      try {
        const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
        const storedToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        const storedRefreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
        
        console.log("🔍 Found in localStorage:", {
          hasUser: !!storedUser,
          hasToken: !!storedToken,
          hasRefreshToken: !!storedRefreshToken,
          tokenPreview: storedToken ? storedToken.substring(0, 20) + '...' : null
        });
        
        if (storedUser && storedToken) {
          const parsedUser = JSON.parse(storedUser);
          
          // Validate token before restoring
          if (!isTokenExpired(storedToken)) {
            setUser(parsedUser);
            setToken(storedToken);
            setRefreshToken(storedRefreshToken);
            
            console.log("✅ Auth state restored from localStorage:", {
              userId: parsedUser._id,
              userRole: parsedUser.role,
              tokenValid: true
            });
            
            if (isTokenExpiringSoon(storedToken)) {
              console.log("⚠️ Token expiring soon, will refresh on next API call");
            }
          } else {
            console.log("❌ Stored token is expired, clearing auth state");
            clearStoredTokens();
            setUser(null);
            setToken(null);
            setRefreshToken(null);
          }
        } else {
          // Try sessionStorage as fallback
          console.log("🔍 Trying sessionStorage as fallback...");
          try {
            const sessionUser = sessionStorage.getItem(STORAGE_KEYS.USER);
            const sessionToken = sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
            const sessionRefreshToken = sessionStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
            
            if (sessionUser && sessionToken) {
              const parsedSessionUser = JSON.parse(sessionUser);
              
              if (!isTokenExpired(sessionToken)) {
                setUser(parsedSessionUser);
                setToken(sessionToken);
                setRefreshToken(sessionRefreshToken);
                
                // Restore to localStorage
                storeTokens(parsedSessionUser, sessionToken, sessionRefreshToken);
                
                console.log("✅ Auth state restored from sessionStorage and synced to localStorage");
              } else {
                console.log("❌ Session token is also expired");
                setUser(null);
                setToken(null);
                setRefreshToken(null);
              }
            } else {
              console.log("❌ No valid auth data found in any storage");
              setUser(null);
              setToken(null);
              setRefreshToken(null);
            }
          } catch (error) {
            console.log("❌ Error checking sessionStorage:", error);
            setUser(null);
            setToken(null);
            setRefreshToken(null);
          }
        }
      } catch (error) {
        console.error("❌ Error initializing auth:", error);
        clearStoredTokens();
        setUser(null);
        setToken(null);
        setRefreshToken(null);
      } finally {
        setIsLoading(false);
        console.log("🔄 Auth initialization complete");
      }
    };

    initializeAuth();
  }, []);

  // Token validation will be handled by the API interceptor when needed
  // No need to run validation on mount since the API interceptor handles it

  // Debug: Monitor token state changes and update global reference
  useEffect(() => {
    console.log("🔍 Token state changed:", { hasToken: !!token, tokenPreview: token ? token.substring(0, 20) + '...' : null });
    // Update global token reference for API interceptor
    window.authContextToken = token;
  }, [token]);

  // Debug: Monitor localStorage changes to detect when tokens are cleared
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'accessToken' || e.key === 'user' || e.key === 'refreshToken') {
        console.log("🔍 localStorage changed:", {
          key: e.key,
          oldValue: e.oldValue ? 'EXISTS' : 'MISSING',
          newValue: e.newValue ? 'EXISTS' : 'MISSING',
          timestamp: new Date().toISOString()
        });
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also monitor direct localStorage changes (same tab)
    const originalSetItem = localStorage.setItem;
    const originalRemoveItem = localStorage.removeItem;
    
    localStorage.setItem = function(key, value) {
      if (key === 'accessToken' || key === 'user' || key === 'refreshToken') {
        console.log("🔍 localStorage.setItem:", { key, value: value ? 'EXISTS' : 'MISSING' });
      }
      return originalSetItem.apply(this, arguments);
    };
    
    localStorage.removeItem = function(key) {
      if (key === 'accessToken' || key === 'user' || key === 'refreshToken') {
        console.log("🔍 localStorage.removeItem:", { key, timestamp: new Date().toISOString() });
      }
      return originalRemoveItem.apply(this, arguments);
    };

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      localStorage.setItem = originalSetItem;
      localStorage.removeItem = originalRemoveItem;
    };
  }, []);

  // Login function - updates both state and localStorage
  const login = (userData, jwtToken, refreshTokenValue = null) => {
    console.log("🔄 Login called:", {
      hasUser: !!userData,
      hasToken: !!jwtToken,
      hasRefreshToken: !!refreshTokenValue,
      userId: userData?._id,
      userRole: userData?.role
    });
    
    try {
      if (!userData || !jwtToken) {
        throw new Error("Invalid login data: missing user or token");
      }
      
      // Update state
      setUser(userData);
      setToken(jwtToken);
      setRefreshToken(refreshTokenValue);
      
      // Store in localStorage
      storeTokens(userData, jwtToken, refreshTokenValue);
      
      // Also store in sessionStorage as backup
      try {
        sessionStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
        sessionStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, jwtToken);
        if (refreshTokenValue) {
          sessionStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshTokenValue);
        }
      } catch (error) {
        console.error("❌ Error storing tokens in sessionStorage:", error);
      }
      
      console.log("✅ Login successful - state and localStorage updated");
      
    } catch (error) {
      console.error("❌ Login failed:", error);
      // Clear everything on error
      setUser(null);
      setToken(null);
      setRefreshToken(null);
      clearStoredTokens();
      throw error;
    }
  };

  // Expose login function globally for API interceptor
  window.authContextUpdate = login;
  
  // Also expose current token for API interceptor fallback
  window.authContextToken = token;

  // Logout function - clears both state and all storage
  const logout = () => {
    console.log("🚪 Logout called - clearing all auth data");
    
    // Clear state
    setUser(null);
    setToken(null);
    setRefreshToken(null);
    
    // Clear localStorage and sessionStorage
    clearStoredTokens();
    
    console.log("✅ Logout completed - state and all storage cleared");
  };

  // Expose logout function globally for API interceptor
  window.authLogout = logout;



  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        token, 
        refreshToken,
        isLoading,
        setUser, 
        setToken, 
        login, 
        logout 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};