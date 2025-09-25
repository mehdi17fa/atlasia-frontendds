import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * Custom hook to access authentication state and methods
 * This hook provides a consistent interface for all components to access auth data
 * 
 * Returns:
 * - user: Current user object (null if not logged in)
 * - token: Current access token (null if not logged in)  
 * - refreshToken: Current refresh token (null if not available)
 * - isAuthenticated: Boolean indicating if user is logged in
 * - isLoading: Boolean indicating if auth is still initializing
 * - login: Function to log in a user
 * - logout: Function to log out a user
 * - updateUser: Function to update user data
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  const {
    user,
    token,
    refreshToken,
    isLoading,
    login,
    logout,
    setUser
  } = context;
  
  return {
    // Auth state
    user,
    token,
    refreshToken,
    isAuthenticated: !!user && !!token,
    isLoading,
    
    // Auth methods
    login,
    logout,
    updateUser: setUser,
    
    // Utility methods
    getUserId: () => user?._id || null,
    getToken: () => token,
    hasRole: (role) => user?.role === role,
    
    // Safe getters that wait for loading to complete
    getTokenSafe: () => {
      if (isLoading) return null;
      return token;
    },
    
    getUserSafe: () => {
      if (isLoading) return null;
      return user;
    }
  };
};
