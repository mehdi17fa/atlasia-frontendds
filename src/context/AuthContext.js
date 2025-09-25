import React, { createContext, useState, useEffect } from 'react';
import { isTokenExpired, isTokenExpiringSoon } from '../utils/tokenUtils';
import { tokenStorage } from '../utils/tokenStorage';

export const AuthContext = createContext();


export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);


  // Initialize auth state from tokenStorage on app startup
  useEffect(() => {
    const initializeAuth = async () => {
      console.log("🔄 Initializing auth from tokenStorage...");
      setIsLoading(true);
      
      try {
        const { user: storedUser, accessToken: storedToken, refreshToken: storedRefreshToken } = tokenStorage.getTokens();
        
        console.log("🔍 Found in tokenStorage:", {
          hasUser: !!storedUser,
          hasToken: !!storedToken,
          hasRefreshToken: !!storedRefreshToken,
          tokenPreview: storedToken ? storedToken.substring(0, 20) + '...' : null
        });
        
        if (storedUser && storedToken) {
          // Validate token before restoring
          if (!isTokenExpired(storedToken)) {
            setUser(storedUser);
            setToken(storedToken);
            setRefreshToken(storedRefreshToken);
            
            console.log("✅ Auth state restored from tokenStorage:", {
              userId: storedUser._id,
              userRole: storedUser.role,
              tokenValid: true
            });
            
            if (isTokenExpiringSoon(storedToken)) {
              console.log("⚠️ Token expiring soon, will refresh on next API call");
            }
          } else {
            console.log("❌ Stored token is expired, clearing auth state");
            tokenStorage.clearTokens();
            setUser(null);
            setToken(null);
            setRefreshToken(null);
          }
        } else {
          console.log("❌ No valid auth data in tokenStorage");
          setUser(null);
          setToken(null);
          setRefreshToken(null);
        }
      } catch (error) {
        console.error("❌ Error initializing auth:", error);
        tokenStorage.clearTokens();
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

  // Debug: Monitor token state changes
  useEffect(() => {
    console.log("🔍 Token state changed:", { hasToken: !!token, tokenPreview: token ? token.substring(0, 20) + '...' : null });
  }, [token]);


  // Login function - updates both state and tokenStorage
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
      
      // Store in tokenStorage
      tokenStorage.setTokens(userData, jwtToken, refreshTokenValue);
      
      console.log("✅ Login successful - state and tokenStorage updated");
      
    } catch (error) {
      console.error("❌ Login failed:", error);
      // Clear everything on error
      setUser(null);
      setToken(null);
      setRefreshToken(null);
      tokenStorage.clearTokens();
      throw error;
    }
  };

  // Expose login function globally for API interceptor
  window.authContextUpdate = login;

  // Logout function - clears both state and tokenStorage
  const logout = () => {
    console.log("🚪 Logout called - clearing all auth data");
    
    // Clear state
    setUser(null);
    setToken(null);
    setRefreshToken(null);
    
    // Clear tokenStorage
    tokenStorage.clearTokens();
    
    console.log("✅ Logout completed - state and tokenStorage cleared");
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