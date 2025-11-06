import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../api';
import S3Image from '../../components/S3Image';
import S3ImageUpload from '../../components/S3ImageUpload';

// Helpers: availability day computations (module scope so all components can use them)
// Return a Set of allowed weekday indices 0..6 (0=Lun ... 6=Dim)
export const normalizePropertyAllowedDays = (property) => {
  if (!property) return new Set([0,1,2,3,4,5,6]);
  const fromStrings = property.availabilityDays || property.availableDays || property.daysAvailable;
  const fromObj = property.availability?.days || property.availability?.daysOfWeek;
  let raw = fromStrings || fromObj || [0,1,2,3,4,5,6];
  const map = { mon:0, monday:0, tue:1, tuesday:1, wed:2, wednesday:2, thu:3, thursday:3, fri:4, friday:4, sat:5, saturday:5, sun:6, sunday:6 };
  const result = new Set();
  (Array.isArray(raw) ? raw : [raw]).forEach((d) => {
    if (typeof d === 'number') {
      if (d >= 0 && d <= 6) result.add(d);
    } else if (typeof d === 'string') {
      const key = d.trim().toLowerCase();
      const short = key.slice(0,3);
      if (map[key] !== undefined) result.add(map[key]);
      else if (map[short] !== undefined) result.add(map[short]);
    }
  });
  return result.size ? result : new Set([0,1,2,3,4,5,6]);
};

// Compute weekday indices present in a date range (inclusive)
export const getRangeDays = (start, end) => {
  if (!start || !end) return new Set([0,1,2,3,4,5,6]);
  try {
    const s = new Date(start);
    const e = new Date(end);
    if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime()) || s > e) return new Set([0,1,2,3,4,5,6]);
    const set = new Set();
    const cur = new Date(s);
    while (cur <= e) {
      const jsDay = cur.getDay(); // 0=Sun..6=Sat
      const idx = jsDay === 0 ? 6 : jsDay - 1; // 0=Lun..6=Dim
      set.add(idx);
      cur.setDate(cur.getDate() + 1);
    }
    return set;
  } catch {
    return new Set([0,1,2,3,4,5,6]);
  }
};

// Format an array of ISO date strings into compact French ranges
export const formatDatesAsRanges = (isoDates) => {
  if (!Array.isArray(isoDates) || isoDates.length === 0) return '';
  // unique + sort
  const dates = Array.from(new Set(isoDates)).sort();
  const toLocale = (iso) => new Date(iso).toLocaleDateString();
  const ranges = [];
  let start = dates[0];
  let prev = dates[0];
  const isNextDay = (a, b) => {
    const da = new Date(a);
    const db = new Date(b);
    const next = new Date(da);
    next.setDate(da.getDate() + 1);
    return next.toISOString().slice(0,10) === b;
  };
  for (let i = 1; i < dates.length; i++) {
    const cur = dates[i];
    if (!isNextDay(prev, cur)) {
      ranges.push([start, prev]);
      start = cur;
    }
    prev = cur;
  }
  ranges.push([start, prev]);
  return ranges
    .map(([s, e]) => (s === e ? `${toLocale(s)}` : `${toLocale(s)} → ${toLocale(e)}`))
    .join(', ');
};

