import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  // Load from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('accessToken'); // ✅ Changed to accessToken
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error("Failed to parse stored user:", err);
        localStorage.removeItem('user');
        setUser(null);
      }
    }
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  // Login function
  const login = (userData, jwtToken) => {
    console.log("🔄 AuthContext login called with:", { userData, token: jwtToken ? "EXISTS" : "MISSING" });
    
    setUser(userData);
    setToken(jwtToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('accessToken', jwtToken); // ✅ Changed to accessToken
    
    // Also store refreshToken if it exists in the response
    // You might need to pass refreshToken as a third parameter
    
    console.log("✅ Tokens stored in localStorage");
  };

  const logout = () => {
    console.log("🔄 AuthContext logout called");
    
    // Clear state immediately
    setUser(null);
    setToken(null);
    
    // Clear all localStorage items
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    
    // Clear any other potential auth-related items
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
    
    console.log("✅ User logged out, state cleared");
  };

  return (
    <AuthContext.Provider value={{ user, token, setUser, setToken, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};