import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { tokenStorage } from '../../utils/tokenStorage';

const ProfileSignupScreen = () => {
  const { login } = useContext(AuthContext);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedCountry, setSelectedCountry] = useState({
    code: '+212',
    flag: '🇲🇦',
    name: 'Morocco',
    nationalLength: 9,
  });
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [profileType, setProfileType] = useState('');
  
  // B2B specific fields
  const [businessName, setBusinessName] = useState('');
  const [serviceProvided, setServiceProvided] = useState('');
  const [location, setLocation] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const typeFromURL = new URLSearchParams(window.location.search).get('type');
    const normalizedType =
      typeFromURL?.toLowerCase() || localStorage.getItem('profileType')?.toLowerCase();
    setProfileType(normalizedType || '');
    if (typeFromURL) localStorage.setItem('profileType', typeFromURL);
  }, []);

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


  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setShowCountryDropdown(false);
  };

  const handlePhoneNumberChange = (e) => {
    const maxLen = selectedCountry.nationalLength ?? 10;
    const onlyNums = e.target.value.replace(/\D/g, '').slice(0, maxLen);
    setPhoneNumber(onlyNums);
  };

  const handleFullNameChange = (e) => {
    const value = e.target.value;
    if (!/\d/.test(value)) setFullName(value);
  };

  const isFormValid = fullName.trim() !== '' && phoneNumber.length === (selectedCountry.nationalLength ?? 10);
  const isB2BFormValid = isFormValid && (profileType !== 'b2b' || (businessName.trim() !== '' && serviceProvided && location.trim() !== ''));

const handleFinish = async () => {
  if (!isB2BFormValid) return;

  try {
    const formData = new FormData();
    const signupEmail = localStorage.getItem('signupEmail') || '';

    formData.append('email', signupEmail);
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

    // ✅ Complete profile and get tokens in one request
    const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/complete-profile`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    console.log("✅ Profile completion successful:", {
      hasUser: !!response.data.user,
      hasAccessToken: !!response.data.accessToken,
      hasRefreshToken: !!response.data.refreshToken,
      userId: response.data.user?._id,
      userRole: response.data.user?.role
    });

    // Save tokens using AuthContext and tokenStorage
    login(response.data.user, response.data.accessToken, response.data.refreshToken);
    
    // Also store in tokenStorage for backup
    tokenStorage.setTokens(response.data.user, response.data.accessToken, response.data.refreshToken);
    
    console.log("🔄 Tokens saved after profile completion");

    // Navigate safely with replace: true to prevent back navigation
    // Check both profileType and user role for B2B redirect
    const userRole = response.data.user?.role?.toLowerCase();
    const normalizedProfileType = profileType?.toLowerCase();
    const isB2B = normalizedProfileType === 'b2b' || userRole === 'b2b';

    console.log('🔀 Complete Profile redirect check:', {
      profileType,
      normalizedProfileType,
      userRole,
      isB2B,
      user: response.data.user
    });

    // Priority: B2B users always go to B2B profile page
    if (isB2B) {
      console.log('✅ Redirecting B2B user to /b2b-profile');
      // Use replace: true to prevent back navigation and ensure clean redirect
      navigate('/b2b-profile', { replace: true });
      // Fallback: Use window.location as additional safety measure
      setTimeout(() => {
        if (window.location.pathname !== '/b2b-profile') {
          console.log('⚠️ Fallback redirect to /b2b-profile');
          window.location.replace('/b2b-profile');
        }
      }, 100);
    } else if (normalizedProfileType === 'owner' || userRole === 'owner') {
      navigate('/owner-welcome', { replace: true });
    } else if (normalizedProfileType === 'partner' || normalizedProfileType === 'intermediate' || userRole === 'partner' || userRole === 'intermediate') {
      navigate('/partner-welcome', { replace: true });
    } else {
      navigate('/', { replace: true }); // default dashboard
    }

  } catch (error) {
    console.error('Error completing profile:', error.response?.data || error.message);
    alert(error.response?.data?.message || 'Failed to complete profile. Please try again.');
  }
};


  return (
    <div className="flex-1 bg-gradient-to-br from-gray-50 to-white min-h-screen overflow-auto py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate(-1)}
              className="text-gray-600 hover:text-gray-800 transition-colors mb-4 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm font-medium">Retour</span>
            </button>
            <h1 className="text-3xl font-bold text-green-800 mb-2">Compléter votre profil</h1>
            <p className="text-gray-600">Remplissez vos informations pour finaliser votre inscription</p>
          </div>

          <div className="space-y-6">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nom complet <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Entrez votre nom complet"
                value={fullName}
                onChange={handleFullNameChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-green-600 focus:ring-2 focus:ring-green-200 transition-all placeholder-gray-400 text-gray-700"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Numéro de téléphone <span className="text-red-500">*</span>
              </label>
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
                      {countries.map((country) => (
                        <button
                          key={country.code}
                          onClick={() => handleCountrySelect(country)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-green-50 text-left transition-colors border-b border-gray-100 last:border-b-0"
                        >
                          <span className="text-xl">{country.flag}</span>
                          <span className="font-semibold text-gray-700">{country.code}</span>
                          <span className="ml-auto text-sm text-gray-600">{country.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <input
                  type="tel"
                  placeholder="Numéro de téléphone"
                  value={phoneNumber}
                  onChange={handlePhoneNumberChange}
                  className="flex-1 px-4 py-3 bg-transparent border-none outline-none placeholder-gray-400 text-gray-700 rounded-r-xl"
                />
              </div>
            </div>
            
            {/* B2B specific fields */}
            {profileType === 'b2b' && (
              <div className="pt-6 border-t-2 border-gray-200">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-green-800 mb-1">Informations professionnelles</h3>
                  <p className="text-sm text-gray-600">Détails de votre entreprise</p>
                </div>
                
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nom de l'entreprise <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Entrez le nom de votre entreprise"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-green-600 focus:ring-2 focus:ring-green-200 transition-all placeholder-gray-400 text-gray-700"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Service fourni <span className="text-red-500">*</span>
                    </label>
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
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Localisation <span className="text-red-500">*</span>
                    </label>
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
              onClick={handleFinish}
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
      </div>

      {showCountryDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowCountryDropdown(false)}
        />
      )}
    </div>
  );
};

export default ProfileSignupScreen;
