import React, { useState, useEffect } from 'react'; 
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

export default function PasswordRecoveryConfirmation() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';

  const [cooldown, setCooldown] = useState(0);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleBackToLogin = () => navigate('/login');

  const handleSendAgain = async () => {
    if (cooldown > 0) return;

    try {
      const res = await axios.post('http://localhost:4000/api/auth/recover-password', { email });
      setSuccess(res.data.message);
      setError('');
      setCooldown(15); // 15s cooldown
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend email');
      setSuccess('');
    }
  };

  // Countdown effect
  useEffect(() => {
    if (cooldown === 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

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
              <div className="absolute top-0 left-0 h-1 w-full bg-green-800" />
            </div>

            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-3xl">📧</span>
              </div>
            </div>

            <p className="text-center text-gray-700 text-lg mb-4">
              An email has been sent to <strong>{email}</strong>. Please check your inbox.
            </p>

            {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}
            {success && <p className="text-green-600 mb-4 text-sm">{success}</p>}

            <div className="w-full space-y-4">
              <button
                onClick={handleBackToLogin}
                className="w-full bg-green-800 hover:bg-green-700 text-white py-3 rounded-full text-lg font-semibold transition"
              >
                Back to Log In
              </button>

              <button
                onClick={handleSendAgain}
                disabled={cooldown > 0}
                className={`w-full ${
                  cooldown > 0
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-300 hover:bg-gray-400 text-black'
                } py-3 rounded-full text-lg font-semibold transition`}
              >
                {cooldown > 0 ? `Send again in ${cooldown}s` : 'Send again'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
