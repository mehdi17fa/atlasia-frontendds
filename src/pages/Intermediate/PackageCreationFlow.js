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
        setAvailableProperties(data.properties || []);
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
    'Choose Property',
    'Select Items',
    'Set Dates',
    'Basic Info',
    'Set Price',
    'Review & Publish'
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 pb-28 bg-white rounded-lg shadow-lg">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, index) => (
            <div 
              key={index} 
              className="flex flex-col items-center cursor-pointer"
              onClick={() => handleStepClick(index + 1)}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                index + 1 <= currentStep 
                  ? 'bg-green-500 text-white hover:bg-green-600' 
                  : 'bg-gray-200 text-gray-600 cursor-not-allowed'
              }`}>
                {index + 1}
              </div>
              <span className="text-xs mt-2 text-gray-600">{step}</span>
            </div>
          ))}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-green-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Step Content */}
      <div className="min-h-96">
        {/* Step 1: Choose Property */}
        {currentStep === 1 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Choose Property</h2>
            {loadingProperties ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
                <p className="text-gray-600 mt-4">Loading your properties...</p>
              </div>
            ) : availableProperties.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">You don't have any properties to create packages for.</p>
                <p className="text-sm text-gray-500 mt-2">You need to be accepted as a co-host first.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableProperties.map((property) => (
                  <div 
                    key={property._id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      formData.property === property._id
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                    onClick={() => handleInputChange('property', property._id)}
                  >
                    {property.photos && property.photos.length > 0 && (
                      <S3Image 
                        src={property.photos[0]} 
                        alt={property.title}
                        className="w-full h-32 object-cover rounded-md mb-3"
                        fallbackSrc="/placeholder.jpg"
                      />
                    )}
                    <h3 className="font-semibold text-gray-900">{property.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {property.localisation?.city || 'Location not specified'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Select Items */}
        {currentStep === 2 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Select Items</h2>
            <p className="text-gray-600 mb-6">Add restaurants, activities, or services to your package (at least one required)</p>
            
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

        {/* Step 3: Set Dates */}
        {currentStep === 3 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Set Package Dates</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  min={formData.startDate || new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Basic Info */}
        {currentStep === 4 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Package Information</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Package Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter package name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows="4"
                  placeholder="Describe your package..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                ></textarea>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Set Price */}
        {currentStep === 5 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Set Package Price</h2>
            <div className="max-w-md">
              <label className="block text-sm font-medium text-gray-700 mb-2">Total Price (MAD)</label>
              <input
                type="number"
                value={formData.totalPrice}
                onChange={(e) => handleInputChange('totalPrice', e.target.value)}
                min="0"
                step="0.01"
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        {/* Step 6: Review */}
        {currentStep === 6 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Review & Publish</h2>
            <PackagePreview formData={formData} availableProperties={availableProperties} />
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8">
        <div className="flex space-x-2">
          {currentStep > 1 && (
            <>
              <button
                onClick={() => handleStepClick(1)}
                className="px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                disabled={isLoading}
              >
                First
              </button>
              <button
                onClick={() => handleStepClick(currentStep - 1)}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                disabled={isLoading}
              >
                Back
              </button>
            </>
          )}
        </div>

        <div className="flex space-x-3">
          {currentStep < 6 ? (
            <>
              <button
                onClick={handleSaveDraft}
                className="px-4 py-2 text-green-600 bg-green-100 rounded-md hover:bg-green-200 transition-colors disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save Draft'}
              </button>
              <button
                onClick={handleNext}
                className={`px-4 py-2 text-white rounded-md transition-colors ${
                  validateStep(currentStep)
                    ? 'bg-green-500 hover:bg-green-600'
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
                disabled={!validateStep(currentStep) || isLoading}
              >
                Next
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleSaveDraft}
                className="px-4 py-2 text-green-600 bg-green-100 rounded-md hover:bg-green-200 transition-colors disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save as Draft'}
              </button>
              <button
                onClick={handlePublish}
                className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? 'Publishing...' : 'Publish Package'}
              </button>
            </>
          )}
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
    <div className="border rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="text-green-500 hover:text-green-600 font-medium"
        >
          + Add {title.slice(0, -1)}
        </button>
      </div>

      {/* Existing Items */}
      {items.length > 0 && (
        <div className="space-y-3 mb-4">
          {items.map((item, index) => (
            <div key={index} className="bg-gray-50 p-3 rounded-md">
              {editingIndex === index ? (
                // Edit Mode
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Name"
                    value={editingItem.name}
                    onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <textarea
                    placeholder="Description"
                    value={editingItem.description}
                    onChange={(e) => setEditingItem({...editingItem, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows="2"
                  ></textarea>
                  <input
                    type="number"
                    placeholder="Price (MAD)"
                    value={editingItem.price}
                    onChange={(e) => setEditingItem({...editingItem, price: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
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
                  <div className="flex space-x-2">
                    <button
                      onClick={saveEdit}
                      className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm disabled:opacity-50"
                      disabled={!editingItem.name || !editingItem.price}
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="px-3 py-1 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 text-sm"
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
                      className="text-blue-500 hover:text-blue-600 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onRemoveItem(category, index)}
                      className="text-red-500 hover:text-red-600 text-sm font-medium"
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
        <div className="space-y-3 border-t pt-4">
          <input
            type="text"
            placeholder="Name"
            value={newItem.name}
            onChange={(e) => setNewItem({...newItem, name: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <textarea
            placeholder="Description"
            value={newItem.description}
            onChange={(e) => setNewItem({...newItem, description: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            rows="2"
          ></textarea>
          <input
            type="number"
            placeholder="Price (MAD)"
            value={newItem.price}
            onChange={(e) => setNewItem({...newItem, price: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            min="0"
            step="0.01"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Image (Optional)</label>
            <S3ImageUpload
              onUpload={(url) => setNewItem({...newItem, thumbnail: url})}
              currentImage={newItem.thumbnail}
              className="w-full"
            />
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleAdd}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
              disabled={!newItem.name || !newItem.price}
            >
              Add
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
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
  const selectedProperty = availableProperties.find(p => p._id === formData.property);
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