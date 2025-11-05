import React, { useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import PasswordInput from '../../components/shared/PasswordInput';
import { AuthContext } from '../../context/AuthContext';
import { tokenStorage } from '../../utils/tokenStorage';
import { BuildingOfficeIcon } from '@heroicons/react/24/outline';

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
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedCountry, setSelectedCountry] = useState({ code: '+212', flag: '🇲🇦', name: 'Morocco', nationalLength: 9 });
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  
  // B2B specific fields
  const [businessName, setBusinessName] = useState('');
  const [serviceProvided, setServiceProvided] = useState('');
  const [location, setLocation] = useState('');

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

  const isProfileFormValid = fullName.trim() !== '' && phoneNumber.length === getNationalLength(selectedCountry);
  const isB2BFormValid = isProfileFormValid && (profileType !== 'b2b' || (businessName.trim() !== '' && serviceProvided && location.trim() !== ''));

  const handleFinishProfile = async () => {
    if (!isB2BFormValid) return;
    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('fullName', fullName);
      formData.append('phoneNumber', selectedCountry.code + phoneNumber);
      formData.append('country', selectedCountry.name);
      formData.append('profileType', profileType);
      
      // Add B2B fields if profileType is b2b
      if (profileType === 'b2b') {
        formData.append('businessName', businessName);
        formData.append('serviceProvided', serviceProvided);
        formData.append('location', location);
      }

      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/complete-profile`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      login(response.data.user, response.data.accessToken, response.data.refreshToken);
      tokenStorage.setTokens(response.data.user, response.data.accessToken, response.data.refreshToken);

      if (profileType === 'owner') navigate('/owner-welcome', { replace: true });
      else if (profileType === 'partner' || profileType === 'intermediate') navigate('/partner-welcome', { replace: true });
      else if (profileType === 'b2b') navigate('/b2b-dashboard', { replace: true }); // B2B users go to B2B dashboard
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
              <h1 className="text-2xl font-bold text-black text-center">S'inscrire</h1>
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
                <h2 className="text-3xl font-bold text-green-800 text-center mb-6">Bienvenue</h2>
                <div className="w-full space-y-4 border border-gray-200 rounded-xl p-4 mb-4 bg-gray-50">
                  <input
                    type="email"
                    placeholder="Adresse e-mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border-b border-gray-200 pb-2 h-12 text-lg focus:outline-none focus:border-green-600 bg-transparent placeholder-gray-500"
                  />
                  <PasswordInput
                    placeholder="Mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border-b border-gray-200 pb-2 h-12 text-lg focus:outline-none bg-transparent placeholder-gray-500"
                    showStrengthIndicator={true}
                  />
                  <PasswordInput
                    placeholder="Confirmer le mot de passe"
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
                  Vérifier
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="w-full">
                <div className="flex flex-col items-center mb-8">
                  <h2 className="text-3xl font-bold text-green-800 text-center mb-4">Identification</h2>
                  <p className="text-gray-700 text-lg text-center px-4">Veuillez sélectionner votre type de profil :</p>
                </div>
                <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6 mt-4 w-full flex-wrap">
                  {[
                    { value: 'tourist', label: 'Touriste', icon: null },
                    { value: 'owner', label: 'Propriétaire', icon: null },
                    { value: 'intermediate', label: 'Intermédiaire', icon: null },
                    { value: 'b2b', label: 'B2B', icon: BuildingOfficeIcon }
                  ].map((type) => (
                    <button
                      key={type.value}
                      onClick={() => handleSelectRole(type.value)}
                      className={`border-2 rounded-lg py-6 px-6 w-full sm:w-32 lg:w-36 h-32 sm:h-36 lg:h-40 flex flex-col items-center justify-center transition-colors group focus:outline-none focus:ring-2 focus:ring-green-800 focus:ring-opacity-50 ${
                        profileType === type.value ? 'border-green-800 bg-green-800 text-white' : 'border-green-800 hover:bg-green-800 hover:text-white'
                      }`}
                    >
                      {type.icon && (
                        <type.icon className={`w-8 h-8 mb-2 ${profileType === type.value ? 'text-white' : 'text-green-800 group-hover:text-white'}`} />
                      )}
                      <span className="text-lg font-semibold text-center">
                        {type.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="w-full">
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-green-800 text-center mb-2">Informations personnelles</h2>
                  <p className="text-gray-600 text-center text-sm">Remplissez vos informations pour compléter votre profil</p>
                </div>

                <div className="space-y-6">
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nom complet</label>
                    <input
                      type="text"
                      placeholder="Entrez votre nom complet"
                      value={fullName}
                      onChange={(e) => { const v = e.target.value; if (!/\d/.test(v)) setFullName(v); }}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-green-600 focus:ring-2 focus:ring-green-200 transition-all placeholder-gray-400 text-gray-700"
                    />
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Numéro de téléphone</label>
                    <div className="relative flex bg-white rounded-xl border-2 border-gray-200 focus-within:border-green-600 focus-within:ring-2 focus-within:ring-green-200 transition-all">
                      <div className="relative">
                        <button 
                          onClick={() => setShowCountryDropdown(!showCountryDropdown)} 
                          className="flex items-center px-4 py-3 border-r-2 border-gray-200 bg-gray-50 hover:bg-gray-100 rounded-l-xl transition-colors"
                        >
                          <span className="mr-2 text-lg">{selectedCountry.flag}</span>
                          <span className="text-sm font-semibold text-gray-700">{selectedCountry.code}</span>
                          <svg className="ml-2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {showCountryDropdown && (
                          <div className="absolute top-full left-0 z-50 mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto min-w-[280px] w-full">
                            {countries.map((c) => (
                              <button 
                                key={c.code} 
                                onClick={() => { setSelectedCountry(c); setShowCountryDropdown(false); }} 
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-green-50 text-left transition-colors border-b border-gray-100 last:border-b-0"
                              >
                                <span className="text-xl">{c.flag}</span>
                                <span className="font-semibold text-gray-700">{c.code}</span>
                                <span className="ml-auto text-sm text-gray-600">{c.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <input
                        type="tel"
                        placeholder="Numéro de téléphone"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        className="flex-1 px-4 py-3 bg-transparent border-none outline-none placeholder-gray-400 text-gray-700 rounded-r-xl"
                      />
                    </div>
                  </div>
                  
                  {/* B2B specific fields */}
                  {profileType === 'b2b' && (
                    <div className="pt-6 border-t-2 border-gray-200">
                      <div className="mb-4">
                        <h3 className="text-xl font-bold text-green-800 mb-1">Informations professionnelles</h3>
                        <p className="text-sm text-gray-600">Détails de votre entreprise</p>
                      </div>
                      
                      <div className="space-y-5">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Nom de l'entreprise</label>
                          <input
                            type="text"
                            placeholder="Entrez le nom de votre entreprise"
                            value={businessName}
                            onChange={(e) => setBusinessName(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-green-600 focus:ring-2 focus:ring-green-200 transition-all placeholder-gray-400 text-gray-700"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Service fourni</label>
                          <select
                            value={serviceProvided}
                            onChange={(e) => setServiceProvided(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-green-600 focus:ring-2 focus:ring-green-200 transition-all bg-white text-gray-700 cursor-pointer"
                          >
                            <option value="" className="text-gray-400">Sélectionner un service</option>
                            <option value="restaurant">Restaurant</option>
                            <option value="catering">Traiteur</option>
                            <option value="transportation">Transport</option>
                            <option value="tours">Tours</option>
                            <option value="activities">Activités</option>
                            <option value="cleaning">Nettoyage</option>
                            <option value="maintenance">Maintenance</option>
                            <option value="event-planning">Planification d'événements</option>
                            <option value="photography">Photographie</option>
                            <option value="other">Autre</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Localisation</label>
                          <input
                            type="text"
                            placeholder="Ville, Pays"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-green-600 focus:ring-2 focus:ring-green-200 transition-all placeholder-gray-400 text-gray-700"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-center mt-8">
                  <button 
                    onClick={handleFinishProfile} 
                    disabled={!isB2BFormValid} 
                    className={`text-white text-lg font-semibold rounded-xl py-4 px-12 w-full max-w-sm transition-all transform ${
                      !isB2BFormValid 
                        ? 'bg-gray-300 cursor-not-allowed' 
                        : 'bg-green-700 hover:bg-green-800 hover:shadow-lg hover:scale-105 active:scale-100'
                    }`}
                  >
                    Terminer l'inscription
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