const CreatePackageForm = ({ onSuccess, onCancel }) => {
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Form data state
  const [formData, setFormData] = useState({
    property: '',
    restaurants: [],
    activities: [],
    services: [],
    startDate: '',
    endDate: '',
    name: '',
    description: '',
    totalPrice: ''
  });

  // Expanded section state
  const [expandedSection, setExpandedSection] = useState(null);

  // Properties that partner can cohost
  const [availableProperties, setAvailableProperties] = useState([]);
  const [loadingProperties, setLoadingProperties] = useState(true);

  // Load partner's properties on mount
  useEffect(() => {
    fetchPartnerProperties();
  }, []);

  const fetchPartnerProperties = async () => {
    try {
      console.log('🔍 Fetching properties with token:', token ? 'EXISTS' : 'MISSING');
      
      // Check if token exists
      if (!token) {
        setError('Veuillez vous connecter pour accéder à vos propriétés');
        setLoadingProperties(false);
        return;
      }
      
      const response = await api.get('/api/partner/my-properties');
      
      console.log('✅ Properties data received:', response.data);
      // Filter out any null/undefined properties and ensure they have _id
      const validProperties = (response.data.properties || []).filter(property => 
        property && property._id && typeof property._id === 'string'
      );
      console.log('✅ Valid properties after filtering:', validProperties);
      setAvailableProperties(validProperties);
    } catch (err) {
      console.error('❌ Fetch error:', err);
      // The API interceptor will handle 401 errors and token refresh automatically
      setError(`Erreur lors du chargement des propriétés: ${err.message}`);
    } finally {
      setLoadingProperties(false);
    }
  };

  const handleNext = () => {
    // Check how many steps we have
    const totalSteps = 6; // Property, Items, Dates, Info, Price, Review
    
    // Validate current step before moving forward
    if (!validateStep(currentStep)) {
      setError(`Veuillez compléter l'étape ${currentStep} avant de continuer`);
      return;
    }
    
    if (currentStep < totalSteps) {
      console.log(`Moving from step ${currentStep} to step ${currentStep + 1}`);
      setCurrentStep(currentStep + 1);
      setError(''); // Clear any previous errors
    } else if (currentStep === totalSteps) {
      // On the last step (step 6), clicking "Suivant" should trigger publish
      handlePublish();
    }
  };

  const handleStepClick = (stepNumber) => {
    if (stepNumber <= currentStep) {
      setCurrentStep(stepNumber);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
  };

  // Item management functions
  const addItem = (category, item) => {
    if (!item.name) return;
    
    // Allow price to be 0 (for B2B items that can be priced later)
    const price = item.price !== undefined && item.price !== null ? parseFloat(item.price) : 0;
    
    setFormData(prev => ({
      ...prev,
      [category]: [...prev[category], { ...item, price: price }]
    }));
  };

  const removeItem = (category, index) => {
    setFormData(prev => ({
      ...prev,
      [category]: prev[category].filter((_, i) => i !== index)
    }));
  };

  const editItem = (category, index, updatedItem) => {
    setFormData(prev => ({
      ...prev,
      [category]: prev[category].map((item, i) => 
        i === index ? { ...updatedItem, price: parseFloat(updatedItem.price) } : item
      )
    }));
  };

  const handleToggleExpanded = (category, shouldExpand) => {
    if (shouldExpand) {
      setExpandedSection(category);
    } else {
      setExpandedSection(null);
    }
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        return formData.property !== '';
      case 2:
        return formData.restaurants.length > 0 || formData.activities.length > 0 || formData.services.length > 0;
      case 3:
        return formData.startDate !== '' && formData.endDate !== '';
      case 4:
        return formData.name.trim() !== '' && formData.description.trim() !== '';
      case 5:
        return formData.totalPrice && parseFloat(formData.totalPrice) > 0;
      case 6:
        return true; // Review step is always valid
      default:
        return true;
    }
  };

  const handleSaveDraft = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Prepare payload for draft saving
      const payload = { ...formData };
      
      // Convert price to number if provided
      if (payload.totalPrice) {
        const price = parseFloat(payload.totalPrice);
        if (!isNaN(price)) {
          payload.totalPrice = price;
        } else {
          delete payload.totalPrice; // Remove invalid price
        }
      }

      console.log('💾 Saving draft with payload:', payload);
      
      const apiUrl = process.env.REACT_APP_API_URL;
      const response = await fetch(`${apiUrl}/api/packages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      console.log('📡 Draft save response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Draft saved successfully:', data);
        
        // Show success message
        setSuccessMessage('Brouillon enregistré avec succès!');
        
        // Navigate to partner dashboard after successful draft save
        setTimeout(() => {
          navigate('/partner-welcome');
        }, 1500);
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Failed to save draft' }));
        console.error('❌ Draft save error:', response.status, errorData);
        
        // Handle token expiration
        if (response.status === 401) {
          setError('Votre session a expiré. Veuillez vous reconnecter.');
          // Use the proper logout function instead of manual clearing
          if (window.authLogout) {
            window.authLogout();
          } else {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            localStorage.removeItem('refreshToken');
          }
          setTimeout(() => {
            navigate('/login');
          }, 2000);
        } else {
          setError(errorData.message || 'Échec de l\'enregistrement du brouillon');
        }
      }
    } catch (err) {
      console.error('❌ Draft save error:', err);
      setError(`Erreur lors de l'enregistrement du brouillon: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublish = async () => {
    // More detailed validation
    const validationErrors = [];
    if (!validateStep(1)) validationErrors.push('Property selection required');
    if (!validateStep(2)) validationErrors.push('At least one item (restaurant, activity, or service) required');
    if (!validateStep(3)) validationErrors.push('Start date and end date required');
    if (!validateStep(4)) validationErrors.push('Package name and description required');
    if (!validateStep(5)) validationErrors.push('Total price required');

    if (validationErrors.length > 0) {
      setError(`Please complete all required steps: ${validationErrors.join(', ')}`);
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      // Prepare payload with proper validation
      const payload = { ...formData };
      
      // Ensure totalPrice is a number
      if (payload.totalPrice) {
        payload.totalPrice = parseFloat(payload.totalPrice);
        if (isNaN(payload.totalPrice)) {
          throw new Error('Invalid price format');
        }
      }

      // Ensure dates are valid
      if (payload.startDate && payload.endDate) {
        const startDate = new Date(payload.startDate);
        const endDate = new Date(payload.endDate);
        if (startDate >= endDate) {
          throw new Error('End date must be after start date');
        }
      }

      // Ensure all required fields are present
      if (!payload.property) {
        throw new Error('Property selection is required');
      }
      if (!payload.startDate || !payload.endDate) {
        throw new Error('Start date and end date are required');
      }
      if (!payload.name || !payload.description) {
        throw new Error('Package name and description are required');
      }
      if (!payload.totalPrice || parseFloat(payload.totalPrice) <= 0) {
        throw new Error('Total price must be greater than 0');
      }
      if (payload.restaurants.length === 0 && payload.activities.length === 0 && payload.services.length === 0) {
        throw new Error('At least one item (restaurant, activity, or service) is required');
      }

      console.log('🚀 Creating package for publish with payload:', payload);
      
      const apiUrl = process.env.REACT_APP_API_URL;
      const createResponse = await fetch(`${apiUrl}/api/packages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      console.log('📡 Create response status:', createResponse.status);

      if (!createResponse.ok) {
        const errorData = await createResponse.json().catch(() => ({ message: 'Failed to create package' }));
        console.error('❌ Create error:', createResponse.status, errorData);
        throw new Error(errorData.message || 'Failed to create package');
      }

      const createData = await createResponse.json();
      console.log('✅ Package created:', createData);
      
      if (!createData.package || !createData.package._id) {
        throw new Error('Invalid response from server - no package ID');
      }
      
      // Check if package is ready to publish before attempting to publish
      const packageData = createData.package;
      console.log('📋 Package data:', {
        basicInfoCompleted: packageData.basicInfoCompleted,
        datesSet: packageData.datesSet,
        itemsAdded: packageData.itemsAdded,
        totalPrice: packageData.totalPrice,
        readyToPublish: packageData.readyToPublish,
        restaurants: packageData.restaurants?.length || 0,
        activities: packageData.activities?.length || 0,
        services: packageData.services?.length || 0
      });
      
      // Then publish it
      console.log('📢 Publishing package:', createData.package._id);
      const publishResponse = await fetch(`${apiUrl}/api/packages/${createData.package._id}/publish`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 Publish response status:', publishResponse.status);

      if (publishResponse.ok) {
        const publishData = await publishResponse.json();
        console.log('✅ Package published successfully:', publishData);
        
        // Show success message
        setSuccessMessage('Pack ajouté avec succès!');
        
        // Navigate to partner dashboard after successful publish
        setTimeout(() => {
          navigate('/partner-welcome');
        }, 1500);
      } else {
        const errorData = await publishResponse.json().catch(() => ({ message: 'Failed to publish package' }));
        console.error('❌ Publish error:', publishResponse.status, errorData);
        
        // Provide more detailed error message
        if (errorData.message === 'Package is not ready to publish') {
          const missingFields = [];
          if (!packageData.basicInfoCompleted) missingFields.push('name and description');
          if (!packageData.datesSet) missingFields.push('start date and end date');
          if (!packageData.itemsAdded) missingFields.push('at least one item');
          if (!packageData.totalPrice || packageData.totalPrice <= 0) missingFields.push('total price > 0');
          
          setError(`Package n'est pas prêt à être publié. Manque: ${missingFields.join(', ')}`);
        } else {
          // Handle token expiration
          if (publishResponse.status === 401) {
            setError('Votre session a expiré. Veuillez vous reconnecter.');
            // Use the proper logout function instead of manual clearing
            if (window.authLogout) {
              window.authLogout();
            } else {
              localStorage.removeItem('accessToken');
              localStorage.removeItem('user');
              localStorage.removeItem('refreshToken');
            }
            setTimeout(() => {
              navigate('/login');
            }, 2000);
          } else {
            setError(errorData.message || 'Échec de la publication du package');
          }
        }
      }
    } catch (err) {
      console.error('❌ Publish error:', err);
      setError(err.message || 'Erreur lors de la publication du package');
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    'Choisir Propriété',
    'Sélectionner Éléments',
    'Sélectionner Dates',
    'Informations De Base',
    'Définir Prix',
    'Réviser & Publier'
  ];

  // removed old weekday helpers (we now use concrete date selection)

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28">
        {/* Mobile-Optimized Progress Bar */}
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-6">
          <div className="mb-6">
            {/* Mobile Progress Steps - No scrolling, compact design */}
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, index) => (
            <div 
              key={index} 
                  className="flex flex-col items-center cursor-pointer flex-1 px-1"
              onClick={() => handleStepClick(index + 1)}
            >
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all duration-300 shadow-md ${
                index + 1 <= currentStep 
                      ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 transform hover:scale-105' 
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}>
                {index + 1}
              </div>
                  <span className="text-xs mt-1 sm:mt-2 text-gray-600 font-medium text-center leading-tight hidden sm:block">
                    {step}
                  </span>
                  {/* Mobile: Show French abbreviated step names */}
                  <span className="text-xs mt-1 text-gray-600 font-medium text-center leading-tight sm:hidden">
                    {(() => {
                      const frenchSteps = ['Propriété', 'Éléments', 'Dates', 'Infos', 'Prix', 'Publier'];
                      return frenchSteps[index] || step.split(' ')[0];
                    })()}
                  </span>
            </div>
          ))}
        </div>
            
            {/* Enhanced Progress Bar */}
            <div className="relative w-full bg-gray-200 rounded-full h-3 shadow-inner">
          <div 
                className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500 ease-out shadow-lg"
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
              >
                <div className="absolute right-0 top-0 w-3 h-3 bg-white rounded-full shadow-md transform translate-x-1 -translate-y-0.5"></div>
        </div>
      </div>

            {/* Progress Text */}
            <div className="text-center mt-3">
              <span className="text-sm font-medium text-gray-600">
                Step {currentStep} of {steps.length}
              </span>
              {/* Mobile: Show current step name */}
              <div className="mt-1 sm:hidden">
                <span className="text-sm font-semibold text-gray-800">
                  {steps[currentStep - 1]}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Error Display */}
      {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-red-800 text-sm font-medium">{error}</p>
              </div>
            </div>
        </div>
      )}

        {/* Success Message Display */}
      {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-green-800 text-sm font-medium">{successMessage}</p>
              </div>
            </div>
        </div>
      )}

        {/* Step Content - Enhanced Mobile Layout */}
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 min-h-96">
          {/* Step 1: Choose Property - Enhanced Mobile Design */}
        {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Choisir Propriété</h2>
                <p className="text-gray-600">Sélectionnez la propriété pour votre package</p>
              </div>
              
            {loadingProperties ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                  </div>
                <p className="text-gray-600 font-medium">Chargement de vos propriétés...</p>
                <p className="text-sm text-gray-500 mt-1">Veuillez patienter pendant que nous récupérons vos propriétés disponibles</p>
              </div>
            ) : availableProperties.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <p className="text-gray-600 font-medium">Aucune propriété disponible</p>
                  <p className="text-sm text-gray-500 mt-2">Vous devez d'abord être accepté comme co-hôte pour créer des packages.</p>
              </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {availableProperties.filter(property => property && property._id).map((property) => (
                  <div 
                    key={property._id}
                      className={`border-2 rounded-xl p-4 cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
                      formData.property === property._id
                          ? 'border-green-500 bg-green-50 shadow-lg scale-105'
                          : 'border-gray-200 hover:border-green-300 bg-white'
                    }`}
                    onClick={() => handleInputChange('property', property._id)}
                  >
                    {property.photos && property.photos.length > 0 && (
                      <S3Image 
                        src={property.photos[0]} 
                        alt={property.title}
                          className="w-full h-40 sm:h-32 object-cover rounded-lg mb-4 shadow-sm"
                        fallbackSrc="/placeholder.jpg"
                      />
                    )}
                      <div className="space-y-2">
                        <h3 className="font-semibold text-gray-900 text-lg">{property.title}</h3>
                        <div className="flex items-center text-sm text-gray-600">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {property.localisation?.city || 'Localisation non spécifiée'}
                        </div>
                        {formData.property === property._id && (
                          <div className="flex items-center text-green-600 text-sm font-medium">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Sélectionné
                          </div>
                        )}
                      </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

          {/* Step 2: Select Items - Enhanced Mobile Design */}
        {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Sélectionner Éléments</h2>
                <p className="text-gray-600">Ajoutez des restaurants, activités ou services à votre package</p>
                <p className="text-sm text-gray-500 mt-1">Au moins un élément est requis</p>
              </div>

              {/* Live preview of selected items */}
              {(formData.restaurants.length > 0 || formData.activities.length > 0 || formData.services.length > 0) && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 sm:p-5">
                  <h3 className="text-lg font-semibold text-green-800 mb-3">Éléments ajoutés</h3>
                  <div className="space-y-4">
                    {/* Restaurants preview */}
                    {formData.restaurants.length > 0 && (
                      <div>
                        <div className="text-sm font-medium text-green-700 mb-2">Restaurants</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {formData.restaurants.map((item, index) => (
                            <div key={`rest-${index}`} className="bg-white border border-gray-200 rounded-lg p-3 flex items-start gap-3">
                              {item.thumbnail && (
                                <S3Image src={item.thumbnail} alt={item.name} className="w-12 h-12 object-cover rounded-md" fallbackSrc="/placeholder.jpg" />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <div className="font-medium text-gray-900 truncate">{item.name}</div>
                                  {item.isB2B && (
                                    <span className="inline-flex items-center px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                      B2B
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm text-gray-600 truncate">{item.price || 0} MAD</div>
                                {item.scheduledTime && (
                                  <div className="text-xs text-blue-600 mt-1 flex items-center">
                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {item.scheduledTime}
                                  </div>
                                )}
                                {item.availableDates && item.availableDates.length > 0 && (
                                  <div className="text-xs text-green-700 mt-1">
                                    Dates: {formatDatesAsRanges(item.availableDates)}
                                  </div>
                                )}
                              </div>
                              <button onClick={() => removeItem('restaurants', index)} className="text-red-600 bg-red-100 hover:bg-red-200 rounded-md px-2 py-1 text-xs font-medium">Retirer</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Activities preview */}
                    {formData.activities.length > 0 && (
                      <div>
                        <div className="text-sm font-medium text-green-700 mb-2">Activités</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {formData.activities.map((item, index) => (
                            <div key={`act-${index}`} className="bg-white border border-gray-200 rounded-lg p-3 flex items-start gap-3">
                              {item.thumbnail && (
                                <S3Image src={item.thumbnail} alt={item.name} className="w-12 h-12 object-cover rounded-md" fallbackSrc="/placeholder.jpg" />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <div className="font-medium text-gray-900 truncate">{item.name}</div>
                                  {item.isB2B && (
                                    <span className="inline-flex items-center px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                      B2B
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm text-gray-600 truncate">{item.price || 0} MAD</div>
                                {item.scheduledTime && (
                                  <div className="text-xs text-blue-600 mt-1 flex items-center">
                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {item.scheduledTime}
                                  </div>
                                )}
                                {item.availableDates && item.availableDates.length > 0 && (
                                  <div className="text-xs text-green-700 mt-1">
                                    Dates: {formatDatesAsRanges(item.availableDates)}
                                  </div>
                                )}
                              </div>
                              <button onClick={() => removeItem('activities', index)} className="text-red-600 bg-red-100 hover:bg-red-200 rounded-md px-2 py-1 text-xs font-medium">Retirer</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Services preview */}
                    {formData.services.length > 0 && (
                      <div>
                        <div className="text-sm font-medium text-green-700 mb-2">Services</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {formData.services.map((item, index) => (
                            <div key={`srv-${index}`} className="bg-white border border-gray-200 rounded-lg p-3 flex items-start gap-3">
                              {item.thumbnail && (
                                <S3Image src={item.thumbnail} alt={item.name} className="w-12 h-12 object-cover rounded-md" fallbackSrc="/placeholder.jpg" />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <div className="font-medium text-gray-900 truncate">{item.name}</div>
                                  {item.isB2B && (
                                    <span className="inline-flex items-center px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                      B2B
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm text-gray-600 truncate">{item.price || 0} MAD</div>
                                {item.availableDates && item.availableDates.length > 0 && (
                                  <div className="text-xs text-green-700 mt-1">
                                    Dates: {formatDatesAsRanges(item.availableDates)}
                                  </div>
                                )}
                              </div>
                              <button onClick={() => removeItem('services', index)} className="text-red-600 bg-red-100 hover:bg-red-200 rounded-md px-2 py-1 text-xs font-medium">Retirer</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            
            <div className="space-y-8">
              {/* Existing Items */}
              <ItemSection 
                title="Restaurants" 
                category="restaurants"
                items={formData.restaurants}
                onAddItem={addItem}
                onRemoveItem={removeItem}
                onEditItem={editItem}
                isExpanded={expandedSection === 'restaurants'}
                onToggleExpanded={handleToggleExpanded}
                availableProperties={availableProperties}
                pkgForm={formData}
                allowB2BSelection={true}
                b2bCategoryFilter={['restaurant', 'catering']}
              />
              
              {/* Activities */}
              <ItemSection 
                title="Activités" 
                category="activities"
                items={formData.activities}
                onAddItem={addItem}
                onRemoveItem={removeItem}
                onEditItem={editItem}
                isExpanded={expandedSection === 'activities'}
                onToggleExpanded={handleToggleExpanded}
                availableProperties={availableProperties}
                pkgForm={formData}
                allowB2BSelection={true}
                b2bCategoryFilter={['activities', 'tours']}
              />
              
              {/* Services */}
              <ItemSection 
                title="Services" 
                category="services"
                items={formData.services}
                onAddItem={addItem}
                onRemoveItem={removeItem}
                onEditItem={editItem}
                isExpanded={expandedSection === 'services'}
                onToggleExpanded={handleToggleExpanded}
                availableProperties={availableProperties}
                pkgForm={formData}
                allowB2BSelection={true}
                b2bCategoryFilter={['transportation', 'cleaning', 'maintenance', 'event-planning', 'photography', 'other']}
              />
            </div>
          </div>
        )}


          {/* Step 3: Select Dates - Enhanced Mobile Design */}
        {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Sélectionner Dates</h2>
                <p className="text-gray-600">Choisissez les dates de début et de fin pour votre package</p>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Date de Début</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 text-gray-900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Date de Fin</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                    min={formData.startDate || new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 text-gray-900"
                  />
                </div>
                {formData.startDate && formData.endDate && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <p className="text-sm text-green-800">
                      <strong>Période sélectionnée:</strong> Du {new Date(formData.startDate).toLocaleDateString()} au {new Date(formData.endDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
        )}

          {/* Step 4: Basic Info - Enhanced Mobile Design */}
        {currentStep === 4 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Informations De Base</h2>
                <p className="text-gray-600">Fournissez les détails de votre package</p>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Nom du Package</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Entrez le nom du package"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 text-gray-900"
                />
              </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows="4"
                    placeholder="Décrivez votre package..."
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 text-gray-900 resize-none"
                ></textarea>
              </div>
            </div>
          </div>
        )}

          {/* Step 5: Set Price - Enhanced Mobile Design */}
        {currentStep === 5 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Définir Prix</h2>
                <p className="text-gray-600">Définissez le prix total pour votre package</p>
              </div>
              
              <div className="max-w-md mx-auto">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Prix Total</label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="number"
                      value={formData.totalPrice}
                      onChange={(e) => handleInputChange('totalPrice', e.target.value)}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 text-gray-900 text-lg"
                    />
                    <span className="text-gray-500 font-medium text-lg">MAD</span>
                  </div>
                </div>
              </div>
          </div>
        )}

          {/* Step 6: Review - Enhanced Mobile Design */}
        {currentStep === 6 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Réviser & Publier</h2>
                <p className="text-gray-600">Révisez les détails de votre package avant de publier</p>
              </div>
              
            <PackagePreview formData={formData} availableProperties={availableProperties} />
          </div>
        )}
      </div>

        {/* Enhanced Mobile Navigation Buttons */}
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mt-6">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 sm:space-x-4">
            {/* Left Side - Back Navigation */}
            <div className="flex space-x-2 w-full sm:w-auto">
          {currentStep > 1 && (
            <>
              <button
                onClick={() => handleStepClick(1)}
                    className="flex-1 sm:flex-none px-4 py-3 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-200 disabled:opacity-50"
                disabled={isLoading}
              >
                    <div className="flex items-center justify-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                      </svg>
                      Premier
                    </div>
              </button>
              <button
                onClick={() => handleStepClick(currentStep - 1)}
                    className="flex-1 sm:flex-none px-6 py-3 font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-200 disabled:opacity-50"
                disabled={isLoading}
              >
                    <div className="flex items-center justify-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Retour
                    </div>
              </button>
            </>
          )}
        </div>

            {/* Right Side - Action Buttons */}
            <div className="flex space-x-3 w-full sm:w-auto">
          {currentStep < 6 ? (
            <>
              <button
                onClick={handleSaveDraft}
                    className="flex-1 sm:flex-none px-4 py-3 font-medium text-green-600 bg-green-100 rounded-xl hover:bg-green-200 transition-all duration-200 disabled:opacity-50"
                disabled={isLoading}
              >
                    <div className="flex items-center justify-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                      {isLoading ? 'Enregistrement...' : 'Enregistrer Brouillon'}
                    </div>
              </button>
              <button
                onClick={handleNext}
                    className={`flex-1 sm:flex-none px-6 py-3 font-semibold text-white rounded-xl transition-all duration-200 ${
                  validateStep(currentStep)
                        ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl transform hover:scale-105'
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
                disabled={!validateStep(currentStep) || isLoading}
              >
                    <div className="flex items-center justify-center">
                      Suivant
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleSaveDraft}
                    className="flex-1 sm:flex-none px-4 py-3 font-medium text-green-600 bg-green-100 rounded-xl hover:bg-green-200 transition-all duration-200 disabled:opacity-50"
                disabled={isLoading}
              >
                    <div className="flex items-center justify-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                      {isLoading ? 'Enregistrement...' : 'Enregistrer comme Brouillon'}
                    </div>
              </button>
              <button
                onClick={handlePublish}
                    className="flex-1 sm:flex-none px-6 py-3 font-semibold text-white bg-gradient-to-r from-green-500 to-green-600 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50"
                disabled={isLoading}
              >
                    <div className="flex items-center justify-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      {isLoading ? 'Publication...' : 'Publier Package'}
                    </div>
              </button>
            </>
          )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Item Section Component with inline editing
const ItemSection = ({ title, category, items, onAddItem, onRemoveItem, onEditItem, isExpanded, onToggleExpanded, availableProperties = [], pkgForm = {}, allowB2BSelection = false, b2bCategoryFilter = [] }) => {
  const [newItem, setNewItem] = useState({ name: '', description: '', price: '', thumbnail: '', scheduledTime: '', availableDates: [] });
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingItem, setEditingItem] = useState({ name: '', description: '', price: '', thumbnail: '', scheduledTime: '', availableDates: [] });
  const [tempDateAdd, setTempDateAdd] = useState('');
  const [tempDateEdit, setTempDateEdit] = useState('');
  const [dateModeAdd, setDateModeAdd] = useState('single'); // 'single' | 'range'
  const [dateModeEdit, setDateModeEdit] = useState('single');
  const [rangeStartAdd, setRangeStartAdd] = useState('');
  const [rangeEndAdd, setRangeEndAdd] = useState('');
  const [rangeStartEdit, setRangeStartEdit] = useState('');
  const [rangeEndEdit, setRangeEndEdit] = useState('');
  
  // B2B service selection state
  const [serviceMode, setServiceMode] = useState('manual'); // 'manual' | 'b2b'
  const [b2bServices, setB2bServices] = useState([]);
  const [loadingB2B, setLoadingB2B] = useState(false);
  const [b2bSearchQuery, setB2bSearchQuery] = useState('');
  const [b2bServiceType, setB2bServiceType] = useState('all');
  const [selectedB2BServices, setSelectedB2BServices] = useState([]);

  // Auto-show add form when section becomes expanded
  useEffect(() => {
    if (isExpanded && !showAddForm) {
      setShowAddForm(true);
    } else if (!isExpanded && showAddForm) {
      setShowAddForm(false);
    }
  }, [isExpanded, showAddForm]);

  const fetchB2BServices = async () => {
    setLoadingB2B(true);
    try {
      const params = {
        page: 1,
        limit: 50,
        ...(b2bSearchQuery && { search: b2bSearchQuery }),
        ...(b2bServiceType !== 'all' && { serviceType: b2bServiceType })
      };
      const response = await api.get('/api/b2b/search', { params });
      if (response.data.success) {
        let services = response.data.services || [];
        // Filter by category if b2bCategoryFilter is provided
        if (b2bCategoryFilter.length > 0) {
          services = services.filter(service => 
            b2bCategoryFilter.includes(service.serviceType || service.serviceProvided)
          );
        }
        setB2bServices(services);
      }
    } catch (error) {
      console.error('Error fetching B2B services:', error);
    } finally {
      setLoadingB2B(false);
    }
  };

  // Fetch B2B services when in B2B mode
  useEffect(() => {
    if (allowB2BSelection && serviceMode === 'b2b' && isExpanded) {
      fetchB2BServices();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowB2BSelection, serviceMode, isExpanded, b2bSearchQuery, b2bServiceType]);

  const handleB2BServiceToggle = (service) => {
    setSelectedB2BServices(prev => {
      const isSelected = prev.some(s => s._id === service._id);
      if (isSelected) {
        return prev.filter(s => s._id !== service._id);
      } else {
        return [...prev, service];
      }
    });
  };

  const handleAddSelectedB2BServices = () => {
    if (selectedB2BServices.length === 0) return;
    
    selectedB2BServices.forEach(b2bService => {
      // Convert B2B service to package service format
      // Now using actual service data (title, description, price, images) instead of business info
      const packageService = {
        name: b2bService.title || b2bService.businessName || b2bService.fullName,
        description: b2bService.description || `${b2bService.serviceType || 'Service'} - ${b2bService.location || ''}`,
        price: b2bService.price || 0, // Use the actual service price
        thumbnail: (b2bService.images && b2bService.images.length > 0) 
          ? b2bService.images[0] 
          : (b2bService.profilePic || ''),
        scheduledTime: '',
        availableDates: [],
        b2bServiceId: b2bService._id, // Store reference to B2B service
        isB2B: true, // Flag to identify B2B items
        b2bProvider: {
          id: b2bService.businessId || b2bService._id,
          name: b2bService.businessName || b2bService.fullName,
          email: b2bService.email,
          phone: b2bService.phoneNumber,
          serviceType: b2bService.serviceType || b2bService.serviceProvided,
          location: b2bService.location
        }
      };
      onAddItem(category, packageService);
    });

    // Clear selection and reset mode
    setSelectedB2BServices([]);
    setServiceMode('manual');
    setShowAddForm(false);
    // Collapse the section after adding so user can see items in preview
    onToggleExpanded(category, false);
  };

  const handleAdd = () => {
    onAddItem(category, newItem);
    setNewItem({ name: '', description: '', price: '', thumbnail: '', scheduledTime: '', availableDates: [] });
    setShowAddForm(false);
    onToggleExpanded(category, false); // Collapse the section after adding
  };

  const handleToggleAddForm = () => {
    if (!showAddForm) {
      onToggleExpanded(category, true); // Expand this section and collapse others
      setShowAddForm(true); // Show the add form immediately
    } else {
      setShowAddForm(false); // Hide the add form
    }
  };

  const startEditing = (index, item) => {
    setEditingIndex(index);
    setEditingItem({ ...item });
  };

  const cancelEditing = () => {
    setEditingIndex(null);
    setEditingItem({ name: '', description: '', price: '', thumbnail: '', scheduledTime: '', availableDates: [] });
  };

  const handleCancelAdd = () => {
    setShowAddForm(false);
    setNewItem({ name: '', description: '', price: '', thumbnail: '', scheduledTime: '' });
    onToggleExpanded(category, false); // Collapse the section when canceling
  };

  const saveEdit = () => {
    onEditItem(category, editingIndex, editingItem);
    setEditingIndex(null);
    setEditingItem({ name: '', description: '', price: '', thumbnail: '', scheduledTime: '', availableDates: [] });
  };

  // Date selector controls
  const minDate = pkgForm.startDate || '';
  const maxDate = pkgForm.endDate || '';
  const withinRange = (iso) => {
    if (!minDate || !maxDate) return true;
    return iso >= minDate && iso <= maxDate;
  };

  const expandRangeToDates = (startISO, endISO) => {
    if (!startISO || !endISO) return [];
    let start = startISO;
    let end = endISO;
    if (minDate && start < minDate) start = minDate;
    if (maxDate && end > maxDate) end = maxDate;
    if (end < start) return [];
    const dates = [];
    const cur = new Date(start);
    const endDate = new Date(end);
    while (cur <= endDate) {
      dates.push(cur.toISOString().slice(0,10));
      cur.setDate(cur.getDate() + 1);
    }
    return dates;
  };

  return (
    <div className={`border-2 rounded-xl p-4 sm:p-6 transition-all duration-300 ${
      isExpanded ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-gray-50'
    }`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-2 sm:space-y-0">
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        <button
          onClick={handleToggleAddForm}
          className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all duration-200 font-medium"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Ajouter {title.slice(0, -1)}
        </button>
      </div>

      {/* Existing Items - Only show when expanded */}
      {isExpanded && items.length > 0 && (
        <div className="space-y-4 mb-6">
          {items.map((item, index) => (
            <div key={index} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              {editingIndex === index ? (
                // Edit Mode
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Nom"
                    value={editingItem.name}
                    onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                  />
                  <textarea
                    placeholder="Description"
                    value={editingItem.description}
                    onChange={(e) => setEditingItem({...editingItem, description: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 resize-none"
                    rows="2"
                  ></textarea>
                  <input
                    type="number"
                    placeholder="Prix (MAD)"
                    value={editingItem.price}
                    onChange={(e) => setEditingItem({...editingItem, price: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                    min="0"
                    step="0.01"
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Heure de Réservation (Optionnel)</label>
                    <input
                      type="time"
                      value={editingItem.scheduledTime}
                      onChange={(e) => setEditingItem({...editingItem, scheduledTime: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                      placeholder="HH:MM"
                    />
                    <p className="text-xs text-gray-500 mt-1">Ex: 14:30 pour 2:30 PM</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Dates disponibles</label>
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <label className={`text-sm font-medium ${dateModeEdit==='single'?'text-green-700':'text-gray-600'}`}>
                        <input type="radio" className="mr-1" checked={dateModeEdit==='single'} onChange={()=>setDateModeEdit('single')} /> Date unique
                      </label>
                      <label className={`text-sm font-medium ${dateModeEdit==='range'?'text-green-700':'text-gray-600'}`}>
                        <input type="radio" className="mr-1" checked={dateModeEdit==='range'} onChange={()=>setDateModeEdit('range')} /> Intervalle
                      </label>
                    </div>
                    {dateModeEdit === 'single' ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="date"
                          value={tempDateEdit}
                          onChange={(e) => setTempDateEdit(e.target.value)}
                          min={minDate}
                          max={maxDate}
                          className="px-3 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!tempDateEdit || !withinRange(tempDateEdit)) return;
                            const set = new Set(editingItem.availableDates || []);
                            set.add(tempDateEdit);
                            setEditingItem({ ...editingItem, availableDates: Array.from(set).sort() });
                            setTempDateEdit('');
                          }}
                          className="px-3 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700"
                        >
                          Ajouter
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        <input type="date" value={rangeStartEdit} onChange={(e)=>setRangeStartEdit(e.target.value)} min={minDate} max={maxDate} className="px-3 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500" />
                        <span className="text-gray-500">→</span>
                        <input type="date" value={rangeEndEdit} onChange={(e)=>setRangeEndEdit(e.target.value)} min={minDate} max={maxDate} className="px-3 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500" />
                        <button
                          type="button"
                          onClick={() => {
                            const dates = expandRangeToDates(rangeStartEdit, rangeEndEdit);
                            if (!dates.length) return;
                            const set = new Set(editingItem.availableDates || []);
                            dates.forEach(d=>set.add(d));
                            setEditingItem({ ...editingItem, availableDates: Array.from(set).sort() });
                            setRangeStartEdit('');
                            setRangeEndEdit('');
                          }}
                          className="px-3 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700"
                        >
                          Ajouter l'intervalle
                        </button>
                      </div>
                    )}
                    {editingItem.availableDates && editingItem.availableDates.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {editingItem.availableDates.map((d) => (
                          <span key={d} className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                            {new Date(d).toLocaleDateString()}
                            <button
                              type="button"
                              onClick={() => setEditingItem({ ...editingItem, availableDates: editingItem.availableDates.filter(x => x !== d) })}
                              className="text-green-700 hover:text-green-900"
                            >×</button>
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-1">Limité par la disponibilité de la propriété et la période choisie.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Image</label>
                    <S3ImageUpload
                      onUpload={(url) => setEditingItem({...editingItem, thumbnail: url})}
                      currentImage={editingItem.thumbnail}
                      className="w-full"
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={saveEdit}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all duration-200 font-medium disabled:opacity-50"
                      disabled={!editingItem.name || !editingItem.price}
                    >
                      Enregistrer Modifications
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="px-4 py-2 text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300 transition-all duration-200 font-medium"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                // Display Mode
                <div className="flex justify-between items-start">
                  <div className="flex items-start space-x-3 flex-1">
                    {item.thumbnail && (
                      <S3Image 
                        src={item.thumbnail} 
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-md flex-shrink-0"
                        fallbackSrc="/placeholder.jpg"
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.name}</h4>
                      {item.description && (
                        <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                      )}
                      <p className="text-sm font-medium text-green-600 mt-1">{item.price} MAD</p>
                      {item.scheduledTime && (
                        <p className="text-sm text-blue-600 mt-1">
                          <span className="inline-flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {item.scheduledTime}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => startEditing(index, item)}
                      className="px-3 py-1 text-blue-600 bg-blue-100 rounded-lg hover:bg-blue-200 transition-all duration-200 text-sm font-medium"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => onRemoveItem(category, index)}
                      className="px-3 py-1 text-red-600 bg-red-100 rounded-lg hover:bg-red-200 transition-all duration-200 text-sm font-medium"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Mode Toggle - Only show if allowB2BSelection is true */}
      {isExpanded && allowB2BSelection && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <label className="block text-sm font-semibold text-gray-700 mb-3">Choisir le mode d'ajout</label>
          <div className="flex gap-4">
            <label className={`flex-1 cursor-pointer p-3 rounded-lg border-2 transition-all ${
              serviceMode === 'manual' 
                ? 'border-green-500 bg-green-50' 
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}>
              <input
                type="radio"
                name={`${category}Mode`}
                value="manual"
                checked={serviceMode === 'manual'}
                onChange={(e) => {
                  setServiceMode(e.target.value);
                  setShowAddForm(true);
                }}
                className="mr-2"
              />
              <span className="font-medium">Créer manuellement</span>
            </label>
            <label className={`flex-1 cursor-pointer p-3 rounded-lg border-2 transition-all ${
              serviceMode === 'b2b' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}>
              <input
                type="radio"
                name={`${category}Mode`}
                value="b2b"
                checked={serviceMode === 'b2b'}
                onChange={(e) => {
                  setServiceMode(e.target.value);
                  setShowAddForm(false);
                }}
                className="mr-2"
              />
              <span className="font-medium">Sélectionner depuis B2B</span>
            </label>
          </div>
        </div>
      )}

      {/* B2B Selection - Only show when in B2B mode */}
      {isExpanded && allowB2BSelection && serviceMode === 'b2b' && (
        <div className="space-y-4 border-t border-gray-300 pt-6 bg-white rounded-xl p-4">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Sélectionner des {title.toLowerCase()} B2B</h4>
          
          {/* Search and Filter */}
          <div className="space-y-3 mb-4">
            <input
              type="text"
              placeholder={`Rechercher un ${title.toLowerCase()}...`}
              value={b2bSearchQuery}
              onChange={(e) => setB2bSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <select
              value={b2bServiceType}
              onChange={(e) => setB2bServiceType(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Tous les types</option>
              {b2bCategoryFilter.map(filterType => {
                const labels = {
                  'restaurant': 'Restaurant',
                  'catering': 'Traiteur',
                  'activities': 'Activités',
                  'tours': 'Visites guidées',
                  'transportation': 'Transport',
                  'cleaning': 'Nettoyage',
                  'maintenance': 'Maintenance',
                  'event-planning': 'Organisation d\'événements',
                  'photography': 'Photographie',
                  'other': 'Autre'
                };
                return (
                  <option key={filterType} value={filterType}>
                    {labels[filterType] || filterType}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Loading State */}
          {loadingB2B && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="mt-2 text-gray-600">Chargement des services...</p>
            </div>
          )}

          {/* B2B Services List */}
          {!loadingB2B && (
            <>
              {b2bServices.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {b2bServices.map((service) => {
                    const isSelected = selectedB2BServices.some(s => s._id === service._id);
                    return (
                      <div
                        key={service._id}
                        onClick={() => handleB2BServiceToggle(service)}
                        className={`relative p-4 border-2 rounded-xl cursor-pointer transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 shadow-md'
                            : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
                        }`}
                      >
                        {/* Selection Indicator */}
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                        <div className="flex items-start gap-3">
                          {((service.images && service.images.length > 0) || service.profilePic) && (
                              <S3Image
                                src={(service.images && service.images.length > 0) ? service.images[0] : service.profilePic}
                                alt={service.title || service.businessName}
                                className={`w-16 h-16 object-cover rounded-lg flex-shrink-0 ${
                                  isSelected ? 'ring-2 ring-blue-500' : ''
                                }`}
                                fallbackSrc="/placeholder.jpg"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h5 className={`font-semibold ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                                  {service.title || service.businessName || service.fullName}
                                </h5>
                              </div>
                              {service.description && (
                                <p className={`text-xs mt-1 ${isSelected ? 'text-blue-600' : 'text-gray-500'} line-clamp-2`}>
                                  {service.description}
                                </p>
                              )}
                              <p className={`text-sm mt-1 ${isSelected ? 'text-blue-700' : 'text-gray-600'}`}>
                                <span className="font-medium">{service.serviceType || service.serviceProvided}</span>
                                {service.location && <span> • {service.location}</span>}
                                {service.price !== undefined && service.price > 0 && (
                                  <span> • {service.price} MAD</span>
                                )}
                              </p>
                            {service.email && (
                              <p className="text-xs text-gray-500 mt-1">{service.email}</p>
                            )}
                            {service.phoneNumber && (
                              <p className="text-xs text-gray-500">{service.phoneNumber}</p>
                            )}
                            {isSelected && (
                              <div className="mt-2 inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium">
                                ✓ Sélectionné
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Aucun {title.toLowerCase()} B2B trouvé</p>
                </div>
              )}

              {/* Add Selected Items Button */}
              {selectedB2BServices.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">
                      {selectedB2BServices.length} {title.toLowerCase()} sélectionné(s)
                    </span>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleAddSelectedB2BServices}
                      className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all duration-200 font-semibold"
                    >
                      Ajouter {selectedB2BServices.length} {title.toLowerCase()} au package
                    </button>
                    <button
                      onClick={() => setSelectedB2BServices([])}
                      className="px-4 py-3 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium"
                    >
                      Réinitialiser
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Add Form - Only show when expanded and form is active (manual mode) */}
      {isExpanded && showAddForm && serviceMode !== 'b2b' && (
        <div className="space-y-4 border-t border-gray-300 pt-6 bg-white rounded-xl p-4">
          <input
            type="text"
            placeholder="Nom"
            value={newItem.name}
            onChange={(e) => setNewItem({...newItem, name: e.target.value})}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
          />
          <textarea
            placeholder="Description"
            value={newItem.description}
            onChange={(e) => setNewItem({...newItem, description: e.target.value})}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 resize-none"
            rows="2"
          ></textarea>
          <input
            type="number"
            placeholder="Prix (MAD)"
            value={newItem.price}
            onChange={(e) => setNewItem({...newItem, price: e.target.value})}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
            min="0"
            step="0.01"
          />
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Heure de Réservation (Optionnel)</label>
            <input
              type="time"
              value={newItem.scheduledTime}
              onChange={(e) => setNewItem({...newItem, scheduledTime: e.target.value})}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
              placeholder="HH:MM"
            />
            <p className="text-xs text-gray-500 mt-1">Ex: 14:30 pour 2:30 PM - Laissez vide si flexible</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Dates disponibles</label>
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <label className={`text-sm font-medium ${dateModeAdd==='single'?'text-green-700':'text-gray-600'}`}>
                <input type="radio" className="mr-1" checked={dateModeAdd==='single'} onChange={()=>setDateModeAdd('single')} /> Date unique
              </label>
              <label className={`text-sm font-medium ${dateModeAdd==='range'?'text-green-700':'text-gray-600'}`}>
                <input type="radio" className="mr-1" checked={dateModeAdd==='range'} onChange={()=>setDateModeAdd('range')} /> Intervalle
              </label>
            </div>
            {dateModeAdd === 'single' ? (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={tempDateAdd}
                  onChange={(e) => setTempDateAdd(e.target.value)}
                  min={minDate}
                  max={maxDate}
                  className="px-3 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!tempDateAdd || !withinRange(tempDateAdd)) return;
                    const set = new Set(newItem.availableDates || []);
                    set.add(tempDateAdd);
                    setNewItem({ ...newItem, availableDates: Array.from(set).sort() });
                    setTempDateAdd('');
                  }}
                  className="px-3 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700"
                >
                  Ajouter
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <input type="date" value={rangeStartAdd} onChange={(e)=>setRangeStartAdd(e.target.value)} min={minDate} max={maxDate} className="px-3 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500" />
                <span className="text-gray-500">→</span>
                <input type="date" value={rangeEndAdd} onChange={(e)=>setRangeEndAdd(e.target.value)} min={minDate} max={maxDate} className="px-3 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500" />
                <button
                  type="button"
                  onClick={() => {
                    const dates = expandRangeToDates(rangeStartAdd, rangeEndAdd);
                    if (!dates.length) return;
                    const set = new Set(newItem.availableDates || []);
                    dates.forEach(d=>set.add(d));
                    setNewItem({ ...newItem, availableDates: Array.from(set).sort() });
                    setRangeStartAdd('');
                    setRangeEndAdd('');
                  }}
                  className="px-3 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700"
                >
                  Ajouter l'intervalle
                </button>
              </div>
            )}
            {newItem.availableDates && newItem.availableDates.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {newItem.availableDates.map((d) => (
                  <span key={d} className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                    {new Date(d).toLocaleDateString()}
                    <button
                      type="button"
                      onClick={() => setNewItem({ ...newItem, availableDates: newItem.availableDates.filter(x => x !== d) })}
                      className="text-green-700 hover:text-green-900"
                    >×</button>
                  </span>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">Limité par la disponibilité de la propriété et la période choisie.</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Image (Optionnel)</label>
            <S3ImageUpload
              onUpload={(url) => setNewItem({...newItem, thumbnail: url})}
              currentImage={newItem.thumbnail}
              className="w-full"
            />
          </div>
          <div className="flex justify-center space-x-3">
            <button
              onClick={handleAdd}
              className="flex-1 max-w-32 px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all duration-200 font-semibold disabled:opacity-50"
              disabled={!newItem.name || !newItem.price}
            >
              Ajouter
            </button>
            <button
              onClick={handleCancelAdd}
              className="flex-1 max-w-32 px-6 py-3 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-200 font-semibold"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Package Preview Component
const PackagePreview = ({ formData, availableProperties }) => {
  const selectedProperty = availableProperties.filter(p => p && p._id).find(p => p._id === formData.property);
  const totalItems = formData.restaurants.length + formData.activities.length + formData.services.length;

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Résumé du Package</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Informations de Base</h4>
            <p><strong>Nom:</strong> {formData.name}</p>
            <p><strong>Description:</strong> {formData.description}</p>
            <p><strong>Prix:</strong> {formData.totalPrice} MAD</p>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Propriété & Dates</h4>
            <p><strong>Propriété:</strong> {selectedProperty?.title}</p>
            <p><strong>Date de Début:</strong> {formData.startDate ? new Date(formData.startDate).toLocaleDateString() : '-'}</p>
            <p><strong>Date de Fin:</strong> {formData.endDate ? new Date(formData.endDate).toLocaleDateString() : '-'}</p>
          </div>
        </div>

        <div className="mt-6">
          <h4 className="font-medium text-gray-700 mb-2">Éléments Inclus ({totalItems} au total)</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {formData.restaurants.length > 0 && (
              <div>
                <h5 className="font-medium text-green-600">Restaurants ({formData.restaurants.length})</h5>
                <ul className="text-sm text-gray-600 mt-1 space-y-1">
                  {formData.restaurants.map((item, index) => (
                    <li key={index} className="flex flex-col">
                      <span>{item.name} - {item.price} MAD</span>
                      {item.scheduledTime && (
                        <span className="text-xs text-blue-600 flex items-center mt-0.5">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {item.scheduledTime}
                        </span>
                      )}
                      {item.availableDates && item.availableDates.length > 0 && (
                        <span className="text-xs text-green-700 mt-0.5">Dates: {item.availableDates.map(d => new Date(d).toLocaleDateString()).join(', ')}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {formData.activities.length > 0 && (
              <div>
                <h5 className="font-medium text-green-600">Activities ({formData.activities.length})</h5>
                <ul className="text-sm text-gray-600 mt-1 space-y-1">
                  {formData.activities.map((item, index) => (
                    <li key={index} className="flex flex-col">
                      <span>{item.name} - {item.price} MAD</span>
                      {item.scheduledTime && (
                        <span className="text-xs text-blue-600 flex items-center mt-0.5">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {item.scheduledTime}
                        </span>
                      )}
                      {item.availableDates && item.availableDates.length > 0 && (
                        <span className="text-xs text-green-700 mt-0.5">Dates: {item.availableDates.map(d => new Date(d).toLocaleDateString()).join(', ')}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {formData.services.length > 0 && (
              <div>
                <h5 className="font-medium text-green-600">Services ({formData.services.length})</h5>
                <ul className="text-sm text-gray-600 mt-1">
                  {formData.services.map((item, index) => (
                    <li key={index} className="flex flex-col">
                      <span>{item.name} - {item.price} MAD</span>
                      {item.availableDates && item.availableDates.length > 0 && (
                        <span className="text-xs text-green-700 mt-0.5">Dates: {item.availableDates.map(d => new Date(d).toLocaleDateString()).join(', ')}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePackageForm;