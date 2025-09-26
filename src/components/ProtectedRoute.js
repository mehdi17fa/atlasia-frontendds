import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

/**
 * ProtectedRoute component that handles authentication-based routing
 * Redirects unauthenticated users to login page
 * Redirects authenticated users away from auth pages
 */
const ProtectedRoute = ({ children, requireAuth = true, allowedRoles = null }) => {
  const { user, isLoading } = useContext(AuthContext);
  const location = useLocation();
  

  // Show loading while auth state is being determined
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If route requires authentication
  if (requireAuth) {
    if (!user) {
      // Redirect to login with return URL
      return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check role-based access if specified
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      // Redirect to appropriate dashboard based on user role
      if (user.role === 'owner') {
        return <Navigate to="/owner-welcome" replace />;
      } else if (user.role === 'partner') {
        return <Navigate to="/partner-welcome" replace />;
      } else {
        // For tourists and other roles, redirect to profile instead of homepage
        return <Navigate to="/profile" replace />;
      }
    }

    return children;
  }

  // If route should be accessible only when NOT authenticated (like login/signup)
  if (requireAuth === false && user) {
    // Redirect authenticated users to their appropriate dashboard
    if (user.role === 'owner') {
      return <Navigate to="/owner-welcome" replace />;
    } else if (user.role === 'partner') {
      return <Navigate to="/partner-welcome" replace />;
    } else {
      // For tourists and other roles, redirect to profile instead of homepage
      return <Navigate to="/profile" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
