import { isTokenExpired } from './tokenUtils';
import { tokenStorage } from './tokenStorage';

/**
 * Enhanced token retrieval with automatic refresh
 * This function prioritizes the token from AuthContext and provides fallbacks
 * @param {object} authContext - The AuthContext object {user, token, login}
 * @returns {string|null} - Valid token or null
 */
export const getValidToken = (authContext) => {
  const { user, token } = authContext || {};
  
  // Priority order for token sources
  const tokenSources = [
    token, // Current token from AuthContext (most reliable)
    localStorage.getItem("atlasia_access_token"), // New storage key
    localStorage.getItem("accessToken"), // Old storage key (backward compatibility)
    user?.accessToken, // Token from user object
    user?.token // Alternative token from user object
  ];
  
  // Find the first valid token
  for (const candidateToken of tokenSources) {
    if (candidateToken && !isTokenExpired(candidateToken)) {
      console.log("🔑 Using valid token from source");
      return candidateToken;
    }
  }
  
  console.log("❌ No valid token found in any source");
  return null;
};

/**
 * Enhanced token check with detailed logging
 * @param {object} authContext - The AuthContext object
 * @returns {object} - {token, isValid, source}
 */
export const checkTokenStatus = (authContext) => {
  const { user, token } = authContext || {};
  
  const status = {
    authContextToken: {
      exists: !!token,
      valid: token ? !isTokenExpired(token) : false,
      preview: token ? token.substring(0, 20) + '...' : null
    },
    localStorage: {
      atlasia_access_token: !!localStorage.getItem("atlasia_access_token"),
      accessToken: !!localStorage.getItem("accessToken")
    },
    userObject: {
      accessToken: !!user?.accessToken,
      token: !!user?.token
    }
  };
  
  console.log("🔍 Token status check:", status);
  
  const validToken = getValidToken(authContext);
  
  return {
    token: validToken,
    isValid: !!validToken,
    status
  };
};
