import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import PasswordInput from '../../components/shared/PasswordInput';

export default function SignUpScreen({onClose}) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const validateEmail = (email) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
  const validatePassword = (password) =>
    /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password);


  const handleNext = async () => {
    if (!email || !password || !confirmPassword) {
      setError('All fields are required.');
      return;
    }
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
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
        password
      });

      console.log(res.data);

      // Save email & password locally for next step safely
      localStorage.setItem('signupEmail', email);
      localStorage.setItem('signupPassword', password);

      // Navigate to verification code step
      navigate('/signup-confirmation', { state: { email, password } });
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Registration failed';
      setError(errorMessage);
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
                className="text-2xl hover:opacity-70 absolute -top-2 -right-2 text-secondary-600 transition-opacity"
              >
                ✕
              </button>
              <h1 className="text-2xl font-bold text-secondary-900 text-center">Sign up</h1>
            </div>

            <div className="h-1 w-full bg-primary-500 relative mb-6">
              <div className="absolute top-0 left-0 h-1 bg-primary-500" />
            </div>

            <h2 className="text-3xl font-bold text-primary-700 text-center mb-8">Welcome</h2>

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
                className="border-b border-secondary-200 pb-2 text-secondary-900 h-12 text-lg focus:outline-none bg-transparent placeholder-secondary-500"
                showStrengthIndicator={true}
              />
              <PasswordInput
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pb-1 text-secondary-900 h-12 text-lg focus:outline-none bg-transparent placeholder-secondary-500"
              />
            </div>


            {error && (
              <div className="mb-4 bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg text-sm flex items-center">
                <span className="mr-2">✗</span>
                <span>{error}</span>
                {error.includes('already registered') && (
                  <button
                    onClick={() => navigate('/login')}
                    className="ml-2 text-primary-600 underline hover:text-primary-700 transition-colors"
                  >
                    Try logging in instead.
                  </button>
                )}
              </div>
            )}

            <button
              onClick={handleNext}
              className="bg-primary-500 hover:bg-primary-600 text-white text-lg font-semibold rounded-lg py-3 px-8 w-full transition-colors mb-6 shadow-atlasia"
            >
              Continue
            </button>

            <p className="text-sm text-secondary-600 text-center">
              Already have an account?{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-primary-600 underline hover:text-primary-700 transition-colors"
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
