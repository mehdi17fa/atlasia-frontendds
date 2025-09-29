import React, { useContext, useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from 'react-router-dom';
import { setGlobalNavigate } from './api';

// Import AuthContext and ProtectedRoute
import { AuthContext } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import SignUpScreen from './pages/SignUp/SignUpScreen';
import SignUpWizard from './pages/SignUp/SignUpWizard';
import IdentificationScreen from './pages/SignUp/IdentificationScreen';
import ProfileSignupScreen from './pages/SignUp/CompleteProfileScreen';
import SignupScreenConf from './pages/SignUp/SignUpConfScreen';
import LoginScreen from './pages/LogIn/LogInScreen';
import PasswordRecoveryScreen from './pages/LogIn/PasswordRecoveryScreen';
import PasswordRecoveryConfirmation from './pages/LogIn/PasswordRecoveryConfirmation';
import Explore from './pages/Explore/Explore';
import Restauration from './pages/Explore/Restauration';
import Packages from './pages/Explore/Packages';
import Activites from './pages/Explore/Activites';
import Profile from './pages/Profile/Profile';
import Favorites from './pages/Favorite/Favorite';
import Navbar from './components/shared/Navbar';
import NavbarProperty from './components/shared/NavbarProperty';
import NavbarPartner from './components/shared/NavbarPartner';

import { PropertyCreationProvider } from './context/PropertyCreationContext';
import WelcomeScreen from './pages/WelcomeScreen';
import ResetPasswordScreen from './pages/LogIn/ResetPasswordScreen';
import TestDocumentUpload from './pages/TestDocumentUpload';

import SearchResults from './pages/UserSearch/SearchResults';
import SearchResultsPage from './pages/UserSearch/SearchResultsPage';
import PropertySearchFlow from './pages/UserSearch/SearchFlow';

// Property Owner
import WelcomeOwner from './pages/propertyOwner/WelcomeOwner';
import PropertyCreationSinglePage from './pages/propertyOwner/PropertyCreationSinglePage';
import EditProperty from './pages/propertyOwner/EditProperty';
import MyProperties from './pages/propertyOwner/MyProperties';
import ReservationPage from './pages/propertyOwner/ReservationPage';
import PropertyPreview from './pages/Propriétés/PropertyPreview';
import OwnerDetails from './pages/propertyOwner/OwnerDetails';
import OwnerIncomePage from './pages/propertyOwner/OwnerIncomePage';

// Booking
import BookingRequest from './pages/Booking/BookingRequest';
import BookingConfirm from './pages/Booking/BookingConfirm';
import BookingDetails from './pages/Booking/BookingDetails';
import PackageBookingDetails from './pages/Booking/PackageBookingDetails';
import MyBookings from './pages/Booking/MyBookings';


// Intermédiaire
import HomeIntermédiaire from './pages/Intermediate/Acceuil';
import CreatePackage from './pages/Intermediate/createPackage';
import SelectPropertyStep from './pages/Intermediate/SelectPropertyStep';
import Performance from './pages/Intermediate/Performance';
import CohostingExplore from './pages/Explore/CohostingExplore';
import CoHostPropertyPreview from './pages/Intermediate/CoHostPropertyPreview'; 
import PartnerCohostingManagement from './pages/Intermediate/PartnerCohostingManagement';
import PackageCreationFlow from './pages/Intermediate/PackageCreationFlow';
import PackageManagement from './pages/Intermediate/PackageManagement';
import EditPackage from './pages/Intermediate/EditPackage';
import PackageBooking from './pages/Booking/PackageBooking';

// Inbox / Chat
import Inbox from './pages/Inbox/Inbox';
import NotificationCenter from './pages/Inbox/NotificationCenter';
import ChatPage from './pages/Inbox/chatPage';

// Modals / Search
import DateSelectionScreens from './pages/UserSearch/Date';
import GuestsSelectionScreen from './pages/UserSearch/Invités';

import ExploreLayout from './pages/Layout/Layout';
import CohostPropertyLayout from './pages/Layout/CohostPropertyLayout';
import VillaMakarska from './pages/Propriétés/VillaMakarska';
import EditProfileScreen from './pages/Profile/EditProfile';
import DocumentUpload from './utilities/DocumentUpload';

// Admin Dashboard
import AdminDashboard from './pages/AdminDashboard';

// Explore affiché en fond avec modal devant
function ModalLayout({ children }) {
  return (
    <div className="relative">
      <div className="opacity-30 pointer-events-none">
        <ExploreLayout/>
      </div>
      {children}
    </div>
  );
}

// Wrapper pour l'écran de sélection de date
function DateSelectionScreensWrapper() {
  const navigate = useNavigate();
  const selectedDestination = "Paris"; // à remplacer par une vraie valeur

  const handleBack = () => navigate(-1);

  return (
    <DateSelectionScreens
      selectedDestination={selectedDestination}
      onBack={handleBack}
    />
  );
}

// Wrapper pour l'écran d'invités
function GuestsSelectionScreenWrapper() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = location || {};

  const handleBack = () => navigate(-1);

  const handleSearch = (guestData) => {
    console.log('Final search data:', { ...state, guests: guestData });
    // navigate('/search-results', { state: { ... } });
  };

  return (
    <GuestsSelectionScreen
      onBack={handleBack}
      onSearch={handleSearch}
    />
  );
}

