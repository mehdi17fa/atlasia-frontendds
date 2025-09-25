// Test function to debug token issues
export const testToken = (token) => {
  console.log("🧪 Testing token:", token ? token.substring(0, 20) + '...' : 'null');
  
  if (!token) {
    console.log("❌ No token provided");
    return;
  }
  
  try {
    const parts = token.split('.');
    console.log("🔍 Token parts:", parts.length);
    
    if (parts.length !== 3) {
      console.log("❌ Invalid JWT format");
      return;
    }
    
    const header = JSON.parse(atob(parts[0]));
    const payload = JSON.parse(atob(parts[1]));
    
    console.log("🔍 Token header:", header);
    console.log("🔍 Token payload:", payload);
    
    if (payload.exp) {
      const currentTime = Math.floor(Date.now() / 1000);
      const expiryTime = payload.exp;
      const timeUntilExpiry = expiryTime - currentTime;
      
      console.log("🔍 Token expiration:", {
        currentTime,
        expiryTime,
        timeUntilExpiry,
        isExpired: timeUntilExpiry < 0,
        expiresIn: timeUntilExpiry > 0 ? `${Math.floor(timeUntilExpiry / 60)} minutes` : 'expired'
      });
    } else {
      console.log("❌ No expiration time in token");
    }
    
  } catch (error) {
    console.error("❌ Error parsing token:", error);
  }
};

// Test localStorage tokens
export const testLocalStorageTokens = () => {
  console.log("🧪 Testing localStorage tokens...");
  
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  const user = localStorage.getItem('user');
  
  console.log("🔍 LocalStorage contents:", {
    hasAccessToken: !!accessToken,
    hasRefreshToken: !!refreshToken,
    hasUser: !!user
  });
  
  if (accessToken) {
    testToken(accessToken);
  }
  
  if (refreshToken) {
    console.log("🔍 Refresh token:", refreshToken.substring(0, 20) + '...');
  }
  
  if (user) {
    try {
      const userData = JSON.parse(user);
      console.log("🔍 User data:", userData);
    } catch (error) {
      console.error("❌ Error parsing user data:", error);
    }
  }
};
