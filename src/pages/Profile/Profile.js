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

export default function Profile() {
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [showSignupConfirmation, setShowSignupConfirmation] = useState(false);
  const [showIdentification, setShowIdentification] = useState(false);
  const navigate = useNavigate();
  
  const { user, logout } = useContext(AuthContext); // ← get user and logout
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
    <div className="pb-20 px-4 mt-12 relative">

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
        <div className="w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-green-600">
          <S3Image
            src={user.profilePic}
            alt="Profile"
            className="w-full h-full object-cover"
            fallbackSrc={DefaultAvatar}
          />
          {/* Debug info */}
          <div className="text-xs text-gray-500 mt-1">
            Debug: {user.profilePic ? 'Has profilePic' : 'No profilePic'}
          </div>
        </div>

        <h1 className="font-semibold text-3xl mt-2">{user.fullName || user.email}</h1>
        <div className="mt-4 text-green-700 font-medium">
          {user.role === 'partner'
            ? 'Devenir partenaire avec Atlasia'
            : 'Bienvenue sur Atlasia'}
          <br />
          <span className="text-sm underline cursor-pointer" onClick={() => navigate('/edit-profile')}>
            voir plus
          </span>
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
          onClick={() => {
            logout();
            navigate('/');
          }}
          className="bg-red-600 hover:bg-red-700 text-white py-2 px-6 rounded-full font-medium"
        >
          Déconnexion
        </button>
      </div>

    </div>
  );
}
