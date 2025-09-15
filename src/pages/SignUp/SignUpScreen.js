import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function SignUpScreen({onClose}) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const validateEmail = (email) => /^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email);
  const validatePassword = (password) =>
    /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password);

  const handleNext = async () => {
    if (!email || !password || !confirmPassword) {
      setError('All fields are required.');
      return;
    }
    if (!validateEmail(email)) {
      setError('Email must be in the format: example@gmail.com');
      return;
    }
    if (!validatePassword(password)) {
      setError(
        'Password must be at least 8 characters long and include letters and numbers.'
      );
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError('');
    try {
      const res = await axios.post('http://localhost:4000/api/auth/register-step1', {
        email,
        password,
      });

      console.log(res.data);

      // Save email & password locally for next step safely
      localStorage.setItem('signupEmail', email);
      localStorage.setItem('signupPassword', password);

      // Navigate to verification code step
      navigate('/signup-confirmation', { state: { email, password } });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  const handleClose = () => {
    navigate('/');
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={handleClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex flex-col items-center justify-start px-6 py-8">
            <div className="w-full mb-4 relative">
              <button
                onClick={onClose}
                className="text-2xl hover:opacity-70 absolute -top-2 -right-2 text-gray-600"
              >
                ✕
              </button>
              <h1 className="text-2xl font-bold text-black text-center">Sign up</h1>
            </div>

            <div className="h-1 w-full bg-green-800 relative mb-6">
              <div className="absolute top-0 left-0 h-1 bg-green-800" />
            </div>

            <h2 className="text-3xl font-bold text-green-800 text-center mb-8">Welcome</h2>

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
                className="w-full border-b border-gray-200 pb-2 text-gray-700 h-12 text-lg focus:outline-none"
              />
              <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pb-1 text-gray-700 h-12 text-lg focus:outline-none"
              />
            </div>

            {error && (
              <div className="mb-4 text-red-500 text-sm flex items-center">
                <span className="mr-2">✗</span>
                <span>{error}</span>
                {error.includes('already registered') && (
                  <button
                    onClick={() => navigate('/login')}
                    className="ml-2 text-green-700 underline hover:text-green-800"
                  >
                    Try logging in instead.
                  </button>
                )}
              </div>
            )}

            <button
              onClick={handleNext}
              className="bg-green-800 hover:bg-green-700 text-white text-lg font-semibold rounded-full py-3 px-8 w-full transition mb-6"
            >
              Continue
            </button>

            <p className="text-sm text-gray-600 text-center">
              Already have an account?{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-green-700 underline hover:text-green-800"
              >
                Log in here
              </button>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
