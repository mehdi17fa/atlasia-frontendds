# B2B Frontend Implementation Documentation

## Overview

This document provides comprehensive documentation for the B2B (Business-to-Business) frontend implementation in the Atlasia application. It covers all components, pages, routing, styling, and user interactions related to B2B functionality.

---

## Table of Contents

1. [Components Overview](#components-overview)
2. [Signup Flow Components](#signup-flow-components)
3. [B2B Profile Page](#b2b-profile-page)
4. [Navigation & Routing](#navigation--routing)
5. [Styling & Design System](#styling--design-system)
6. [State Management](#state-management)
7. [API Integration](#api-integration)
8. [Form Validation](#form-validation)
9. [User Experience Flow](#user-experience-flow)
10. [Component Details](#component-details)

---

## Components Overview

### Modified Components

1. **SignUpWizard.js** - Main signup wizard with B2B support
2. **IdentificationScreen.js** - Role selection screen
3. **CompleteProfileScreen.js** - Profile completion screen
4. **LogInScreen.js** - Login screen with B2B redirect

### New Components

1. **B2BProfile.js** - Dedicated B2B profile page

---

## Signup Flow Components

### 1. SignUpWizard Component

**File:** `src/pages/SignUp/SignUpWizard.js`

**Purpose:** Main signup wizard that handles the complete registration process including B2B role selection and profile completion.

#### Component Structure

```javascript
Steps:
1. Step 0: Credentials (email, password)
2. Step 1: Email Verification (6-digit code)
3. Step 2: Role Selection (includes B2B option)
4. Step 3: Profile Completion (includes B2B fields)
```

#### Key Features

**Role Selection (Step 2):**
- Displays 4 role options: Tourist, Owner, Intermediate, B2B
- B2B option uses `BuildingOfficeIcon` from heroicons
- Same styling as other role buttons
- Selected state with green background

**B2B Fields (Step 3):**
- Conditionally rendered when `profileType === 'b2b'`
- Three additional fields:
  - Business Name (text input)
  - Service Provided (dropdown)
  - Location (text input)

#### State Management

```javascript
// Role selection
const [profileType, setProfileType] = useState('');

// B2B specific fields
const [businessName, setBusinessName] = useState('');
const [serviceProvided, setServiceProvided] = useState('');
const [location, setLocation] = useState('');

// Basic profile fields
const [fullName, setFullName] = useState('');
const [phoneNumber, setPhoneNumber] = useState('');
const [selectedCountry, setSelectedCountry] = useState({...});
```

#### Validation

```javascript
const isProfileFormValid = fullName.trim() !== '' && 
                          phoneNumber.length === getNationalLength(selectedCountry);

const isB2BFormValid = isProfileFormValid && 
                       (profileType !== 'b2b' || 
                        (businessName.trim() !== '' && 
                         serviceProvided && 
                         location.trim() !== ''));
```

#### API Calls

**Set Role:**
```javascript
await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/set-role`, {
  email,
  role: 'b2b'
});
```

**Complete Profile:**
```javascript
const formData = new FormData();
formData.append('email', email);
formData.append('fullName', fullName);
formData.append('phoneNumber', selectedCountry.code + phoneNumber);
formData.append('country', selectedCountry.name);
formData.append('profileType', profileType);

if (profileType === 'b2b') {
  formData.append('businessName', businessName);
  formData.append('serviceProvided', serviceProvided);
  formData.append('location', location);
}

const response = await axios.post(
  `${process.env.REACT_APP_API_URL}/api/auth/complete-profile`,
  formData,
  { headers: { 'Content-Type': 'multipart/form-data' } }
);
```

#### Navigation

```javascript
if (profileType === 'b2b') {
  navigate('/b2b-profile', { replace: true });
}
```

---

### 2. IdentificationScreen Component

**File:** `src/pages/SignUp/IdentificationScreen.js`

**Purpose:** Standalone role selection screen (legacy route).

#### Features

- Displays 4 role options including B2B
- B2B button with `BuildingOfficeIcon`
- Calls `/api/auth/set-role` endpoint
- Navigates to `/complete-profile?type=b2b`

#### Code Structure

```javascript
const handleProfileSelect = async (profileType) => {
  const email = localStorage.getItem("signupEmail");
  await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/set-role`, {
    email,
    role: profileType.toLowerCase()
  });
  navigate(`/complete-profile?type=${profileType.toLowerCase()}`);
};
```

---

### 3. CompleteProfileScreen Component

**File:** `src/pages/SignUp/CompleteProfileScreen.js`

**Purpose:** Standalone profile completion screen (legacy route).

#### Features

- Reads profile type from URL query parameter
- Conditionally shows B2B fields
- Modern styled form with labels and placeholders
- Same validation and API integration as SignUpWizard

#### Styling

- Gradient background (`bg-gradient-to-br from-gray-50 to-white`)
- Centered card layout with shadow
- Clean input fields with focus states
- Section separators for B2B fields

---

## B2B Profile Page

### B2BProfile Component

**File:** `src/pages/Profile/B2BProfile.js`

**Purpose:** Dedicated profile page for B2B users to view and edit their business information.

#### Component Structure

```javascript
┌─────────────────────────────────┐
│  Header (Back Button + Title)   │
├─────────────────────────────────┤
│  Business Info Card             │
│  ├─ Business Icon + Name        │
│  ├─ Service Label               │
│  └─ Edit Button                 │
│                                 │
│  Personal Information Section   │
│  ├─ Full Name                   │
│  ├─ Email (read-only)           │
│  ├─ Phone Number                │
│  └─ Country                     │
│                                 │
│  Business Information Section   │
│  ├─ Business Name               │
│  ├─ Service Provided            │
│  └─ Location                    │
│                                 │
│  Action Buttons (Edit Mode)     │
│  ├─ Cancel Button               │
│  └─ Save Button                 │
└─────────────────────────────────┘
```

#### Key Features

1. **View Mode**
   - Displays all information in read-only format
   - Clean, organized layout
   - "Modifier" button to enter edit mode

2. **Edit Mode**
   - All fields become editable (except email)
   - Inline editing with input fields
   - Save and Cancel buttons
   - Loading state during save

3. **Role Protection**
   - Checks if user role is 'b2b'
   - Shows error message if accessed by non-B2B users
   - Redirects to general profile if needed

#### State Management

```javascript
const [isEditing, setIsEditing] = useState(false);
const [loading, setLoading] = useState(false);
const [formData, setFormData] = useState({
  fullName: '',
  email: '',
  phoneNumber: '',
  country: '',
  businessName: '',
  serviceProvided: '',
  location: ''
});
```

#### Service Labels Mapping

```javascript
const serviceLabels = {
  restaurant: 'Restaurant',
  catering: 'Traiteur',
  transportation: 'Transport',
  tours: 'Tours',
  activities: 'Activités',
  cleaning: 'Nettoyage',
  maintenance: 'Maintenance',
  'event-planning': 'Planification d\'événements',
  photography: 'Photographie',
  other: 'Autre'
};
```

#### API Integration

**Update Profile:**
```javascript
const handleSave = async () => {
  setLoading(true);
  try {
    const response = await axios.put(
      `${process.env.REACT_APP_API_URL}/api/auth/update-profile`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('atlasia_access_token')}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (response.data.user) {
      setUser(response.data.user);
      setIsEditing(false);
      alert('Profil mis à jour avec succès!');
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    alert('Erreur lors de la mise à jour du profil. Veuillez réessayer.');
  } finally {
    setLoading(false);
  }
};
```

#### Styling Features

- **Layout:**
  - Gradient background (`bg-gradient-to-br from-gray-50 to-white`)
  - Centered content with max-width container
  - Card-based design with shadows

- **Sections:**
  - Clear section separators with borders
  - Section headers with icons
  - Consistent spacing (space-y-4, space-y-6)

- **Input Fields:**
  - Border-2 with focus states
  - Green focus ring (`focus:ring-green-200`)
  - Rounded corners (`rounded-xl`)
  - Padding for comfortable interaction

- **Buttons:**
  - Green primary buttons (`bg-green-700`)
  - Hover effects and transitions
  - Icon support with heroicons
  - Loading states

---

## Navigation & Routing

### App.js Routes

**File:** `src/App.js`

#### Route Configuration

```javascript
// B2B Profile Route (Protected)
<Route 
  path="/b2b-profile" 
  element={
    <ProtectedRoute allowedRoles={['b2b']}>
      <B2BProfile />
    </ProtectedRoute>
  } 
/>

// General Profile Route (Updated to include B2B)
<Route 
  path="/profile" 
  element={
    <ProtectedRoute allowedRoles={['owner', 'partner', 'intermediate', 'tourist', 'user', 'b2b']}>
      <Profile />
    </ProtectedRoute>
  } 
/>
```

#### ProtectedRoute Component

The `ProtectedRoute` component ensures:
- User is authenticated
- User has the correct role (`allowedRoles`)
- Redirects to login if not authenticated
- Redirects to appropriate page if wrong role

---

### Navigation Logic

#### After Signup

**SignUpWizard.js & CompleteProfileScreen.js:**
```javascript
if (profileType === 'b2b') {
  navigate('/b2b-profile', { replace: true });
}
```

#### After Login

**LogInScreen.js:**
```javascript
if (response.data.user.role === 'b2b') {
  navigate(targetUrl || '/b2b-profile');
}
```

**Navigation Priority:**
1. Check for `returnUrl` query parameter
2. Check for `fromLocation` state
3. Check for `currentPageLocation`
4. Default to role-specific page:
   - Owner → `/owner-welcome`
   - Partner/Intermediate → `/partner-welcome`
   - B2B → `/b2b-profile`
   - Others → `/`

---

## Styling & Design System

### Color Scheme

The B2B implementation follows the existing Atlasia design system:

- **Primary Green:** `green-700`, `green-800` (buttons, accents)
- **Light Green:** `green-50`, `green-100` (backgrounds, hovers)
- **Gray Scale:** `gray-50`, `gray-200`, `gray-600`, `gray-700`, `gray-900`
- **Focus States:** `green-600`, `ring-green-200`

### Typography

- **Headings:**
  - H1: `text-3xl font-bold text-green-800`
  - H2: `text-2xl font-bold text-gray-900`
  - H3: `text-lg font-semibold text-gray-900`

- **Body Text:**
  - Regular: `text-gray-700`
  - Muted: `text-gray-600`
  - Placeholder: `placeholder-gray-400`

### Component Styling Patterns

#### Input Fields

```css
/* Standard Input */
className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl 
          outline-none focus:border-green-600 focus:ring-2 
          focus:ring-green-200 transition-all placeholder-gray-400"
```

#### Buttons

```css
/* Primary Button */
className="bg-green-700 hover:bg-green-800 text-white 
          rounded-xl py-4 px-12 transition-all transform 
          hover:shadow-lg hover:scale-105"

/* Secondary Button */
className="bg-gray-200 hover:bg-gray-300 text-gray-800 
          rounded-xl py-3 px-6 transition-colors"
```

#### Cards

```css
/* Card Container */
className="bg-white rounded-2xl shadow-xl p-8"
```

#### Sections

```css
/* Section Header */
className="text-lg font-semibold text-gray-900 mb-4 pb-2 
          border-b-2 border-gray-200"
```

---

## State Management

### Context Usage

#### AuthContext

**Import:**
```javascript
import { AuthContext } from '../../context/AuthContext';
```

**Usage:**
```javascript
const { user, setUser, login } = useContext(AuthContext);
```

**Functions Used:**
- `user` - Current user data
- `setUser` - Update user in context
- `login` - Login function that updates context and localStorage

#### Token Storage

**Import:**
```javascript
import { tokenStorage } from '../../utils/tokenStorage';
```

**Usage:**
```javascript
tokenStorage.setTokens(user, accessToken, refreshToken);
```

---

## API Integration

### API Base URL

All API calls use:
```javascript
process.env.REACT_APP_API_URL
```

### Authentication Headers

For protected endpoints:
```javascript
headers: {
  'Authorization': `Bearer ${localStorage.getItem('atlasia_access_token')}`,
  'Content-Type': 'application/json', // or 'multipart/form-data'
}
```

### API Endpoints Used

1. **Set Role:** `POST /api/auth/set-role`
2. **Complete Profile:** `POST /api/auth/complete-profile`
3. **Login:** `POST /api/auth/login`
4. **Update Profile:** `PUT /api/auth/update-profile`
5. **Get Current User:** `GET /api/auth/me`

---

## Form Validation

### Client-Side Validation

#### Required Fields

**Basic Profile:**
- Full Name (non-empty, no numbers)
- Phone Number (matches country's national length)

**B2B Profile:**
- Business Name (non-empty)
- Service Provided (selected from dropdown)
- Location (non-empty)

#### Validation Logic

```javascript
// Basic validation
const isProfileFormValid = 
  fullName.trim() !== '' && 
  phoneNumber.length === getNationalLength(selectedCountry);

// B2B validation
const isB2BFormValid = 
  isProfileFormValid && 
  (profileType !== 'b2b' || 
   (businessName.trim() !== '' && 
    serviceProvided && 
    location.trim() !== ''));
```

#### Validation Feedback

- Disabled submit button when invalid
- Visual feedback (gray button = disabled, green = enabled)
- Error messages displayed as alerts
- Inline validation (real-time)

---

## User Experience Flow

### Complete B2B Signup Flow

```
1. User visits /signup
   ↓
2. Step 0: Enter email & password
   ↓
3. Step 1: Enter verification code (from email)
   ↓
4. Step 2: Select role → Click "B2B"
   ↓
5. Step 3: Complete profile
   - Full Name (required)
   - Phone Number (required)
   - Country (required)
   - Business Name (required for B2B)
   - Service Provided (required for B2B)
   - Location (required for B2B)
   ↓
6. Submit form
   ↓
7. Redirected to /b2b-profile
   ↓
8. View B2B profile with all information
```

### B2B Login Flow

```
1. User visits /login
   ↓
2. Enter email & password
   ↓
3. Click "Log In"
   ↓
4. Authentication successful
   ↓
5. Check user role
   ↓
6. If role === 'b2b' → Redirect to /b2b-profile
   ↓
7. View B2B profile
```

### B2B Profile Edit Flow

```
1. User on /b2b-profile
   ↓
2. Click "Modifier" button
   ↓
3. Enter edit mode
   - All fields become editable
   - Save/Cancel buttons appear
   ↓
4. Edit fields
   ↓
5a. Click "Enregistrer"
   - API call to update profile
   - Loading state
   - Success message
   - Exit edit mode
   ↓
5b. Click "Annuler"
   - Reset form to original values
   - Exit edit mode
```

---

## Component Details

### BuildingOfficeIcon

**Source:** `@heroicons/react/24/outline`

**Usage:**
- B2B role selection buttons
- B2B profile page header

**Styling:**
```javascript
<BuildingOfficeIcon className="w-8 h-8 text-green-800 group-hover:text-white" />
```

### Edit Mode Icons

**PencilIcon:** Enter edit mode
```javascript
<PencilIcon className="w-5 h-5" />
```

**CheckIcon:** Save changes
```javascript
<CheckIcon className="w-5 h-5" />
```

**XMarkIcon:** Cancel edit
```javascript
<XMarkIcon className="w-5 h-5" />
```

---

## Error Handling

### Form Submission Errors

```javascript
try {
  // API call
} catch (error) {
  console.error('Error:', error);
  alert(error.response?.data?.message || 'Failed. Please try again.');
}
```

### Validation Errors

- Disabled submit button prevents invalid submissions
- Visual feedback (gray button = invalid)
- Client-side validation before API call

### Network Errors

- Try-catch blocks around all API calls
- User-friendly error messages
- Console logging for debugging

---

## Responsive Design

### Breakpoints Used

- `sm:` - 640px and up (small tablets)
- `md:` - 768px and up (tablets)
- `lg:` - 1024px and up (desktops)

### Responsive Patterns

```javascript
// Flex direction changes on mobile
className="flex flex-col sm:flex-row"

// Width adjustments
className="w-full sm:w-32 lg:w-36"

// Padding adjustments
className="p-4 md:p-10"
```

---

## Accessibility

### Form Labels

All inputs have associated labels:
```javascript
<label className="block text-sm font-medium text-gray-700 mb-2">
  Nom complet
</label>
<input ... />
```

### Button States

- Disabled state with `disabled` attribute
- Visual feedback for disabled state
- Loading states during API calls

### Keyboard Navigation

- Tab order follows logical flow
- Enter key submits forms
- Escape key (could be added for cancel)

---

## Performance Considerations

### State Management

- Local state for form data
- Context for user data (shared across app)
- No unnecessary re-renders

### API Calls

- Single API call for profile completion
- Single API call for profile update
- No redundant requests

### Code Splitting

- Components are imported normally (not lazy-loaded)
- Could be optimized with React.lazy() for large apps

---

## Testing Checklist

### Manual Testing

- [ ] B2B button appears in role selection
- [ ] B2B button has icon
- [ ] Selecting B2B shows B2B fields
- [ ] Form validation works
- [ ] Submit button disabled when invalid
- [ ] Profile completion redirects to /b2b-profile
- [ ] Login redirects B2B users to /b2b-profile
- [ ] B2B profile page displays all information
- [ ] Edit mode works correctly
- [ ] Save updates profile
- [ ] Cancel resets form
- [ ] Non-B2B users cannot access /b2b-profile
- [ ] Error messages display correctly
- [ ] Loading states work

### Browser Testing

- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browsers

### Responsive Testing

- [ ] Mobile (320px - 640px)
- [ ] Tablet (640px - 1024px)
- [ ] Desktop (1024px+)

---

## Common Issues & Solutions

### Issue: B2B fields not showing

**Solution:**
- Check that `profileType === 'b2b'`
- Verify role was set correctly
- Check localStorage for `profileType`

### Issue: Redirect not working

**Solution:**
- Verify user role in response
- Check navigation logic
- Ensure route exists in App.js

### Issue: Profile update fails

**Solution:**
- Check authentication token
- Verify API endpoint URL
- Check network tab for errors
- Ensure all required fields are provided

### Issue: Validation not working

**Solution:**
- Check validation logic
- Verify form state
- Check required field values

---

## Future Enhancements

### Potential Improvements

1. **Image Upload**
   - Business logo upload
   - Profile picture for B2B users

2. **Service Management**
   - Multiple services per business
   - Service availability calendar

3. **Business Documents**
   - Upload business licenses
   - Verification documents

4. **Analytics**
   - Service performance metrics
   - Business dashboard

5. **Notifications**
   - Email notifications
   - In-app notifications

---

## File Structure

```
atlasia-frontendds/
├── src/
│   ├── pages/
│   │   ├── SignUp/
│   │   │   ├── SignUpWizard.js (modified)
│   │   │   ├── IdentificationScreen.js (modified)
│   │   │   └── CompleteProfileScreen.js (modified)
│   │   ├── LogIn/
│   │   │   └── LogInScreen.js (modified)
│   │   └── Profile/
│   │       └── B2BProfile.js (new)
│   ├── App.js (modified)
│   └── context/
│       └── AuthContext.js (used)
```

---

## Dependencies

### Required Packages

- `react` - React framework
- `react-router-dom` - Routing
- `axios` - HTTP client
- `@heroicons/react` - Icons

### Imported Icons

```javascript
import { BuildingOfficeIcon } from '@heroicons/react/24/outline';
import { PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
```

---

## Code Examples

### Complete B2B Signup Example

```javascript
// Step 1: Register
const response = await axios.post('/api/auth/register-step1', {
  email: 'b2b@example.com',
  password: 'SecurePass123!'
});

// Step 2: Verify
await axios.post('/api/auth/verify', {
  email: 'b2b@example.com',
  code: '123456'
});

// Step 3: Set Role
await axios.post('/api/auth/set-role', {
  email: 'b2b@example.com',
  role: 'b2b'
});

// Step 4: Complete Profile
const formData = new FormData();
formData.append('email', 'b2b@example.com');
formData.append('fullName', 'John Doe');
formData.append('phoneNumber', '+212612345678');
formData.append('country', 'Morocco');
formData.append('profileType', 'b2b');
formData.append('businessName', 'Atlasia Services LLC');
formData.append('serviceProvided', 'restaurant');
formData.append('location', 'Ifrane, Morocco');

const response = await axios.post('/api/auth/complete-profile', formData);
// Redirects to /b2b-profile
```

### B2B Profile Update Example

```javascript
const handleSave = async () => {
  const formData = {
    fullName: 'Jane Doe',
    phoneNumber: '+212987654321',
    country: 'Morocco',
    businessName: 'Updated Business Name',
    serviceProvided: 'catering',
    location: 'Casablanca, Morocco'
  };

  const response = await axios.put('/api/auth/update-profile', formData, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
};
```

---

## Support & Maintenance

### Debugging Tips

1. **Check Console Logs**
   - All API calls log to console
   - User data logged after login
   - Profile updates logged

2. **Check Network Tab**
   - Verify API calls are made
   - Check response status codes
   - Inspect request/response payloads

3. **Check LocalStorage**
   - `atlasia_access_token` - Access token
   - `atlasia_refresh_token` - Refresh token
   - `atlasia_user` - User data
   - `profileType` - Selected profile type

### Common Debugging Commands

```javascript
// Check user data
console.log(user);

// Check form data
console.log(formData);

// Check validation
console.log(isB2BFormValid);

// Check API response
console.log(response.data);
```

---

## Version History

- **v1.0** - Initial B2B Frontend Implementation
  - B2B signup flow
  - B2B profile page
  - Login redirect
  - Profile editing
  - Modern styling

---

## Related Documentation

- `B2B_IMPLEMENTATION_DOCUMENTATION.md` - Full implementation docs
- `B2B_SIGNUP_DOCUMENTATION.md` - API documentation
- Component README files
- Design system documentation



