import React, { useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { tokenStorage } from '../../utils/tokenStorage';
import PasswordInput from '../../components/shared/PasswordInput';

export default function LoginScreen({onClose, currentLocation}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useContext(AuthContext); // get login function

  const validateEmail = (email) =>
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);

    const handleLogin = async () => {
      if (!email || !password) {
        setError('All fields are required.');
        return;
      }
    
      if (!validateEmail(email)) {
        setError('Please enter a valid email address');
        return;
      }

    
      try {
        setError('');
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/login`, {
          email,
          password
        });
    
        console.log("✅ Login response:", response.data);

        // Check if login was successful
        if (!response.data.success) {
          throw new Error(response.data.message || 'Login failed');
        }

        // Debug: Check what we received from the server
        console.log("🔍 Login response data:", {
          hasUser: !!response.data.user,
          hasAccessToken: !!response.data.accessToken,
          hasRefreshToken: !!response.data.refreshToken,
          userData: response.data.user,
          tokenPreview: response.data.accessToken ? response.data.accessToken.substring(0, 20) + '...' : null
        });

        // Update global auth state and store both tokens
        console.log("🔄 Calling login function...");
        login(response.data.user, response.data.accessToken, response.data.refreshToken);
    
        // Verify tokens are stored immediately after login
        const storageStatus = tokenStorage.getStorageStatus();
        console.log("🔍 Stored tokens immediately after login:", storageStatus);
        
        // Additional verification after a short delay
        setTimeout(() => {
          const delayedStorageStatus = tokenStorage.getStorageStatus();
          console.log("🔍 Stored tokens after 500ms:", delayedStorageStatus);
        }, 500);
    
        // Navigate based on role and return URL
        const returnUrl = new URLSearchParams(window.location.search).get('returnUrl');
        const fromLocation = location.state?.from?.pathname;
        const currentPageLocation = currentLocation?.pathname;
        const targetUrl = returnUrl || fromLocation || currentPageLocation;
        
        console.log('🔍 Navigation debug:', {
          returnUrl,
          fromLocation,
          currentPageLocation,
          targetUrl,
          userRole: response.data.user.role
        });
        
        if (response.data.user.role === 'owner') {
          navigate(targetUrl || '/owner-welcome');
        } else if (response.data.user.role === 'partner') {
          navigate(targetUrl || '/partner-welcome');
        } else {
          // For tourists and other roles, go to target URL or home page
          navigate(targetUrl || '/');
        }
        
        // Only call onClose if it's a function
        if (typeof onClose === 'function') {
          try {
            onClose();
          } catch (closeError) {
            console.warn('onClose function error:', closeError);
          }
        }
    
      } catch (err) {
        console.error('Login error:', err.response?.data || err.message);
        const errorMessage = err.response?.data?.message || 'Login failed. Please try again.';
        setError(errorMessage);
      }
    };

  const handleClose = () => {
    navigate(-1);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={handleClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto relative">
          <button
            onClick={handleClose}
            className="text-2xl hover:opacity-70 absolute top-4 right-4 text-secondary-600 transition-opacity"
          >
            ✕
          </button>

          <div className="flex flex-col items-center justify-start px-6 py-8 w-full">
            <h1 className="text-2xl font-bold text-secondary-900 text-center mb-6">Log In</h1>
            <h2 className="text-3xl font-bold text-primary-700 text-center mb-8">Welcome back!</h2>

            <div className="w-full space-y-4 border border-secondary-200 rounded-xl p-4 mb-4 bg-secondary-50">
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border-b border-secondary-200 pb-2 text-secondary-900 h-12 text-lg focus:outline-none focus:border-primary-500 bg-transparent placeholder-secondary-500"
              />
              <PasswordInput
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pb-1 text-secondary-900 h-12 text-lg focus:outline-none bg-transparent placeholder-secondary-500"
              />
            </div>


            {error && (
              <div className="mb-4 bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg text-sm flex items-center">
                <span className="mr-2">✗</span>
                <span>{error}</span>
              </div>
            )}

            <div className="w-full flex justify-center mb-6">
              <button
                onClick={() => navigate('/password-recovery')}
                className="text-sm text-primary-600 hover:text-primary-700 transition-colors"
              >
                Forgot password? →
              </button>
            </div>

            <button
              onClick={handleLogin}
              className="bg-primary-500 hover:bg-primary-600 text-white text-lg font-semibold rounded-lg py-3 px-8 w-full transition-colors mb-6 shadow-atlasia"
            >
              Log In
            </button>

            <p className="text-sm text-secondary-600 text-center">
              No account?{' '}
              <button
                onClick={() => navigate('/signup')}
                className="text-primary-600 underline hover:text-primary-700 transition-colors"
              >
                Sign up here
              </button>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