// Updated Conditional navbar with role-based logic
function ConditionalNavbar() {
  const location = useLocation();
  const { user } = useContext(AuthContext);
  const isChatPage = location.pathname.startsWith('/chat/');

  // Don't show navbar on chat pages
  if (isChatPage) return null;

  // Don't show navbar if user is not logged in
  if (!user) return null;

  return (
    <div className="block">
      {user.role === 'owner' ? (
        <NavbarProperty />
      ) : user.role === 'partner' ? (
        <NavbarPartner />
      ) : (
        <Navbar />
      )}
    </div>
  );
}

// Navigation setup component
function NavigationSetup() {
  const navigate = useNavigate();
  
  useEffect(() => {
    setGlobalNavigate(navigate);
  }, [navigate]);
  
  return null;
}

// Main App
function App() {
  const [signupData, setSignupData] = useState({
    email: '',
    password: '',
    role: '',
    fullName: '',
  });

  return (
    <PropertyCreationProvider>
      <NavigationSetup />
      <Routes>
        {/* Explore layout */}
        <Route path="/" element={<ExploreLayout />}>
          <Route index element={<Explore />} />
          <Route path="restauration" element={<Restauration />} />
          <Route path="activites" element={<Activites />} />
          <Route path="packages" element={<Packages />} />
          {/* Package details route for tourist section */}
          <Route path="packages/:packageId" element={<PackageBooking />} />
        </Route>

        <Route path="/search" element={<PropertySearchFlow />} />
        <Route path="/search/results" element={<SearchResultsPage />} />
        
        {/* Admin Dashboard - Public access */}
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        
        {/* General / Auth - Only accessible when NOT authenticated */}
        <Route path="/login" element={<ProtectedRoute requireAuth={false}><LoginScreen /></ProtectedRoute>} />
        {/* New consolidated signup wizard; keep legacy screens accessible if needed */}
        <Route path="/signup" element={<ProtectedRoute requireAuth={false}><SignUpWizard /></ProtectedRoute>} />
        <Route path="/signup-confirmation" element={<ProtectedRoute requireAuth={false}><SignupScreenConf /></ProtectedRoute>} />
        <Route path="/identification" element={<ProtectedRoute requireAuth={false}><IdentificationScreen /></ProtectedRoute>} />
        <Route
          path="/complete-profile"
          element={<ProtectedRoute requireAuth={false}><ProfileSignupScreen signupData={signupData} setSignupData={setSignupData} /></ProtectedRoute>}
        />
        <Route path="/password-recovery" element={<ProtectedRoute requireAuth={false}><PasswordRecoveryScreen /></ProtectedRoute>} />
        <Route path="/password-recovery-confirmation" element={<ProtectedRoute requireAuth={false}><PasswordRecoveryConfirmation /></ProtectedRoute>} />
        <Route path="/reset-password/:token" element={<ProtectedRoute requireAuth={false}><ResetPasswordScreen /></ProtectedRoute>} />
        <Route path="/welcomescreen" element={<ProtectedRoute requireAuth={false}><WelcomeScreen /></ProtectedRoute>} />

        {/* User sections - Require authentication */}
        <Route path="/profile" element={<ProtectedRoute allowedRoles={['owner', 'partner', 'tourist', 'user']}><Profile /></ProtectedRoute>} />
        <Route path="/edit-profile" element={<ProtectedRoute allowedRoles={['owner', 'partner', 'tourist', 'user']}><EditProfileScreen /></ProtectedRoute>} />
        <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
        <Route path="/test-upload" element={<ProtectedRoute><TestDocumentUpload /></ProtectedRoute>} />
        <Route path="/partner-welcome" element={<ProtectedRoute allowedRoles={['partner']}><HomeIntermédiaire /></ProtectedRoute>} />
        <Route path="/VillaMakarska" element={<ProtectedRoute><VillaMakarska /></ProtectedRoute>} />
        <Route path="/property/:id" element={<PropertyPreview />} />
        <Route path="/owner/:id" element={<ProtectedRoute><OwnerDetails /></ProtectedRoute>} />
        <Route path="/owner/:ownerId" element={<ProtectedRoute><CoHostPropertyPreview /></ProtectedRoute>} />

        {/* Co-hosting routes - Require authentication */}
        <Route path="/cohosting-explore" element={<ProtectedRoute><CohostingExplore /></ProtectedRoute>} />
        <Route path="/cohosting-preview/:propertyId" element={<ProtectedRoute><CoHostPropertyPreview /></ProtectedRoute>} />
        <Route path="/partner/cohosting-management" element={<ProtectedRoute allowedRoles={['partner']}><PartnerCohostingManagement /></ProtectedRoute>} />
        

        {/* Messages - Require authentication */}
        <Route path="/inbox" element={<ProtectedRoute><Inbox /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationCenter /></ProtectedRoute>} />
        <Route path="/chat/:sender" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />

        {/* Modals - Require authentication */}
        <Route path="/search-date" element={<ProtectedRoute><DateSelectionScreensWrapper /></ProtectedRoute>} />
        <Route path="/search-guests" element={<ProtectedRoute><GuestsSelectionScreenWrapper /></ProtectedRoute>} />

        {/* Property owner flow - Require owner role */}
        <Route path="/owner-welcome" element={<ProtectedRoute allowedRoles={['owner']}><WelcomeOwner /></ProtectedRoute>} />
        <Route path="/create-property" element={<ProtectedRoute allowedRoles={['owner']}><PropertyCreationSinglePage /></ProtectedRoute>} />
        <Route path="/edit-property/:id" element={<ProtectedRoute allowedRoles={['owner']}><EditProperty /></ProtectedRoute>} />

        <Route path="/my-properties" element={<ProtectedRoute allowedRoles={['owner']}><MyProperties /></ProtectedRoute>} />
        <Route path="/owner/income" element={<ProtectedRoute allowedRoles={['owner']}><OwnerIncomePage /></ProtectedRoute>} />
        <Route path="/owner/reservations/:propertyId" element={<ProtectedRoute allowedRoles={['owner']}><ReservationPage /></ProtectedRoute>} />
        <Route path="/test-reservations" element={<ProtectedRoute><div className="p-6"><h1>Test Route Works!</h1></div></ProtectedRoute>} />

        {/* Booking - Require authentication */}
        <Route path="/booking/request/:propertyId" element={<ProtectedRoute><BookingRequest /></ProtectedRoute>} />
        <Route path="/booking/confirm/:propertyId" element={<ProtectedRoute><BookingConfirm /></ProtectedRoute>} />
        <Route path="/booking/:bookingId" element={<ProtectedRoute><BookingDetails /></ProtectedRoute>} />
        <Route path="/package-booking/:bookingId" element={<ProtectedRoute><PackageBookingDetails /></ProtectedRoute>} />
        <Route path="/my-bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />

        {/* Intermediate - Require partner role */}
        <Route path="/create-package" element={<ProtectedRoute allowedRoles={['partner']}><PackageCreationFlow /></ProtectedRoute>} />
        <Route path="/select-property" element={<ProtectedRoute allowedRoles={['partner']}><SelectPropertyStep /></ProtectedRoute>} />
        <Route path="/packages/:packageId/book" element={<ProtectedRoute><PackageBooking /></ProtectedRoute>} />
        <Route path='/performance' element={<ProtectedRoute allowedRoles={['partner']}><Performance /></ProtectedRoute>} />
        <Route path="/data" element={<ProtectedRoute><DocumentUpload /></ProtectedRoute>} />
        <Route path="/acceuill" element={<ProtectedRoute allowedRoles={['partner']}><HomeIntermédiaire /></ProtectedRoute>} />
        
        {/* Package Management - Require partner role */}
        <Route path="/package-management" element={<ProtectedRoute allowedRoles={['partner']}><PackageManagement /></ProtectedRoute>} />
        <Route path="/edit-package/:packageId" element={<ProtectedRoute allowedRoles={['partner']}><EditPackage /></ProtectedRoute>} />

      </Routes>

      <ConditionalNavbar />
    </PropertyCreationProvider>
  );
}

export default App;