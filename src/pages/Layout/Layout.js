import React, { useState, useContext } from 'react';
import { useNavigate } from "react-router-dom";
import { Outlet } from 'react-router-dom';
import SearchBar from '../../components/explore/SearchBar';
import ExploreFilter from '../../components/explore/ExplorFilter';
import MapToggle from '../../components/explore/MapToggle';
import Navbar from '../../components/shared/Navbar';
import DestinationSearchScreens from '../UserSearch/Destination';
import DateSelectionScreens from '../UserSearch/Date';
import GuestsSelectionScreen from '../UserSearch/Invités';

import SignUpScreen from '../SignUp/SignUpScreen';
import SignupScreenConf from '../SignUp/SignUpConfScreen';
import IdentificationModal from '../SignUp/IdentificationScreen';
import LoginScreen from '../LogIn/LogInScreen';
import { AuthContext } from '../../context/AuthContext';
import DefaultAvatar from "../assets/default-pp.png";

export default function ExploreLayout() {
  const { user } = useContext(AuthContext);

  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState('explore');
  const [selectedDestination, setSelectedDestination] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [showSignupConfirmation, setShowSignupConfirmation] = useState(false);
  const [showIdentification, setShowIdentification] = useState(false);

  // Step handlers
  const handleSearchBarClick = () => {
    navigate('/search');
  };

  const handleDestinationSelected = (dest) => {
    setSelectedDestination(dest);
    setCurrentStep('date');
  };
  const handleDateSelected = (dateSel) => {
    setSelectedDate(dateSel);
    setCurrentStep('guests');
  };
  const handleGuestsSearch = () => setCurrentStep('explore');
  const handleBackToExplore = () => setCurrentStep('explore');
  const handleBackToDestination = () => setCurrentStep('destination');
  const handleBackToDate = () => setCurrentStep('date');

  // Modal handlers
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

  const isModalOpen =
    currentStep !== 'explore' ||
    showLogin ||
    showSignup ||
    showSignupConfirmation ||
    showIdentification;

  return (
    <div className="relative min-h-screen">
      <div
        className={`transition duration-300 ease-in-out ${
          isModalOpen ? 'opacity-30 pointer-events-none select-none' : 'opacity-100'
        }`}
      >
        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between px-6 py-4 bg-white shadow-sm sticky top-0 z-10">
          {/* Show ATLASIA only when user is not logged in */}
          {!user && <h1 className="text-2xl font-bold text-green-800">ATLASIA</h1>}
          <div className="flex-1 max-w-3xl mx-10">
            <SearchBar onClick={handleSearchBarClick} />
          </div>
          {/* Replace this part in your desktop header */}
<div className="flex gap-4 text-sm">
  {user ? (
    // User is logged in - show avatar with green border like Profile page
    <button
      onClick={() => navigate('/profile')}
      className="flex items-center justify-center w-12 h-12 rounded-full overflow-hidden border-4 border-green-600 hover:border-green-700 transition-colors duration-200"
      aria-label="Go to profile"
    >
      {user.profilePic || user.avatar ? (
        <img
          src={user.profilePic || user.avatar}
          alt={user.fullName || user.name || 'User'}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-green-600 flex items-center justify-center">
          <span className="text-white text-lg font-bold">
            {user.firstName ? user.firstName.charAt(0).toUpperCase() : (user.fullName ? user.fullName.charAt(0).toUpperCase() : (user.name ? user.name.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : 'U')))}
          </span>
        </div>
      )}
    </button>
  ) : (
    // User is not logged in - show login/signup buttons
    <>
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
    </>
  )}
</div>


        </div>

        {/* Mobile Header - only on mobile */}
        <div className="block md:hidden">
          {/* App name centered on top */}
          <div className="flex items-center justify-between py-4 px-4 bg-white shadow-sm">
            {/* Show ATLASIA only when user is not logged in */}
            {!user && <span className="text-2xl font-bold text-green-700">ATLASIA</span>}
            
            {/* User avatar or login/signup buttons */}
            {user ? (
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center justify-center w-12 h-12 rounded-full overflow-hidden border-4 border-green-600 hover:border-green-700 transition-colors duration-200"
                aria-label="Go to profile"
              >
                {user.profilePic || user.avatar ? (
                  <img
                    src={user.profilePic || user.avatar}
                    alt={user.fullName || user.name || 'User'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-green-600 flex items-center justify-center">
                    <span className="text-white text-lg font-bold">
                      {user.firstName ? user.firstName.charAt(0).toUpperCase() : (user.fullName ? user.fullName.charAt(0).toUpperCase() : (user.name ? user.name.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : 'U')))}
                    </span>
                  </div>
                )}
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleLogin}
                  className="bg-green-800 text-white px-3 py-1 rounded-full text-sm font-medium hover:bg-green-700 transition"
                >
                  Log in
                </button>
                <button
                  onClick={handleSignup}
                  className="bg-white text-black px-3 py-1 rounded-full text-sm font-medium hover:bg-green-600 hover:text-white transition border border-gray-300"
                >
                  Sign up
                </button>
              </div>
            )}
          </div>

          {/* Mobile Navbar */}
          <Navbar title="Découvrir" />

          {/* Mobile Search Bar */}
          <div className="px-4">
            <SearchBar onClick={handleSearchBarClick} />
          </div>
        </div>

        <ExploreFilter />

        {/* Content Slot */}
        <Outlet />

      </div>

      {isModalOpen && <div className="fixed inset-0 bg-black bg-opacity-40 z-20" />}

      {currentStep === 'destination' && (
        <DestinationSearchScreens onBack={handleBackToExplore} onDestinationSelected={handleDestinationSelected} />
      )}

      {currentStep === 'date' && (
        <DateSelectionScreens selectedDestination={selectedDestination} onBack={handleBackToDestination} onNext={handleDateSelected} />
      )}

      {currentStep === 'guests' && (
        <GuestsSelectionScreen onBack={handleBackToDate} onSearch={handleGuestsSearch} />
      )}

{showLogin && <LoginScreen onClose={handleCloseLogin} />}
      {showSignup && <SignUpScreen onClose={handleCloseSignup} />}
      {showSignupConfirmation && <SignupScreenConf />}
      {showIdentification && <IdentificationModal />}
    </div>
  );
}
