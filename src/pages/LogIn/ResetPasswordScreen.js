import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import PasswordInput from "../../components/shared/PasswordInput";

export default function ResetPasswordScreen() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const validatePassword = (password) => {
    if (password.length < 6) {
      return "Password must be at least 6 characters long";
    }
    return null;
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      setMessage("Please fill in all fields");
      return;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setMessage(passwordError);
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }

    setIsLoading(true);
    setMessage("");
    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL}/api` : 'http://localhost:4000/api';
      const res = await axios.post(
        `${API_BASE_URL}/auth/reset-password/${token}`,
        { newPassword }
      );
      setMessage(res.data.message);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary-50">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md mx-4">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-secondary-900 mb-2">Reset Your Password</h2>
          <p className="text-secondary-600">Enter your new password below</p>
        </div>

        <div className="space-y-4">
          <div>
            <PasswordInput
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="px-4 py-3 border border-secondary-300 rounded-lg text-secondary-900 placeholder-secondary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={isLoading}
              showStrengthIndicator={true}
            />
            {newPassword && validatePassword(newPassword) && (
              <p className="text-error-500 text-sm mt-1">{validatePassword(newPassword)}</p>
            )}
          </div>

          <div>
            <PasswordInput
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="px-4 py-3 border border-secondary-300 rounded-lg text-secondary-900 placeholder-secondary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={isLoading}
            />
          </div>
        </div>

        <button
          onClick={handleResetPassword}
          disabled={isLoading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
          className={`w-full py-3 rounded-lg font-semibold text-lg transition-colors mt-6 ${
            isLoading || !newPassword || !confirmPassword || newPassword !== confirmPassword
              ? 'bg-secondary-300 text-secondary-500 cursor-not-allowed'
              : 'bg-primary-500 text-white hover:bg-primary-600 shadow-atlasia'
          }`}
        >
          {isLoading ? 'Resetting...' : 'Reset Password'}
        </button>

        {message && (
          <div className={`mt-4 p-3 rounded-lg text-center text-sm ${
            message.includes('successful') || message.includes('success')
              ? 'bg-success-50 text-success-700 border border-success-200'
              : 'bg-error-50 text-error-700 border border-error-200'
          }`}>
            {message}
          </div>
        )}

        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/login')}
            className="text-primary-600 hover:text-primary-700 text-sm underline transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}
