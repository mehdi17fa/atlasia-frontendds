// Utility functions for token management

/**
 * Decode JWT token without verification (for client-side expiration check)
 * @param {string} token - JWT token
 * @returns {object|null} - Decoded token payload or null if invalid
 */
export const decodeJWT = (token) => {
  try {
    if (!token) return null;
    
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = parts[1];
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

/**
 * Check if a JWT token is expired
 * @param {string} token - JWT token
 * @returns {boolean} - True if token is expired or invalid
 */
export const isTokenExpired = (token) => {
  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) {
    console.log("🔍 Token validation: Invalid token or no expiration", { hasDecoded: !!decoded, hasExp: !!decoded?.exp });
    return true;
  }
  
  const currentTime = Math.floor(Date.now() / 1000);
  const isExpired = decoded.exp < currentTime;
  
  console.log("🔍 Token expiration check:", {
    currentTime,
    tokenExp: decoded.exp,
    isExpired,
    timeUntilExpiry: decoded.exp - currentTime
  });
  
  return isExpired;
};

/**
 * Check if a JWT token will expire soon (within 5 minutes)
 * @param {string} token - JWT token
 * @returns {boolean} - True if token will expire soon
 */
export const isTokenExpiringSoon = (token) => {
  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) return true;
  
  const currentTime = Math.floor(Date.now() / 1000);
  const fiveMinutes = 5 * 60; // 5 minutes in seconds
  return decoded.exp < (currentTime + fiveMinutes);
};

/**
 * Get time until token expires in seconds
 * @param {string} token - JWT token
 * @returns {number} - Seconds until expiration, or 0 if expired/invalid
 */
export const getTokenTimeUntilExpiry = (token) => {
  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) return 0;
  
  const currentTime = Math.floor(Date.now() / 1000);
  return Math.max(0, decoded.exp - currentTime);
};
