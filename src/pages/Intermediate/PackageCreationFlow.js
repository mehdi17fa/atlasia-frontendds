import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import S3Image from '../../components/S3Image';
import S3ImageUpload from '../../components/S3ImageUpload';

const CreatePackageForm = ({ onSuccess, onCancel }) => {
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
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
      
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/api/partner/my-properties`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', response.headers);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Properties data received:', data);
        // Filter out any null/undefined properties and ensure they have _id
        const validProperties = (data.properties || []).filter(property => 
          property && property._id && typeof property._id === 'string'
        );
        console.log('✅ Valid properties after filtering:', validProperties);
        setAvailableProperties(validProperties);
      } else {
        const errorText = await response.text();
        console.error('❌ Error response:', response.status, errorText);
        setError(`Failed to load properties (${response.status}): ${errorText.substring(0, 100)}`);
      }
    } catch (err) {
      console.error('❌ Fetch error:', err);
      setError(`Error loading properties: ${err.message}`);
    } finally {
      setLoadingProperties(false);
    }
  };

  const handleNext = () => {
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
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
    if (!item.name || !item.price) return;
    
    setFormData(prev => ({
      ...prev,
      [category]: [...prev[category], { ...item, price: parseFloat(item.price) }]
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

  const validateStep = (step) => {
    switch (step) {
      case 1:
        return formData.property !== '';
      case 2:
        return formData.restaurants.length > 0 || formData.activities.length > 0 || formData.services.length > 0;
      case 3:
        return formData.startDate && formData.endDate && new Date(formData.startDate) <= new Date(formData.endDate);
      case 4:
        return formData.name.trim() !== '' && formData.description.trim() !== '';
      case 5:
        return formData.totalPrice && parseFloat(formData.totalPrice) > 0;
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
      
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:4000';
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
        alert('Draft saved successfully!');
        
        // Navigate to partner dashboard after successful draft save
        navigate('/partner-welcome');
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Failed to save draft' }));
        console.error('❌ Draft save error:', response.status, errorData);
        setError(errorData.message || 'Failed to save draft');
      }
    } catch (err) {
      console.error('❌ Draft save error:', err);
      setError(`Error saving draft: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublish = async () => {
    // More detailed validation
    const validationErrors = [];
    if (!validateStep(1)) validationErrors.push('Property selection required');
    if (!validateStep(2)) validationErrors.push('At least one item (restaurant, activity, or service) required');
    if (!validateStep(3)) validationErrors.push('Valid start and end dates required');
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

      console.log('🚀 Creating package for publish with payload:', payload);
      
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:4000';
      const createResponse = await fetch(`${apiUrl}/api/packages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      console.log('📡 Create response status:', createResponse.status);

      if (createResponse.ok) {
        const createData = await createResponse.json();
        console.log('✅ Package created:', createData);
        
        if (!createData.package || !createData.package._id) {
          throw new Error('Invalid response from server - no package ID');
        }
        
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
          alert('Package created and published successfully!');
          
          // Navigate to partner dashboard after successful publish
          navigate('/partner-welcome');
        } else {
          const errorData = await publishResponse.json().catch(() => ({ message: 'Failed to publish package' }));
          console.error('❌ Publish error:', publishResponse.status, errorData);
          setError(errorData.message || 'Failed to publish package');
        }
      } else {
        const errorData = await createResponse.json().catch(() => ({ message: 'Failed to create package' }));
        console.error('❌ Create error:', createResponse.status, errorData);
        setError(errorData.message || 'Failed to create package');
      }
    } catch (err) {
      console.error('❌ Publish error:', err);
      setError(`Error publishing package: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    'Choisir Propriété',
    'Sélectionner Éléments',
    'Définir Dates',
    'Informations De Base',
    'Définir Prix',
    'Réviser & Publier'
  ];

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
                  <p className="text-gray-600 font-medium">Loading your properties...</p>
                  <p className="text-sm text-gray-500 mt-1">Please wait while we fetch your available properties</p>
                </div>
              ) : availableProperties.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <p className="text-gray-600 font-medium">No properties available</p>
                  <p className="text-sm text-gray-500 mt-2">You need to be accepted as a co-host first to create packages.</p>
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
                          {property.localisation?.city || 'Location not specified'}
                        </div>
                        {formData.property === property._id && (
                          <div className="flex items-center text-green-600 text-sm font-medium">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Selected
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
            
            <div className="space-y-8">
              {/* Existing Items */}
              <ItemSection 
                title="Restaurants" 
                category="restaurants"
                items={formData.restaurants}
                onAddItem={addItem}
                onRemoveItem={removeItem}
                onEditItem={editItem}
              />
              
              {/* Activities */}
              <ItemSection 
                title="Activities" 
                category="activities"
                items={formData.activities}
                onAddItem={addItem}
                onRemoveItem={removeItem}
                onEditItem={editItem}
              />
              
              {/* Services */}
              <ItemSection 
                title="Services" 
                category="services"
                items={formData.services}
                onAddItem={addItem}
                onRemoveItem={removeItem}
                onEditItem={editItem}
              />
            </div>
            </div>
          )}

          {/* Step 3: Set Dates - Enhanced Mobile Design */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Définir Dates</h2>
                <p className="text-gray-600">Choisissez la période de disponibilité pour votre package</p>
              </div>
              
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Start Date</label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => handleInputChange('startDate', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 text-gray-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">End Date</label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => handleInputChange('endDate', e.target.value)}
                      min={formData.startDate || new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 text-gray-900"
                    />
                  </div>
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
                  <label className="block text-sm font-semibold text-gray-700">Package Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter package name"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 text-gray-900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows="4"
                    placeholder="Describe your package..."
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
                  <label className="block text-sm font-semibold text-gray-700">Total Price (MAD)</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.totalPrice}
                      onChange={(e) => handleInputChange('totalPrice', e.target.value)}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="w-full px-4 py-3 pl-8 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 text-gray-900 text-lg"
                    />
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">MAD</span>
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
                      First
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
                      Back
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
                      {isLoading ? 'Saving...' : 'Save Draft'}
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
                      Next
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
                      {isLoading ? 'Saving...' : 'Save as Draft'}
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
                      {isLoading ? 'Publishing...' : 'Publish Package'}
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
const ItemSection = ({ title, category, items, onAddItem, onRemoveItem, onEditItem }) => {
  const [newItem, setNewItem] = useState({ name: '', description: '', price: '', thumbnail: '' });
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingItem, setEditingItem] = useState({ name: '', description: '', price: '', thumbnail: '' });

  const handleAdd = () => {
    onAddItem(category, newItem);
    setNewItem({ name: '', description: '', price: '', thumbnail: '' });
    setShowAddForm(false);
  };

  const startEditing = (index, item) => {
    setEditingIndex(index);
    setEditingItem({ ...item });
  };

  const cancelEditing = () => {
    setEditingIndex(null);
    setEditingItem({ name: '', description: '', price: '', thumbnail: '' });
  };

  const saveEdit = () => {
    onEditItem(category, editingIndex, editingItem);
    setEditingIndex(null);
    setEditingItem({ name: '', description: '', price: '', thumbnail: '' });
  };

  return (
    <div className="border-2 border-gray-200 rounded-xl p-4 sm:p-6 bg-gray-50">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-2 sm:space-y-0">
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all duration-200 font-medium"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add {title.slice(0, -1)}
        </button>
      </div>

      {/* Existing Items */}
      {items.length > 0 && (
        <div className="space-y-4 mb-6">
          {items.map((item, index) => (
            <div key={index} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              {editingIndex === index ? (
                // Edit Mode
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Name"
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
                    placeholder="Price (MAD)"
                    value={editingItem.price}
                    onChange={(e) => setEditingItem({...editingItem, price: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                    min="0"
                    step="0.01"
                  />
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
                      Save Changes
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="px-4 py-2 text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300 transition-all duration-200 font-medium"
                    >
                      Cancel
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
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => startEditing(index, item)}
                      className="px-3 py-1 text-blue-600 bg-blue-100 rounded-lg hover:bg-blue-200 transition-all duration-200 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onRemoveItem(category, index)}
                      className="px-3 py-1 text-red-600 bg-red-100 rounded-lg hover:bg-red-200 transition-all duration-200 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Form */}
      {showAddForm && (
        <div className="space-y-4 border-t border-gray-300 pt-6 bg-white rounded-xl p-4">
          <input
            type="text"
            placeholder="Name"
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
            placeholder="Price (MAD)"
            value={newItem.price}
            onChange={(e) => setNewItem({...newItem, price: e.target.value})}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
            min="0"
            step="0.01"
          />
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Image (Optional)</label>
            <S3ImageUpload
              onUpload={(url) => setNewItem({...newItem, thumbnail: url})}
              currentImage={newItem.thumbnail}
              className="w-full"
            />
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleAdd}
              className="px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all duration-200 font-semibold disabled:opacity-50"
              disabled={!newItem.name || !newItem.price}
            >
              Add Item
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-6 py-3 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-200 font-semibold"
            >
              Cancel
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
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Package Summary</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Basic Information</h4>
            <p><strong>Name:</strong> {formData.name}</p>
            <p><strong>Description:</strong> {formData.description}</p>
            <p><strong>Price:</strong> {formData.totalPrice} MAD</p>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Property & Dates</h4>
            <p><strong>Property:</strong> {selectedProperty?.title}</p>
            <p><strong>Start Date:</strong> {new Date(formData.startDate).toLocaleDateString()}</p>
            <p><strong>End Date:</strong> {new Date(formData.endDate).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="mt-6">
          <h4 className="font-medium text-gray-700 mb-2">Included Items ({totalItems} total)</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {formData.restaurants.length > 0 && (
              <div>
                <h5 className="font-medium text-green-600">Restaurants ({formData.restaurants.length})</h5>
                <ul className="text-sm text-gray-600 mt-1">
                  {formData.restaurants.map((item, index) => (
                    <li key={index}>{item.name} - {item.price} MAD</li>
                  ))}
                </ul>
              </div>
            )}
            
            {formData.activities.length > 0 && (
              <div>
                <h5 className="font-medium text-green-600">Activities ({formData.activities.length})</h5>
                <ul className="text-sm text-gray-600 mt-1">
                  {formData.activities.map((item, index) => (
                    <li key={index}>{item.name} - {item.price} MAD</li>
                  ))}
                </ul>
              </div>
            )}
            
            {formData.services.length > 0 && (
              <div>
                <h5 className="font-medium text-green-600">Services ({formData.services.length})</h5>
                <ul className="text-sm text-gray-600 mt-1">
                  {formData.services.map((item, index) => (
                    <li key={index}>{item.name} - {item.price} MAD</li>
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