import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';

export default function LoginScreen({onClose}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useContext(AuthContext); // get login function

  const validateEmail = (email) =>
    /^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email);

    const handleLogin = async () => {
      if (!email || !password) {
        setError('All fields are required.');
        return;
      }
    
      if (!validateEmail(email)) {
        setError('Email must be in format: example@gmail.com');
        return;
      }
    
      try {
        setError('');
        const response = await axios.post('http://localhost:4000/api/auth/login', {
          email,
          password
        });
    
        console.log("✅ Login response:", response.data);
    
        // Store refreshToken directly (since login function only handles accessToken)
        if (response.data.refreshToken) {
          localStorage.setItem('refreshToken', response.data.refreshToken);
        }
    
        // Update global auth state and store accessToken
        login(response.data.user, response.data.accessToken);
    
        // Verify tokens are stored
        console.log("🔍 Stored tokens:", {
          accessToken: !!localStorage.getItem('accessToken'),
          refreshToken: !!localStorage.getItem('refreshToken')
        });
    
        // Navigate based on role
        if (response.data.user.role === 'owner') navigate('/owner-welcome');
        else if (response.data.user.role === 'partner') navigate('/partner-welcome');
        else navigate('/');
        
        onClose();
    
      } catch (err) {
        console.error('Login error:', err.response?.data || err.message);
        setError(err.response?.data?.message || 'Login failed. Please try again.');
      }
    };

  const handleClose = () => {
    navigate('/');
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={handleClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto relative">
          <button
            onClick={onClose}
            className="text-2xl hover:opacity-70 absolute top-4 right-4 text-gray-600"
          >
            ✕
          </button>

          <div className="flex flex-col items-center justify-start px-6 py-8 w-full">
            <h1 className="text-2xl font-bold text-black text-center mb-6">Log In</h1>
            <h2 className="text-3xl font-bold text-green-800 text-center mb-8">Welcome back!</h2>

            <div className="w-full space-y-4 border border-gray-300 rounded-xl p-4 mb-4">
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border-b border-gray-200 pb-2 text-gray-700 h-12 text-lg focus:outline-none"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pb-1 text-gray-700 h-12 text-lg focus:outline-none"
              />
            </div>

            {error && (
              <div className="mb-4 text-red-500 text-sm flex items-center">
                <span className="mr-2">✗</span>
                <span>{error}</span>
              </div>
            )}

            <div className="w-full flex justify-center mb-6">
              <button
                onClick={() => navigate('/password-recovery')}
                className="text-sm text-green-700 hover:text-green-800 transition"
              >
                Forgot password? →
              </button>
            </div>

            <button
              onClick={handleLogin}
              className="bg-green-800 hover:bg-green-700 text-white text-lg font-semibold rounded-full py-3 px-8 w-full transition mb-6"
            >
              Log In
            </button>

            <p className="text-sm text-gray-600 text-center">
              No account?{' '}
              <button
                onClick={() => navigate('/signup')}
                className="text-green-700 underline hover:text-green-800"
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
