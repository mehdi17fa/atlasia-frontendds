// src/pages/Profile/Profile.js
import React, { useContext } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SectionTitle from '../../components/shared/SectionTitle';
import DefaultAvatar from '../assets/default-pp.png';
import { AuthContext } from '../../context/AuthContext'; // ← import context
import S3Image from '../../components/S3Image';
import SignUpScreen from '../SignUp/SignUpScreen';
import SignupScreenConf from '../SignUp/SignUpConfScreen';
import IdentificationModal from '../SignUp/IdentificationScreen';
import LoginScreen from '../LogIn/LogInScreen';
import { useProfileData } from '../../hooks/useProfileData';

// Get user initials for avatar fallback
const getInitials = (user) => {
  if (!user) return 'U';
  
  // Try different name fields
  const fullName = user.fullName || user.name || (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : '');
  const email = user.email;
  
  if (fullName && fullName.trim()) {
    const names = fullName.trim().split(' ').filter(name => name.length > 0);
    if (names.length >= 2) {
      return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
    } else {
      return names[0].charAt(0).toUpperCase();
    }
  } else if (email) {
    return email.charAt(0).toUpperCase();
  }
  
  return 'U';
};

// Profile Avatar Component
const ProfileAvatar = ({ user }) => {
  const [imageError, setImageError] = useState(false);
  
  if (!user?.profilePic || imageError) {
    return (
      <div className="w-full h-full bg-green-600 flex items-center justify-center rounded-full border-4 border-green-600">
        <span className="text-white text-4xl font-bold">
          {getInitials(user)}
        </span>
      </div>
    );
  }
  
  return (
    <div className="w-full h-full rounded-full overflow-hidden border-4 border-green-600">
      <S3Image
        src={user.profilePic}
        alt="Profile"
        className="w-full h-full object-cover"
        fallbackSrc={null}
        onError={() => {
          setImageError(true);
        }}
      />
    </div>
  );
};

