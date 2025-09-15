import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function PasswordRecoveryScreen() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSendEmail = async () => {
    if (!email) {
      setError('Email is required');
      setSuccess('');
      return;
    }

    try {
      const res = await axios.post('http://localhost:4000/api/auth/recover-password', { email });
      setSuccess(res.data.message);
      setError('');

      // Navigate to confirmation screen after sending email
      navigate('/password-recovery-confirmation', { state: { email } });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send recovery email');
      setSuccess('');
    }
  };

  const handleBackToLogin = () => navigate('/login');
  const handleClose = () => navigate('/');

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={handleClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex flex-col items-center px-6 py-8">
            <div className="w-full mb-4 relative">
              <button onClick={handleClose} className="text-2xl hover:opacity-70 absolute -top-2 -right-2 text-gray-600">✕</button>
              <h1 className="text-2xl font-bold text-black text-center">Password Recovery</h1>
            </div>

            <div className="h-1 w-full bg-gray-300 mb-6 relative">
              <div className="absolute top-0 left-0 h-1 w-2/3 bg-green-800" />
            </div>

            <h2 className="text-2xl font-semibold text-green-900 text-center mb-8">Reset your password</h2>

            <div className="w-full mb-6">
              <input
                type="email"
                placeholder="Enter your Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-4 border border-gray-300 rounded-lg text-gray-700 placeholder-gray-500 h-12 text-lg focus:outline-none focus:ring-2 focus:ring-green-600"
              />
            </div>

            {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}
            {success && <p className="text-green-600 mb-4 text-sm">{success}</p>}

            <button
              onClick={handleSendEmail}
              className="bg-green-800 hover:bg-green-700 text-white text-lg font-semibold rounded-full py-3 px-8 w-full transition mb-6"
            >
              Send Email
            </button>

            <p className="text-sm text-gray-600 text-center">
              Remembered your password?{' '}
              <button onClick={handleBackToLogin} className="text-green-700 underline hover:text-green-800">
                Log in here
              </button>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
