import React, { useContext } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from 'react-router-dom';

import { useState } from 'react';

// Import AuthContext
import { AuthContext } from './context/AuthContext';

import SignUpScreen from './pages/SignUp/SignUpScreen';
import IdentificationScreen from './pages/SignUp/IdentificationScreen';
import ProfileSignupScreen from './pages/SignUp/CompleteProfileScreen';
import SignupScreenConf from './pages/SignUp/SignUpConfScreen';
import LoginScreen from './pages/LogIn/LogInScreen';
import PasswordRecoveryScreen from './pages/LogIn/PasswordRecoveryScreen';
import PasswordRecoveryConfirmation from './pages/LogIn/PasswordRecoveryConfirmation';
import Explore from './pages/Explore/Explore';
import Restauration from './pages/Explore/Restauration';
import Packages from './pages/Explore/Packages';
import Profile from './pages/Profile/Profile';
import Favorites from './pages/Favorite/Favorite';
import Navbar from './components/shared/Navbar';
import NavbarProperty from './components/shared/NavbarProperty';
import NavbarPartner from './components/shared/NavbarPartner';

import { PropertyCreationProvider } from './context/PropertyCreationContext';
import WelcomeScreen from './pages/WelcomeScreen';
import ResetPasswordScreen from './pages/LogIn/ResetPasswordScreen';

import SearchResults from './pages/UserSearch/SearchResults';
import PropertySearchFlow from './pages/UserSearch/SearchFlow';

// Property Owner
import WelcomeOwner from './pages/propertyOwner/WelcomeOwner';
import AddProperty from './pages/propertyOwner/addProperty';
import PropertyTypeStep from './pages/propertyOwner/PropertyTypeStep';
import PropertyInfoStep from './pages/propertyOwner/PropertyInfoStep';
import PropertyEquipmentsStep from './pages/propertyOwner/PropertyEquipmentsStep';
import PropertyPhotosStep from './pages/propertyOwner/PropertyPhotosStep';
import PropertyTitleStep from './pages/propertyOwner/PropertyTitleStep';
import PropertyDescriptionStep from './pages/propertyOwner/PropertyDescriptionStep';
import PropertyPriceStep from './pages/propertyOwner/PropertyPriceStep';
import PropertyDocumentsStep from './pages/propertyOwner/PropertyDocumentsStep';
import PropertySummary from './pages/propertyOwner/PropertySummary';
import PublishProperty from './pages/propertyOwner/PublishProperty';
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
      <Routes>
        {/* Explore layout */}
        <Route path="/" element={<ExploreLayout />}>
          <Route index element={<Explore />} />
          <Route path="restauration" element={<Restauration />} />
          <Route path="packages" element={<Packages />} />
        </Route>

        <Route path="/search" element={<PropertySearchFlow />} />
        <Route path="/search/results" element={<SearchResults />} />
        
        {/* General / Auth */}
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/signup" element={<SignUpScreen />} />
        <Route path="/signup-confirmation" element={<SignupScreenConf />} />
        <Route path="/identification" element={<IdentificationScreen />} />
        <Route
          path="/complete-profile"
          element={<ProfileSignupScreen signupData={signupData} setSignupData={setSignupData} />}
        />
        <Route path="/password-recovery" element={<PasswordRecoveryScreen />} />
        <Route path="/password-recovery-confirmation" element={<PasswordRecoveryConfirmation />} />
        <Route path="/reset-password/:token" element={<ResetPasswordScreen />} />
        <Route path="/welcomescreen" element={<WelcomeScreen />} />

        {/* User sections */}
        <Route path="/profile" element={<Profile />} />
        <Route path="/edit-profile" element={<EditProfileScreen />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/partner-welcome" element={<HomeIntermédiaire />} />
        <Route path="/VillaMakarska" element={<VillaMakarska />} />
        <Route path="/property/:id" element={<PropertyPreview />} />
        <Route path="/owner/:id" element={<OwnerDetails />} />
        <Route path="/owner/:ownerId" element={<CoHostPropertyPreview />} />

        {/* Co-hosting routes - ADD THIS SECTION */}
        <Route path="/cohosting-explore" element={<CohostingExplore />} />
        <Route path="/cohosting-preview/:propertyId" element={<CoHostPropertyPreview />} />
        <Route path="/partner/cohosting-management" element={<PartnerCohostingManagement />} />
        

        {/* Messages */}
        <Route path="/inbox" element={<Inbox />} />
        <Route path="/notifications" element={<NotificationCenter />} />
        <Route path="/chat/:sender" element={<ChatPage />} />

        {/* Modals */}
        <Route path="/search-date" element={<DateSelectionScreensWrapper />} />
        <Route path="/search-guests" element={<GuestsSelectionScreenWrapper />} />

        {/* Property owner flow */}
        <Route path="/owner-welcome" element={<WelcomeOwner />} />
        <Route path="/add-property" element={<AddProperty />} />
        <Route path="/property-type" element={<PropertyTypeStep />} />
        <Route path="/property-info" element={<PropertyInfoStep />} />
        <Route path="/property-equipments" element={<PropertyEquipmentsStep />} />
        <Route path="/property-photos" element={<PropertyPhotosStep />} />
        <Route path="/property-title" element={<PropertyTitleStep />} />
        <Route path="/property-description" element={<PropertyDescriptionStep />} />
        <Route path="/property-price" element={<PropertyPriceStep />} />
        <Route path="/property-documents" element={<PropertyDocumentsStep />} />
        <Route path="/property-summary" element={<PropertySummary />} />
        <Route path="/publish-property/:id" element={<PublishProperty />} />

        <Route path="/my-properties" element={<MyProperties />} />
        <Route path="/owner/income" element={<OwnerIncomePage />} />
        <Route path="/owner/reservations/:propertyId" element={<ReservationPage />} />
        <Route path="/test-reservations" element={<div className="p-6"><h1>Test Route Works!</h1></div>} />

        {/* Booking */}
        <Route path="/booking/request/:propertyId" element={<BookingRequest />} />
        <Route path="/booking/confirm/:propertyId" element={<BookingConfirm />} />
        <Route path="/booking/:bookingId" element={<BookingDetails />} />
        <Route path="/package-booking/:bookingId" element={<PackageBookingDetails />} />
        <Route path="/my-bookings" element={<MyBookings />} />

        {/* Intermediate */}
        <Route path="/create-package" element={<PackageCreationFlow />} />
        <Route path="/select-property" element={<SelectPropertyStep />} />
        <Route path="/packages/:packageId/book" element={<PackageBooking />} />
        <Route path='/performance' element={<Performance />} />
        <Route path="/data" element={<DocumentUpload />} />
        <Route path="/acceuill" element={<HomeIntermédiaire />} />

      </Routes>

      <ConditionalNavbar />
    </PropertyCreationProvider>
  );
}

export default App;