export default function Profile() {
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [showSignupConfirmation, setShowSignupConfirmation] = useState(false);
  const [showIdentification, setShowIdentification] = useState(false);
  const navigate = useNavigate();
  
  const { user, logout, setUser } = useContext(AuthContext); // ← get user and logout
  
  // Dynamic profile data fetching - only if user exists and has valid token
  const shouldFetchProfile = user && user._id && localStorage.getItem('atlasia_access_token');
  const { 
    profileData, 
    loading: profileLoading, 
    error: profileError, 
    refreshProfileData 
  } = useProfileData(user?._id, shouldFetchProfile);
  
  // Use dynamic data if available, fallback to context user
  const displayUser = profileData || user;
  const handleLogin = () => setShowLogin(true);
  const handleSignup = () => setShowSignup(true);
  const handleCloseLogin = () => setShowLogin(false);
  const handleCloseSignup = () => setShowSignup(false);
  const handleCloseSignupConfirmation = () => setShowSignupConfirmation(false);
  const handleSwitchToSignup = () => {
    setShowLogin(false);
    setShowSignup(true);
  };
  const handleSwitchToLogin = () => {
    setShowSignup(false);
    setShowLogin(true);
  };
  const handleSwitchToConfirmation = () => {
    setShowSignup(false);
    setShowIdentification(true);
  };
  const handleBackToSignup = () => {
    setShowIdentification(false);
    setShowSignup(true);
  };
  const handleSearchBarClick = () => {
    navigate('/search');
  };
  
  // Handle profile data refresh
  const handleRefreshProfile = () => {
    refreshProfileData();
  };
  
  const handleLogoutClick = () => {
    // Clear user data and tokens
    logout();
    
    // Use window.location.replace for immediate redirect without React Router interference
    window.location.replace('/');
  };
  
  
  // Update context user when dynamic data is fetched
  React.useEffect(() => {
    if (profileData && profileData !== user) {
      setUser(profileData);
    }
  }, [profileData, user, setUser]);


  // Redirect to login if user is not authenticated
  React.useEffect(() => {
    const token = localStorage.getItem('atlasia_access_token');
    if (!user || !token) {
      navigate('/login');
    }
  }, [user, navigate]);
  
  // Refresh profile data when component mounts (e.g., returning from edit profile)
  React.useEffect(() => {
    if (user?._id) {
      refreshProfileData();
    }
  }, []); // Only run on mount
  // Routes for each menu item
  const menuItems = [
    { label: 'Info Personnel', path: '/edit-profile' },
    { label: 'Ma Balance et Payments', path: '/payments' },
    { label: 'Language', path: '/language' },
    { label: 'Notifications', path: '/notifications' },
    { label: 'Mes Données', path: '/data' },
    { label: 'Séjour de travaille', path: '/work-stays' },
  ];

  if (!user) {
    return (
      <div className="relative">
        <div className="text-center mt-20 text-gray-500">
          Please log in to view your profile.
          <div className="flex gap-4 text-sm justify-center mt-4">
            <button
              onClick={handleLogin}
              className="bg-green-800 text-white px-6 py-2 rounded-full font-medium hover:bg-green-700 transition"
            >
              Log in
            </button>
            <button
              onClick={handleSignup}
              className="bg-white text-black px-6 py-2 rounded-full font-medium hover:bg-green-600 hover:text-white transition border border-gray-300"
            >
              Sign up
            </button>
          </div>
        </div>

        {/* ADD THE MODAL COMPONENTS HERE */}
        {showLogin && <LoginScreen onClose={handleCloseLogin} />}
      {showSignup && <SignUpScreen onClose={handleCloseSignup} />}
        {showSignupConfirmation && <SignupScreenConf onClose={handleCloseSignupConfirmation} />}
        {showIdentification && <IdentificationModal onClose={() => setShowIdentification(false)} onBack={handleBackToSignup} />}
        

        {/* ADD THE MODAL OVERLAY */}
        {(showLogin || showSignup || showSignupConfirmation || showIdentification) && (
          <div className="fixed inset-0 bg-black bg-opacity-40 z-20" />
        )}
      </div>

    );
  }

  return (
    <div className="pb-32 px-4 mt-12 relative">

      <div className="flex items-center justify-center mb-4 relative">
      {/* Back arrow button */}
      <button
        onClick={() => navigate(-1)} // go back
        className="absolute left-0 text-green-700 hover:text-green-900 transition"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      </div>

      <div className="text-center text-green-700 font-bold text-2xl mb-4">
        ATLASIA
         
      </div>

      <div className="text-center mt-6">
        {/* Loading indicator for profile data */}
        {profileLoading && (
          <div className="mb-4 text-sm text-gray-500">
            <div className="inline-flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Chargement des données...
            </div>
          </div>
        )}
        
        {/* Error message for profile data */}
        {profileError && (
          <div className="mb-4 text-sm text-red-500">
            <div className="inline-flex items-center">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {profileError}
              <button 
                onClick={handleRefreshProfile}
                className="ml-2 text-green-600 hover:text-green-800 underline"
              >
                Réessayer
              </button>
            </div>
          </div>
        )}

        <div className="w-32 h-32 mx-auto">
          <ProfileAvatar user={displayUser} />
        </div>

        <h1 className="font-semibold text-3xl mt-2">{displayUser?.fullName || displayUser?.email}</h1>
        <div className="mt-4 text-green-700 font-medium">
          {displayUser?.role === 'partner'
            ? 'Devenir partenaire avec Atlasia'
            : 'Bienvenue sur Atlasia'}
          <br />
          <span className="text-sm underline cursor-pointer" onClick={() => navigate('/edit-profile')}>
            voir plus
          </span>
        </div>
        
        {/* Refresh button */}
        <div className="mt-2">
          <button
            onClick={handleRefreshProfile}
            disabled={profileLoading}
            className="text-xs text-gray-500 hover:text-green-600 transition-colors disabled:opacity-50"
          >
            {profileLoading ? 'Actualisation...' : 'Actualiser les données'}
          </button>
        </div>
      </div>

      <SectionTitle title="Account Settings" />
      <ul className="space-y-4 ml-4">
        {menuItems.map((item) => (
          <li key={item.label}>
            <button
              onClick={() => navigate(item.path)}
              className="w-full flex justify-between items-center py-3 px-4 border rounded-lg bg-gray-50 hover:bg-gray-100 text-left"
            >
              <span>{item.label}</span>
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-6 text-center flex justify-center gap-4">
        <button
          onClick={() => navigate('/edit-profile')}
          className="bg-green-700 text-white py-2 px-6 rounded-full font-medium"
        >
          Modifier le profil
        </button>

        <button
          onClick={handleLogoutClick}
          className="bg-red-600 hover:bg-red-700 text-white py-2 px-6 rounded-full font-medium transition-colors duration-200"
        >
          Déconnexion
        </button>
      </div>

    </div>
  );
}
