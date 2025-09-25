// Simplified and reliable token storage
class TokenStorage {
  constructor() {
    this.storageKeys = {
      user: 'atlasia_user',
      accessToken: 'atlasia_access_token',
      refreshToken: 'atlasia_refresh_token'
    };
  }

  // Store tokens in localStorage (primary) and sessionStorage (backup)
  setTokens(user, accessToken, refreshToken) {
    console.log('🔐 Storing tokens...');
    
    try {
      // Primary storage in localStorage
      localStorage.setItem(this.storageKeys.user, JSON.stringify(user));
      localStorage.setItem(this.storageKeys.accessToken, accessToken);
      if (refreshToken) {
        localStorage.setItem(this.storageKeys.refreshToken, refreshToken);
      }

      // Backup in sessionStorage
      sessionStorage.setItem(this.storageKeys.user, JSON.stringify(user));
      sessionStorage.setItem(this.storageKeys.accessToken, accessToken);
      if (refreshToken) {
        sessionStorage.setItem(this.storageKeys.refreshToken, refreshToken);
      }

      console.log('✅ Tokens stored successfully');
      return true;
    } catch (error) {
      console.error('❌ Error storing tokens:', error);
      return false;
    }
  }

  // Retrieve tokens from storage with fallback
  getTokens() {
    console.log('🔍 Retrieving tokens...');
    
    let user = null;
    let accessToken = null;
    let refreshToken = null;

    // Try localStorage first (primary storage)
    try {
      user = localStorage.getItem(this.storageKeys.user);
      accessToken = localStorage.getItem(this.storageKeys.accessToken);
      refreshToken = localStorage.getItem(this.storageKeys.refreshToken);
      
      if (user) user = JSON.parse(user);
      
      if (user && accessToken) {
        console.log('✅ Tokens found in localStorage');
        return { user, accessToken, refreshToken };
      }
    } catch (error) {
      console.log('⚠️ localStorage failed:', error);
    }

    // Try sessionStorage as fallback
    try {
      user = sessionStorage.getItem(this.storageKeys.user);
      accessToken = sessionStorage.getItem(this.storageKeys.accessToken);
      refreshToken = sessionStorage.getItem(this.storageKeys.refreshToken);
      
      if (user) user = JSON.parse(user);
      
      if (user && accessToken) {
        console.log('✅ Tokens found in sessionStorage, restoring to localStorage');
        // Restore to primary location
        this.setTokens(user, accessToken, refreshToken);
        return { user, accessToken, refreshToken };
      }
    } catch (error) {
      console.log('⚠️ sessionStorage failed:', error);
    }

    console.log('❌ No tokens found in storage');
    return { user: null, accessToken: null, refreshToken: null };
  }

  // Clear all tokens from storage
  clearTokens() {
    console.log('🧹 Clearing tokens...');
    
    try {
      // Clear localStorage
      localStorage.removeItem(this.storageKeys.user);
      localStorage.removeItem(this.storageKeys.accessToken);
      localStorage.removeItem(this.storageKeys.refreshToken);

      // Clear sessionStorage
      sessionStorage.removeItem(this.storageKeys.user);
      sessionStorage.removeItem(this.storageKeys.accessToken);
      sessionStorage.removeItem(this.storageKeys.refreshToken);

      console.log('✅ All tokens cleared');
    } catch (error) {
      console.error('❌ Error clearing tokens:', error);
    }
  }


  // Check if tokens exist in any location
  hasTokens() {
    const tokens = this.getTokens();
    return !!(tokens.user && tokens.accessToken);
  }

  // Get storage status for debugging
  getStorageStatus() {
    return {
      localStorage: {
        user: !!localStorage.getItem(this.storageKeys.user),
        accessToken: !!localStorage.getItem(this.storageKeys.accessToken),
        refreshToken: !!localStorage.getItem(this.storageKeys.refreshToken)
      },
      sessionStorage: {
        user: !!sessionStorage.getItem(this.storageKeys.user),
        accessToken: !!sessionStorage.getItem(this.storageKeys.accessToken),
        refreshToken: !!sessionStorage.getItem(this.storageKeys.refreshToken)
      }
    };
  }
}

// Create singleton instance
export const tokenStorage = new TokenStorage();
export default tokenStorage;
