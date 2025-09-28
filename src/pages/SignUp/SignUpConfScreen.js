import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';

export default function SignupScreenConf() {
  const navigate = useNavigate();
  const location = useLocation();
  useContext(AuthContext);
  const email = location.state?.email || localStorage.getItem('signupEmail') || '';
  
  // Debug logging for email retrieval
  console.log('Email sources:', {
    locationState: location.state?.email,
    localStorage: localStorage.getItem('signupEmail'),
    finalEmail: email
  });

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

  const verifyCode = async (codeString) => {
    try {
      // Debug logging
      console.log('Verification attempt:', { email, code: codeString, allDigits: code });

      if (!email) {
        alert('Email not found. Please try signing up again.');
        return;
      }

      if (!/^\d{6}$/.test(codeString)) {
        alert('Please enter all 6 digits.');
        return;
      }

      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/verify`, {
        email,
        code: codeString,
      });

      console.log("✅ Verification successful:", {
        message: response.data.message,
        user: response.data.user
      });

      navigate('/identification', { state: { email } });
    } catch (err) {
      console.error('Verification error:', err.response?.data || err.message);
      alert(err.response?.data?.message || 'Verification failed');
      setError(true);
    }
  };

  const handleVerify = async () => {
    await verifyCode(code.join(''));
  };

  const handleSendAgain = async () => {
    setTimer(15);
    setIsTimerActive(true);
    setError(false);
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/resend-verification`, { email });
      alert('Verification code resent! Check your email.');
    } catch (err) {
      console.error('Resend code error:', err.response?.data || err.message);
      alert('Failed to resend code.');
    }
  };

  const handleChange = (text, index) => {
    const updated = [...code];
    
    // Check if the pasted text is 6 digits (full code)
    if (text.length === 6 && /^\d{6}$/.test(text)) {
      // Split the pasted code into individual digits
      const digits = text.split('');
      setCode(digits);
      // Auto-verify immediately with pasted code
      verifyCode(text);
      return;
    }
    
    // Handle single character input
    updated[index] = text.slice(-1);
    setCode(updated);
    
    // Check if all digits are filled and this is the last input
    if (text && index === 5) {
      const allFilled = updated.every(digit => digit !== '');
      if (allFilled) {
        // Auto-verify immediately with the freshly composed code
        verifyCode(updated.join(''));
        return;
      }
    }
    
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

  const handlePaste = (e, index) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    
    // Check if pasted text is 6 digits
    if (pastedText.length === 6 && /^\d{6}$/.test(pastedText)) {
      const digits = pastedText.split('');
      setCode(digits);
      // Auto-verify immediately with pasted text
      verifyCode(pastedText);
    } else {
      // Handle partial paste or invalid content
      const cleanText = pastedText.replace(/\D/g, ''); // Remove non-digits
      if (cleanText.length > 0) {
        const updated = [...code];
        const startIndex = index;
        for (let i = 0; i < cleanText.length && startIndex + i < 6; i++) {
          updated[startIndex + i] = cleanText[i];
        }
        setCode(updated);
        
        // Check if all digits are filled after partial paste
        const allFilled = updated.every(digit => digit !== '');
        if (allFilled) {
          // Auto-verify immediately when all digits are filled
          verifyCode(updated.join(''));
          return;
        }
        
        // Focus on the next empty input or the last filled input
        const nextEmptyIndex = updated.findIndex((digit, idx) => idx > startIndex && digit === '');
        const targetIndex = nextEmptyIndex !== -1 ? nextEmptyIndex : Math.min(startIndex + cleanText.length - 1, 5);
        const targetInput = document.getElementById(`code-input-${targetIndex}`);
        if (targetInput) targetInput.focus();
      }
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

            <div className="flex justify-between items-center px-4 mb-6">
              {code.map((digit, index) => (
                <input
                  key={index}
                  id={`code-input-${index}`}
                  value={digit}
                  onChange={(e) => handleChange(e.target.value, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onPaste={(e) => handlePaste(e, index)}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  className="w-12 h-12 border-2 border-green-800 rounded text-center text-lg text-black focus:outline-none focus:border-green-600 transition-colors mx-1"
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
