import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { testLocalStorageTokens } from '../utils/testToken';
import { tokenStorage } from '../utils/tokenStorage';

const AuthDebug = () => {
  const { user, token } = useContext(AuthContext);
  const [localStorageData, setLocalStorageData] = useState({});

  useEffect(() => {
    const updateStorageData = () => {
      const storageStatus = tokenStorage.getStorageStatus();
      setLocalStorageData({
        localStorage: storageStatus.localStorage,
        localStorageBackup: storageStatus.localStorageBackup,
        sessionStorage: storageStatus.sessionStorage,
        cookies: storageStatus.cookies
      });
    };

    updateStorageData();
    
    // Update every second to see changes
    const interval = setInterval(updateStorageData, 1000);
    
    return () => clearInterval(interval);
  }, []);

  if (process.env.NODE_ENV !== 'development') {
    return null; // Only show in development
  }

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px',
      maxHeight: '400px',
      overflow: 'auto'
    }}>
      <h4 style={{ margin: '0 0 10px 0', color: '#4CAF50' }}>🔍 Auth Debug</h4>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Context State:</strong>
        <div>User: {user ? '✅' : '❌'}</div>
        <div>Token: {token ? '✅' : '❌'}</div>
        {user && <div>User ID: {user._id || user.id}</div>}
        {user && <div>User Email: {user.email}</div>}
        {user && <div>User Role: {user.role}</div>}
      </div>

      <div style={{ marginBottom: '10px' }}>
        <strong>Enhanced Storage:</strong>
        <div><strong>localStorage:</strong></div>
        <div style={{ marginLeft: '10px' }}>
          user: {localStorageData.localStorage?.user ? '✅' : '❌'}
          accessToken: {localStorageData.localStorage?.accessToken ? '✅' : '❌'}
          refreshToken: {localStorageData.localStorage?.refreshToken ? '✅' : '❌'}
        </div>
        <div><strong>localStorage Backup:</strong></div>
        <div style={{ marginLeft: '10px' }}>
          user: {localStorageData.localStorageBackup?.user ? '✅' : '❌'}
          accessToken: {localStorageData.localStorageBackup?.accessToken ? '✅' : '❌'}
          refreshToken: {localStorageData.localStorageBackup?.refreshToken ? '✅' : '❌'}
        </div>
        <div><strong>sessionStorage:</strong></div>
        <div style={{ marginLeft: '10px' }}>
          user: {localStorageData.sessionStorage?.user ? '✅' : '❌'}
          accessToken: {localStorageData.sessionStorage?.accessToken ? '✅' : '❌'}
          refreshToken: {localStorageData.sessionStorage?.refreshToken ? '✅' : '❌'}
        </div>
        <div><strong>cookies:</strong></div>
        <div style={{ marginLeft: '10px' }}>
          user: {localStorageData.cookies?.user ? '✅' : '❌'}
          accessToken: {localStorageData.cookies?.accessToken ? '✅' : '❌'}
          refreshToken: {localStorageData.cookies?.refreshToken ? '✅' : '❌'}
        </div>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <strong>Token Preview:</strong>
        {localStorageData.accessToken && (
          <div style={{ wordBreak: 'break-all' }}>
            {localStorageData.accessToken.substring(0, 30)}...
          </div>
        )}
      </div>

      <div>
        <strong>Actions:</strong>
        <button 
          onClick={() => {
            console.log('Current localStorage:', localStorageData);
            console.log('Current context:', { user, token });
            testLocalStorageTokens();
          }}
          style={{ 
            background: '#2196F3', 
            color: 'white', 
            border: 'none', 
            padding: '5px', 
            borderRadius: '3px',
            cursor: 'pointer',
            marginRight: '5px'
          }}
        >
          Test Tokens
        </button>
        <button 
          onClick={() => {
            localStorage.clear();
            window.location.reload();
          }}
          style={{ 
            background: '#f44336', 
            color: 'white', 
            border: 'none', 
            padding: '5px', 
            borderRadius: '3px',
            cursor: 'pointer',
            marginRight: '5px'
          }}
        >
          Clear & Reload
        </button>
        <button 
          onClick={() => {
            window.location.reload();
          }}
          style={{ 
            background: '#FF9800', 
            color: 'white', 
            border: 'none', 
            padding: '5px', 
            borderRadius: '3px',
            cursor: 'pointer',
            marginRight: '5px'
          }}
        >
          Refresh Page
        </button>
        <button 
          onClick={() => {
            // Simulate a login for testing
            const testUser = { _id: 'test123', email: 'test@example.com', role: 'partner' };
            const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiJ0ZXN0MTIzIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwicm9sZSI6InBhcnRuZXIiLCJpYXQiOjE2MzQ1Njc4OTksImV4cCI6MTYzNTE3MjY5OX0.test';
            const testRefreshToken = 'refresh_test_token';
            
            console.log('🧪 Simulating login...');
            if (window.authContextUpdate) {
              window.authContextUpdate(testUser, testToken, testRefreshToken);
            } else {
              console.log('❌ authContextUpdate not available');
            }
          }}
          style={{ 
            background: '#9C27B0', 
            color: 'white', 
            border: 'none', 
            padding: '5px', 
            borderRadius: '3px',
            cursor: 'pointer',
            marginRight: '5px'
          }}
        >
          Test Login
        </button>
        <button 
          onClick={() => {
            console.log('🔍 Current authentication status:');
            console.log('Context:', { user: !!user, token: !!token });
            console.log('LocalStorage:', {
              user: localStorage.getItem('user') ? 'EXISTS' : 'MISSING',
              accessToken: localStorage.getItem('accessToken') ? 'EXISTS' : 'MISSING',
              refreshToken: localStorage.getItem('refreshToken') ? 'EXISTS' : 'MISSING'
            });
            console.log('Auth functions available:', {
              authContextUpdate: !!window.authContextUpdate,
              authLogout: !!window.authLogout
            });
          }}
          style={{ 
            background: '#607D8B', 
            color: 'white', 
            border: 'none', 
            padding: '5px', 
            borderRadius: '3px',
            cursor: 'pointer',
            marginRight: '5px'
          }}
        >
          Check Status
        </button>
        <button 
          onClick={() => {
            // Test if we can manually store tokens using enhanced storage
            console.log('🧪 Testing enhanced token storage...');
            const testUser = { _id: 'enhanced123', email: 'enhanced@test.com', role: 'partner' };
            const testToken = 'enhanced_test_token_123';
            const testRefreshToken = 'enhanced_refresh_token_123';
            
            const success = tokenStorage.setTokens(testUser, testToken, testRefreshToken);
            
            if (success) {
              console.log('✅ Enhanced tokens stored in all locations');
              const storageStatus = tokenStorage.getStorageStatus();
              console.log('🔍 Storage status:', storageStatus);
            } else {
              console.log('❌ Failed to store enhanced tokens');
            }
          }}
          style={{ 
            background: '#795548', 
            color: 'white', 
            border: 'none', 
            padding: '5px', 
            borderRadius: '3px',
            cursor: 'pointer',
            marginRight: '5px'
          }}
        >
          Enhanced Store
        </button>
      </div>
    </div>
  );
};

export default AuthDebug;
