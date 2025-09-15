import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

export default function SignupScreenConf() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || localStorage.getItem('signupEmail') || '';

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);

  useEffect(() => {
    let interval = null;
    if (isTimerActive && timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    } else if (timer === 0 && isTimerActive) {
      setIsTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timer]);

  const handleVerify = async () => {
    try {
      const response = await axios.post('http://localhost:4000/api/auth/verify', {
        email,
        code: code.join(''),
      });

      localStorage.setItem("token", response.data.accessToken);

      
      navigate('/identification', { state: { email } });
    } catch (err) {
      console.error('Verification error:', err.response?.data || err.message);
      alert(err.response?.data?.message || 'Verification failed');
      setError(true);
    }
  };

  const handleSendAgain = async () => {
    setTimer(15);
    setIsTimerActive(true);
    setError(false);
    try {
      await axios.post('http://localhost:4000/api/auth/resend-verification', { email });
      alert('Verification code resent! Check your email.');
    } catch (err) {
      console.error('Resend code error:', err.response?.data || err.message);
      alert('Failed to resend code.');
    }
  };

  const handleChange = (text, index) => {
    const updated = [...code];
    updated[index] = text.slice(-1);
    setCode(updated);
    if (text && index < 5) {
      const nextInput = document.getElementById(`code-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-input-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleClose = () => navigate(-1);

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={handleClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex flex-col items-center justify-start px-6 py-8">
            <div className="w-full mb-4 relative">
              <button
                onClick={handleClose}
                className="text-2xl hover:opacity-70 absolute -top-2 -right-2 text-gray-600"
              >
                ✕
              </button>
              <h1 className="text-2xl font-bold text-black text-center">Sign up</h1>
            </div>

            <div className="h-1 w-full bg-gray-300 relative mb-6">
              <div className="absolute top-0 left-0 h-1 w-2/3 bg-green-800" />
            </div>

            <h2 className="text-center text-2xl font-bold text-green-800 mb-2">
              Enter the 6 digits
            </h2>
            <p className="text-center text-sm text-gray-700 mb-6">
              A code was sent to your email address. Please enter it below to verify your account.
            </p>

            <div className="flex justify-center gap-3 mb-6">
              {code.map((digit, index) => (
                <input
                  key={index}
                  id={`code-input-${index}`}
                  value={digit}
                  onChange={(e) => handleChange(e.target.value, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  className="w-12 h-12 border-2 border-green-800 rounded text-center text-lg text-black focus:outline-none focus:border-green-600 transition-colors"
                />
              ))}
            </div>

            {isTimerActive && (
              <p className="text-center text-blue-600 text-sm mb-2">
                You can request a new code in {timer} seconds
              </p>
            )}

            {error && (
              <div className="mb-4 text-red-500 text-sm flex items-center">
                <span className="mr-2">✗</span>
                <span>Incorrect code. Please try again.</span>
              </div>
            )}

            <button
              onClick={handleVerify}
              className="bg-green-800 hover:bg-green-700 text-white text-lg font-semibold rounded-full py-3 px-8 w-full transition mb-4"
            >
              Verify
            </button>

            <button
              onClick={handleSendAgain}
              disabled={isTimerActive}
              className={`w-full py-3 px-8 rounded-full text-lg font-semibold transition ${
                isTimerActive
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-400 hover:bg-gray-500 text-white'
              }`}
            >
              {isTimerActive ? `Send again (${timer}s)` : 'Send again'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
