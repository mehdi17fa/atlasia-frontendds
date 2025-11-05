import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  PhotoIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import {
  sanitizeText,
  sanitizeEmail,
  sanitizePhone,
  sanitizePrice,
  sanitizeFeatures,
  validateTitle,
  validateDescription,
  validateLocation,
  validatePrice,
  validateEmail,
  validatePhone,
  validateImageFile
} from '../../utils/sanitize';

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

const priceUnitLabels = {
  per_hour: 'Par heure',
  per_day: 'Par jour',
  per_person: 'Par personne',
  per_event: 'Par événement',
  fixed: 'Prix fixe',
  other: 'Autre'
};

export default function MyServicesManagement() {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    priceUnit: 'fixed',
    location: '',
    contactPhone: '',
    contactEmail: '',
    serviceType: '',
    features: '',
    images: []
  });
  const [imageFiles, setImageFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [validationErrors, setValidationErrors] = useState([]);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('atlasia_access_token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/services/my/list`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setServices(response.data.services || []);
    } catch (err) {
      console.error('Error fetching services:', err);
      setError('Erreur lors du chargement des services');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    // Sanitize input based on field type
    let sanitizedValue = value;
    
    switch (field) {
      case 'title':
        sanitizedValue = sanitizeText(value, 100);
        break;
      case 'description':
        sanitizedValue = sanitizeText(value, 2000);
        break;
      case 'location':
        sanitizedValue = sanitizeText(value, 200);
        break;
      case 'contactEmail':
        sanitizedValue = sanitizeEmail(value);
        break;
      case 'contactPhone':
        // Limit to 10 digits only
        sanitizedValue = sanitizePhone(value);
        break;
      case 'price':
        sanitizedValue = sanitizePrice(value);
        break;
      case 'features':
        sanitizedValue = sanitizeFeatures(value);
        break;
      default:
        sanitizedValue = value;
    }
    
    setFormData(prev => ({ ...prev, [field]: sanitizedValue }));
    
    // Clear field error when user types
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length + imageFiles.length > 5) {
      alert('Vous pouvez ajouter maximum 5 images');
      return;
    }
    
    // Validate each file
    const validFiles = [];
    const errors = [];
    
    files.forEach((file, index) => {
      const validation = validateImageFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        errors.push(`${file.name}: ${validation.error}`);
      }
    });
    
    if (errors.length > 0) {
      alert('Erreurs de validation:\n' + errors.join('\n'));
    }
    
    if (validFiles.length > 0) {
      setImageFiles([...imageFiles, ...validFiles]);
    }
  };

  const removeImage = (index) => {
    setImageFiles(imageFiles.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const errors = {};
    const validationErrors = [];
    
    // Validate title
    const titleValidation = validateTitle(formData.title);
    if (!titleValidation.valid) {
      errors.title = titleValidation.error;
      validationErrors.push(titleValidation.error);
    }
    
    // Validate description
    const descValidation = validateDescription(formData.description);
    if (!descValidation.valid) {
      errors.description = descValidation.error;
      validationErrors.push(descValidation.error);
    }
    
    // Validate location
    const locationValidation = validateLocation(formData.location);
    if (!locationValidation.valid) {
      errors.location = locationValidation.error;
      validationErrors.push(locationValidation.error);
    }
    
    // Validate service type
    if (!formData.serviceType || formData.serviceType === '') {
      errors.serviceType = 'Veuillez sélectionner un type de service';
      validationErrors.push('Type de service requis');
    }
    
    // Validate price (optional but must be valid if provided)
    if (formData.price && formData.price !== '') {
      const priceValidation = validatePrice(formData.price);
      if (!priceValidation.valid) {
        errors.price = priceValidation.error;
        validationErrors.push(priceValidation.error);
      }
    }
    
    // Validate email (optional)
    if (formData.contactEmail && formData.contactEmail.trim()) {
      const emailValidation = validateEmail(formData.contactEmail);
      if (!emailValidation.valid) {
        errors.contactEmail = emailValidation.error;
        validationErrors.push(emailValidation.error);
      }
    }
    
    // Validate phone (optional)
    if (formData.contactPhone && formData.contactPhone.trim()) {
      const phoneValidation = validatePhone(formData.contactPhone);
      if (!phoneValidation.valid) {
        errors.contactPhone = phoneValidation.error;
        validationErrors.push(phoneValidation.error);
      }
    }
    
    // Validate images
    imageFiles.forEach((file, index) => {
      const imageValidation = validateImageFile(file);
      if (!imageValidation.valid) {
        errors[`image_${index}`] = imageValidation.error;
        if (!validationErrors.includes(imageValidation.error)) {
          validationErrors.push(imageValidation.error);
        }
      }
    });
    
    setFieldErrors(errors);
    setValidationErrors(validationErrors);
    
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields
    if (!validateForm()) {
      const errorMessage = validationErrors.length > 0 
        ? 'Veuillez corriger les erreurs suivantes:\n\n' + validationErrors.join('\n')
        : 'Veuillez remplir tous les champs obligatoires correctement';
      alert(errorMessage);
      return;
    }

    setSaving(true);
    setValidationErrors([]);
    
    try {
      const token = localStorage.getItem('atlasia_access_token');
      if (!token) {
        alert('Session expirée. Veuillez vous reconnecter.');
        navigate('/login');
        return;
      }

      const formDataToSend = new FormData();
      
      // Sanitize and append all fields
      const titleValidation = validateTitle(formData.title);
      const descValidation = validateDescription(formData.description);
      const locationValidation = validateLocation(formData.location);
      const priceValidation = validatePrice(formData.price || '0');
      
      formDataToSend.append('title', titleValidation.value);
      formDataToSend.append('description', descValidation.value);
      formDataToSend.append('location', locationValidation.value);
      formDataToSend.append('serviceType', formData.serviceType);
      formDataToSend.append('price', String(priceValidation.value || '0'));
      formDataToSend.append('priceUnit', formData.priceUnit || 'fixed');
      
      // Optional fields - only append if they have values
      if (formData.contactPhone && formData.contactPhone.trim()) {
        const phoneValidation = validatePhone(formData.contactPhone);
        if (phoneValidation.valid && phoneValidation.value) {
          formDataToSend.append('contactPhone', phoneValidation.value);
        }
      }
      
      if (formData.contactEmail && formData.contactEmail.trim()) {
        const emailValidation = validateEmail(formData.contactEmail);
        if (emailValidation.valid && emailValidation.value) {
          formDataToSend.append('contactEmail', emailValidation.value);
        }
      }
      
      if (formData.features && formData.features.trim()) {
        formDataToSend.append('features', sanitizeFeatures(formData.features));
      }

      // Add images
      imageFiles.forEach((file) => {
        formDataToSend.append('images', file);
      });

      const url = editingService
        ? `${process.env.REACT_APP_API_URL}/api/services/${editingService._id}`
        : `${process.env.REACT_APP_API_URL}/api/services`;

      const method = editingService ? 'put' : 'post';

      // Debug: Log form data
      console.log('Form data being sent:', {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        serviceType: formData.serviceType,
        price: formData.price,
        priceUnit: formData.priceUnit,
        imageCount: imageFiles.length
      });

      const response = await axios[method](url, formDataToSend, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        price: '',
        priceUnit: 'fixed',
        location: '',
        contactPhone: '',
        contactEmail: '',
        serviceType: '',
        features: '',
        images: []
      });
      setImageFiles([]);
      setFieldErrors({});
      setValidationErrors([]);
      setShowForm(false);
      setEditingService(null);
      await fetchServices();
      alert(editingService ? 'Service mis à jour avec succès!' : 'Service créé avec succès!');
    } catch (err) {
      console.error('Error saving service:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      
      // Get detailed error information
      const errorData = err.response?.data || {};
      const errorMessage = errorData.message || errorData.error || err.message || 'Erreur lors de l\'enregistrement du service';
      const errors = errorData.errors;
      const details = errorData.details;
      
      // Build comprehensive error message
      let fullErrorMessage = errorMessage;
      
      if (errors && Array.isArray(errors) && errors.length > 0) {
        fullErrorMessage += '\n\nDétails:\n' + errors.join('\n');
      }
      
      if (details && Array.isArray(details)) {
        const detailMessages = details.map(d => `${d.field}: ${d.message}`).join('\n');
        fullErrorMessage += '\n\n' + detailMessages;
      }
      
      if (errorData.received) {
        fullErrorMessage += '\n\nDonnées reçues:\n' + JSON.stringify(errorData.received, null, 2);
      }
      
      alert(fullErrorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (service) => {
    setEditingService(service);
    setFormData({
      title: service.title || '',
      description: service.description || '',
      price: service.price || '',
      priceUnit: service.priceUnit || 'fixed',
      location: service.location || '',
      contactPhone: service.contactPhone || '',
      contactEmail: service.contactEmail || '',
      serviceType: service.serviceType || '',
      features: service.features?.join(', ') || '',
      images: []
    });
    setImageFiles([]);
    setShowForm(true);
  };

  const handleDelete = async (serviceId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce service?')) {
      return;
    }

    try {
      const token = localStorage.getItem('atlasia_access_token');
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/api/services/${serviceId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      fetchServices();
      alert('Service supprimé avec succès!');
    } catch (err) {
      console.error('Error deleting service:', err);
      alert('Erreur lors de la suppression du service');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingService(null);
    setFormData({
      title: '',
      description: '',
      price: '',
      priceUnit: 'fixed',
      location: '',
      contactPhone: '',
      contactEmail: '',
      serviceType: '',
      features: '',
      images: []
    });
    setImageFiles([]);
    setFieldErrors({});
    setValidationErrors([]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <span className="ml-3 text-gray-600">Chargement...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mes Services</h2>
          <p className="text-gray-600 mt-1">Gérez vos offres de services pour les clients</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-700 hover:bg-green-800 text-white rounded-xl transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Ajouter un service</span>
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">
            {editingService ? 'Modifier le service' : 'Nouveau service'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titre du service <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className={`w-full px-4 py-2 border-2 rounded-xl focus:ring-2 outline-none ${
                    fieldErrors.title 
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-200' 
                      : 'border-gray-200 focus:border-green-600 focus:ring-green-200'
                  }`}
                  required
                  maxLength={100}
                />
                {fieldErrors.title && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <ExclamationTriangleIcon className="w-4 h-4" />
                    {fieldErrors.title}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type de service <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.serviceType}
                  onChange={(e) => handleInputChange('serviceType', e.target.value)}
                  className={`w-full px-4 py-2 border-2 rounded-xl focus:ring-2 outline-none bg-white ${
                    fieldErrors.serviceType 
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-200' 
                      : 'border-gray-200 focus:border-green-600 focus:ring-green-200'
                  }`}
                  required
                >
                  <option value="">Sélectionner</option>
                  {Object.entries(serviceLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                {fieldErrors.serviceType && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <ExclamationTriangleIcon className="w-4 h-4" />
                    {fieldErrors.serviceType}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className={`w-full px-4 py-2 border-2 rounded-xl focus:ring-2 outline-none ${
                  fieldErrors.description 
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-200' 
                    : 'border-gray-200 focus:border-green-600 focus:ring-green-200'
                }`}
                required
                maxLength={2000}
              />
              <div className="flex justify-between items-center mt-1">
                {fieldErrors.description ? (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <ExclamationTriangleIcon className="w-4 h-4" />
                    {fieldErrors.description}
                  </p>
                ) : (
                  <span className="text-xs text-gray-500">
                    {formData.description.length}/2000 caractères
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prix</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  className={`w-full px-4 py-2 border-2 rounded-xl focus:ring-2 outline-none ${
                    fieldErrors.price 
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-200' 
                      : 'border-gray-200 focus:border-green-600 focus:ring-green-200'
                  }`}
                  min="0"
                  step="0.01"
                />
                {fieldErrors.price && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <ExclamationTriangleIcon className="w-4 h-4" />
                    {fieldErrors.price}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unité de prix</label>
                <select
                  value={formData.priceUnit}
                  onChange={(e) => handleInputChange('priceUnit', e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-green-600 focus:ring-2 focus:ring-green-200 outline-none bg-white"
                >
                  {Object.entries(priceUnitLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Localisation <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className={`w-full px-4 py-2 border-2 rounded-xl focus:ring-2 outline-none ${
                    fieldErrors.location 
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-200' 
                      : 'border-gray-200 focus:border-green-600 focus:ring-green-200'
                  }`}
                  required
                  maxLength={200}
                />
                {fieldErrors.location && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <ExclamationTriangleIcon className="w-4 h-4" />
                    {fieldErrors.location}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone de contact 
                  <span className="text-xs text-gray-500 ml-1">(10 chiffres)</span>
                </label>
                <input
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                  className={`w-full px-4 py-2 border-2 rounded-xl focus:ring-2 outline-none ${
                    fieldErrors.contactPhone 
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-200' 
                      : 'border-gray-200 focus:border-green-600 focus:ring-green-200'
                  }`}
                  maxLength={10}
                  placeholder="0612345678"
                />
                <div className="flex justify-between items-center mt-1">
                  {fieldErrors.contactPhone ? (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <ExclamationTriangleIcon className="w-4 h-4" />
                      {fieldErrors.contactPhone}
                    </p>
                  ) : formData.contactPhone ? (
                    <span className="text-xs text-gray-500">
                      {formData.contactPhone.length}/10 chiffres
                    </span>
                  ) : null}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email de contact</label>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                  className={`w-full px-4 py-2 border-2 rounded-xl focus:ring-2 outline-none ${
                    fieldErrors.contactEmail 
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-200' 
                      : 'border-gray-200 focus:border-green-600 focus:ring-green-200'
                  }`}
                />
                {fieldErrors.contactEmail && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <ExclamationTriangleIcon className="w-4 h-4" />
                    {fieldErrors.contactEmail}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Caractéristiques (séparées par des virgules)</label>
              <input
                type="text"
                value={formData.features}
                onChange={(e) => handleInputChange('features', e.target.value)}
                placeholder="Ex: WiFi gratuit, Parking, Accessible PMR"
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-green-600 focus:ring-2 focus:ring-green-200 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Images (max 5)
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-green-600 focus:ring-2 focus:ring-green-200 outline-none"
              />
              {imageFiles.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {imageFiles.map((file, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${index + 1}`}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl transition-colors font-semibold"
              >
                <XMarkIcon className="w-5 h-5" />
                <span>Annuler</span>
              </button>
              <button
                type="submit"
                disabled={saving}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-700 hover:bg-green-800 text-white rounded-xl transition-colors font-semibold ${
                  saving ? 'opacity-60 cursor-not-allowed' : ''
                }`}
              >
                <CheckIcon className="w-5 h-5" />
                <span>{saving ? 'Enregistrement...' : editingService ? 'Mettre à jour' : 'Créer le service'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Services List */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {services.length === 0 && !showForm ? (
        <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
          <PhotoIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Aucun service pour le moment
          </h3>
          <p className="text-gray-500 mb-6">
            Commencez par ajouter votre premier service pour que les clients puissent vous trouver
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-700 hover:bg-green-800 text-white rounded-xl transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Ajouter un service</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {services.map((service) => (
            <div key={service._id} className="bg-white rounded-xl shadow-md overflow-hidden">
              {service.images && service.images.length > 0 && (
                <img
                  src={service.images[0]}
                  alt={service.title}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{service.title}</h3>
                    <p className="text-sm text-green-600">{serviceLabels[service.serviceType] || service.serviceType}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    service.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {service.status === 'published' ? 'Publié' : 'Brouillon'}
                  </span>
                </div>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{service.description}</p>
                
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>📍 {service.location}</span>
                  {service.price > 0 && (
                    <span className="font-semibold text-green-700">
                      {service.price} MAD {priceUnitLabels[service.priceUnit] || ''}
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(service)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors"
                  >
                    <PencilIcon className="w-4 h-4" />
                    <span>Modifier</span>
                  </button>
                  <button
                    onClick={() => handleDelete(service._id)}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

