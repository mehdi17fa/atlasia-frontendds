import React, { useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import PasswordInput from '../../components/shared/PasswordInput';
import { AuthContext } from '../../context/AuthContext';
import { tokenStorage } from '../../utils/tokenStorage';
import DefaultAvatar from '../assets/default-pp.png';

export default function SignUpWizard() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const [step, setStep] = useState(0);

  // Step 1: Credentials
  const [email, setEmail] = useState(localStorage.getItem('signupEmail') || '');
  const [password, setPassword] = useState(localStorage.getItem('signupPassword') || '');
  const [confirmPassword, setConfirmPassword] = useState(localStorage.getItem('signupPassword') || '');
  const [error, setError] = useState('');

  // Step 2: Verification
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const codeInputsRef = useRef([]);

  // Step 3: Role selection
  const [profileType, setProfileType] = useState(localStorage.getItem('profileType') || '');

  // Step 4: Profile details
  const [profileImage, setProfileImage] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedCountry, setSelectedCountry] = useState({ code: '+212', flag: '🇲🇦', name: 'Morocco', nationalLength: 9 });
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [gender, setGender] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    // If email exists and user navigates back to /signup, derive a sensible step
    if (email && password && step === 0) {
      // Do not auto-advance; keep explicit progression to avoid confusion
    }
  }, [email, password, step]);

  const validateEmail = (candidate) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(candidate);
  const validatePassword = (candidate) => /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(candidate);

  const getNationalLength = (country) => {
    if (!country) return 10;
    return country.nationalLength ?? 10;
  };

  const handleSignupStep = async () => {
    if (!email || !password || !confirmPassword) {
      setError('All fields are required.');
      return;
    }
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    if (!validatePassword(password)) {
      setError('Password must be at least 8 characters long and include letters and numbers.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError('');
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/register-step1`, { email, password });
      localStorage.setItem('signupEmail', email);
      localStorage.setItem('signupPassword', password);
      setStep(1);
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed';
      setError(message);
    }
  };

  const handleVerificationChange = (value, index) => {
    const sanitized = value.replace(/\D/g, '').slice(-1);
    const next = [...code];
    next[index] = sanitized;
    setCode(next);
    if (sanitized && index < 5) {
      codeInputsRef.current[index + 1]?.focus();
    }
  };

  const handleVerifyStep = async () => {
    const joined = code.join('');
    if (!email) {
      setError('Email not found. Please restart signup.');
      return;
    }
    if (joined.length !== 6) {
      setError('Please enter all 6 digits.');
      return;
    }
    setError('');
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/verify`, { email, code: joined });
      setStep(2);
    } catch (err) {
      const message = err.response?.data?.message || 'Verification failed';
      setError(message);
    }
  };

  const handleSelectRole = async (type) => {
    try {
      const normalized = String(type).toLowerCase();
      await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/set-role`, { email, role: normalized });
      localStorage.setItem('profileType', normalized);
      setProfileType(normalized);
      setStep(3);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to save role. Please try again.';
      setError(message);
    }
  };

  const isProfileFormValid = fullName.trim() !== '' && phoneNumber.length === getNationalLength(selectedCountry) && Boolean(gender);

  const handleFinishProfile = async () => {
    if (!isProfileFormValid) return;
    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('fullName', fullName);
      formData.append('phoneNumber', selectedCountry.code + phoneNumber);
      formData.append('country', selectedCountry.name);
      formData.append('gender', gender);
      formData.append('profileType', profileType);
      if (profileImage) formData.append('profilePic', profileImage);

      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/complete-profile`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      login(response.data.user, response.data.accessToken, response.data.refreshToken);
      tokenStorage.setTokens(response.data.user, response.data.accessToken, response.data.refreshToken);

      if (profileType === 'owner') navigate('/owner-welcome', { replace: true });
      else if (profileType === 'partner') navigate('/partner-welcome', { replace: true });
      else navigate('/', { replace: true });
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to complete profile. Please try again.';
      setError(message);
    }
  };

  const countries = [
    { code: '+1', flag: '🇺🇸', name: 'United States', nationalLength: 10 },
    { code: '+44', flag: '🇬🇧', name: 'United Kingdom', nationalLength: 10 },
    { code: '+33', flag: '🇫🇷', name: 'France', nationalLength: 9 },
    { code: '+212', flag: '🇲🇦', name: 'Morocco', nationalLength: 9 },
    { code: '+213', flag: '🇩🇿', name: 'Algeria', nationalLength: 9 },
    { code: '+216', flag: '🇹🇳', name: 'Tunisia', nationalLength: 8 },
    { code: '+20', flag: '🇪🇬', name: 'Egypt', nationalLength: 10 },
    { code: '+91', flag: '🇮🇳', name: 'India', nationalLength: 10 },
    { code: '+971', flag: '🇦🇪', name: 'UAE', nationalLength: 9 },
  ];

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => navigate(-1)} />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex flex-col items-center justify-start px-6 py-8">
            <div className="w-full mb-4 relative">
              <button onClick={() => navigate(-1)} className="text-2xl hover:opacity-70 absolute -top-2 -right-2 text-gray-600">✕</button>
              <h1 className="text-2xl font-bold text-black text-center">Sign up</h1>
            </div>

            <div className="h-1 w-full bg-gray-300 relative mb-6">
              <div className="absolute top-0 left-0 h-1 bg-green-800" style={{ width: `${(step + 1) * 25}%` }} />
            </div>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm w-full">
                {error}
              </div>
            )}

            {step === 0 && (
              <div className="w-full">
                <h2 className="text-3xl font-bold text-green-800 text-center mb-6">Welcome</h2>
                <div className="w-full space-y-4 border border-gray-200 rounded-xl p-4 mb-4 bg-gray-50">
                  <input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border-b border-gray-200 pb-2 h-12 text-lg focus:outline-none focus:border-green-600 bg-transparent placeholder-gray-500"
                  />
                  <PasswordInput
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border-b border-gray-200 pb-2 h-12 text-lg focus:outline-none bg-transparent placeholder-gray-500"
                    showStrengthIndicator={true}
                  />
                  <PasswordInput
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pb-1 h-12 text-lg focus:outline-none bg-transparent placeholder-gray-500"
                  />
                </div>
                <button onClick={handleSignupStep} className="bg-green-800 hover:bg-green-700 text-white text-lg font-semibold rounded-full py-3 px-8 w-full transition">
                  Continue
                </button>
                <p className="text-sm text-gray-600 text-center mt-4">
                  Already have an account?{' '}
                  <button onClick={() => navigate('/login')} className="text-green-700 underline hover:text-green-800 transition-colors">Log in here</button>
                </p>
              </div>
            )}

            {step === 1 && (
              <div className="w-full">
                <h2 className="text-center text-2xl font-bold text-green-800 mb-2">Enter the 6 digits</h2>
                <p className="text-center text-sm text-gray-700 mb-6">A code was sent to your email. Please enter it below to verify your account.</p>
                <div className="flex justify-between items-center px-4 mb-6">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <input
                      key={i}
                      ref={(el) => (codeInputsRef.current[i] = el)}
                      value={code[i]}
                      onChange={(e) => handleVerificationChange(e.target.value, i)}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      className="w-12 h-12 border-2 border-green-800 rounded text-center text-lg focus:outline-none focus:border-green-600 transition-colors mx-1"
                    />
                  ))}
                </div>
                <button onClick={handleVerifyStep} className="bg-green-800 hover:bg-green-700 text-white text-lg font-semibold rounded-full py-3 px-8 w-full transition">
                  Verify
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="w-full">
                <div className="flex flex-col items-center mb-8">
                  <h2 className="text-3xl font-bold text-green-800 text-center mb-4">Identification</h2>
                  <p className="text-gray-700 text-lg text-center px-4">Please select your profile type:</p>
                </div>
                <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6 mt-4 w-full">
                  {['tourist', 'owner', 'partner'].map((type) => (
                    <button
                      key={type}
                      onClick={() => handleSelectRole(type)}
                      className={`border-2 rounded-lg py-6 px-6 w-full sm:w-32 lg:w-36 h-32 sm:h-36 lg:h-40 flex flex-col items-center justify-center transition-colors group focus:outline-none focus:ring-2 focus:ring-green-800 focus:ring-opacity-50 ${
                        profileType === type ? 'border-green-800 bg-green-800 text-white' : 'border-green-800 hover:bg-green-800 hover:text-white'
                      }`}
                    >
                      <span className="text-lg font-semibold text-center capitalize">
                        {type}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="w-full">
                <h2 className="text-2xl font-semibold text-black text-center mb-6">Profile</h2>
                <div className="flex justify-center mb-8">
                  <div className="relative w-36 h-36 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
                    <img src={profileImage ? URL.createObjectURL(profileImage) : DefaultAvatar} alt="Profile" className="w-full h-full object-cover" />
                  </div>
                </div>
                <div className="flex justify-center mb-8">
                  <button onClick={() => fileInputRef.current?.click()} className="flex items-center px-6 py-3 bg-gray-400 hover:bg-gray-500 text-white rounded-full transition-colors">
                    <span className="mr-2 text-lg">📷</span>
                    Add photo
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => setProfileImage(e.target.files?.[0] || null)} className="hidden" />
                </div>

                <div className="space-y-4 border border-gray-300 rounded-xl p-4">
                  <div className="mb-6 flex justify-center gap-4">
                    {['Male', 'Female', 'Other'].map((g) => (
                      <button
                        key={g}
                        onClick={() => setGender(g)}
                        className={`px-4 py-2 rounded-full border ${gender === g ? 'bg-green-700 text-white' : 'bg-gray-200'}`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>

                  <div className="relative">
                    <div className="flex bg-gray-50 rounded-lg border items-center">
                      <div className="relative">
                        <button onClick={() => setShowCountryDropdown(!showCountryDropdown)} className="flex items-center px-3 py-3 border-r border-green-200 bg-transparent hover:bg-green-100 transition-colors">
                          <span className="mr-2">{selectedCountry.flag}</span>
                          <span className="text-sm font-medium text-gray-700">{selectedCountry.code}</span>
                          <span className="ml-1 text-gray-500">▼</span>
                        </button>
                        {showCountryDropdown && (
                          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {countries.map((c) => (
                              <button key={c.code} onClick={() => { setSelectedCountry(c); setShowCountryDropdown(false); }} className="w-full flex items-center px-3 py-2 hover:bg-gray-50 text-left">
                                <span className="mr-3">{c.flag}</span>
                                <span className="mr-2 font-medium">{c.code}</span>
                                <span className="text-sm text-gray-600">{c.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <input
                        type="tel"
                        placeholder="Phone Number"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        className="flex-1 px-3 py-3 bg-transparent border-none outline-none placeholder-gray-500"
                      />
                    </div>
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="Full name"
                      value={fullName}
                      onChange={(e) => { const v = e.target.value; if (!/\d/.test(v)) setFullName(v); }}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg outline-none focus:border-green-500 placeholder-gray-500"
                    />
                  </div>
                </div>

                <div className="flex justify-center mt-6">
                  <button onClick={handleFinishProfile} disabled={!isProfileFormValid} className={`text-white text-lg font-semibold rounded-full py-3 px-8 w-full max-w-xs transition ${!isProfileFormValid ? 'bg-gray-300 cursor-not-allowed' : 'bg-green-700 hover:bg-green-800'}`}>
                    Finish
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}


