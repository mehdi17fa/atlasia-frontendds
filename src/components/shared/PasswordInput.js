import React, { useState } from 'react';

const PasswordInput = ({ 
  value, 
  onChange, 
  placeholder, 
  className = "", 
  disabled = false,
  showStrengthIndicator = false 
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, text: '', color: '' };
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;

    const strengthLevels = [
      { strength: 0, text: 'Very Weak', color: 'bg-error-500' },
      { strength: 1, text: 'Weak', color: 'bg-error-400' },
      { strength: 2, text: 'Fair', color: 'bg-warning-400' },
      { strength: 3, text: 'Good', color: 'bg-warning-500' },
      { strength: 4, text: 'Strong', color: 'bg-success-400' },
      { strength: 5, text: 'Very Strong', color: 'bg-success-500' }
    ];

    return strengthLevels[Math.min(strength, 5)];
  };

  const passwordStrength = getPasswordStrength(value);

  return (
    <div className="relative">
      <input
        type={showPassword ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full pr-12 ${className}`}
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        disabled={disabled}
        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary-500 hover:text-secondary-700 focus:outline-none disabled:opacity-50 transition-colors"
        tabIndex={-1}
      >
        {showPassword ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        )}
      </button>
      
      {showStrengthIndicator && value && (
        <div className="mt-2">
          <div className="flex items-center space-x-2">
            <div className="flex-1 bg-secondary-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
              />
            </div>
            <span className="text-xs text-secondary-600 min-w-0">
              {passwordStrength.text}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PasswordInput;
