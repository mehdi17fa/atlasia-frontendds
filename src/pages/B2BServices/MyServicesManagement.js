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
  
  // Restaurant-specific state
  const [menuMode, setMenuMode] = useState('txt'); // 'txt' or 'manual'
  const [menuTxtFile, setMenuTxtFile] = useState(null);
  const [parsedMenuItems, setParsedMenuItems] = useState([]);
  const [manualMenuItems, setManualMenuItems] = useState([{ name: '', price: '', description: '' }]);
  const [tableCount, setTableCount] = useState('');
  const [tableCapacity, setTableCapacity] = useState('4'); // Default capacity per table

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

  // Parse TXT file with format: "name"  "price"  "description"
  const parseMenuTxtFile = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target.result;
          const lines = text.split('\n').filter(line => line.trim());
          const items = [];
          
          for (const line of lines) {
            // Match pattern: "name"  "price"  "description"
            // Using regex to match quoted strings with spaces preserved
            const match = line.match(/^"([^"]+)"\s+"([^"]+)"\s+"([^"]+)"$/);
            if (match) {
              const [, name, priceStr, description] = match;
              const price = parseFloat(priceStr.trim());
              
              if (name.trim() && !isNaN(price) && price >= 0 && description.trim()) {
                items.push({
                  name: name.trim(),
                  price: price,
                  description: description.trim(),
                  isAvailable: true
                });
              }
            }
          }
          
          if (items.length === 0) {
            reject(new Error('Aucun élément de menu valide trouvé dans le fichier. Vérifiez le format.'));
            return;
          }
          
          resolve(items);
        } catch (error) {
          reject(new Error('Erreur lors de la lecture du fichier: ' + error.message));
        }
      };
      reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'));
      reader.readAsText(file);
    });
  };

  const handleMenuTxtFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.type !== 'text/plain' && !file.name.endsWith('.txt')) {
      alert('Veuillez sélectionner un fichier TXT');
      return;
    }
    
    try {
      const items = await parseMenuTxtFile(file);
      setParsedMenuItems(items);
      setMenuTxtFile(file);
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.menuTxt;
        return newErrors;
      });
    } catch (error) {
      alert(error.message);
      setMenuTxtFile(null);
      setParsedMenuItems([]);
      setFieldErrors(prev => ({ ...prev, menuTxt: error.message }));
    }
  };

  const handleManualMenuChange = (index, field, value) => {
    const updated = [...manualMenuItems];
    updated[index] = { ...updated[index], [field]: value };
    setManualMenuItems(updated);
  };

  const addManualMenuItem = () => {
    setManualMenuItems([...manualMenuItems, { name: '', price: '', description: '' }]);
  };

  const removeManualMenuItem = (index) => {
    if (manualMenuItems.length > 1) {
      setManualMenuItems(manualMenuItems.filter((_, i) => i !== index));
    }
  };

  const handleMenuModeChange = (mode) => {
    setMenuMode(mode);
    if (mode === 'txt') {
      setManualMenuItems([{ name: '', price: '', description: '' }]);
    } else {
      setMenuTxtFile(null);
      setParsedMenuItems([]);
    }
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
    
    // Restaurant-specific validation
    if (formData.serviceType === 'restaurant') {
      // Validate menu
      if (menuMode === 'txt') {
        if (!menuTxtFile || parsedMenuItems.length === 0) {
          errors.menuTxt = 'Veuillez télécharger un fichier TXT avec le menu valide';
          validationErrors.push('Menu requis pour les restaurants');
        }
      } else {
        const validMenuItems = manualMenuItems.filter(item => 
          item.name.trim() && item.price && parseFloat(item.price) >= 0 && item.description.trim()
        );
        if (validMenuItems.length === 0) {
          errors.menuManual = 'Veuillez ajouter au moins un élément de menu valide';
          validationErrors.push('Menu requis pour les restaurants');
        }
      }
      
      // Validate table count
      const tableCountNum = parseInt(tableCount, 10);
      if (!tableCount || isNaN(tableCountNum) || tableCountNum < 1) {
        errors.tableCount = 'Veuillez entrer un nombre de tables valide (minimum 1)';
        validationErrors.push('Nombre de tables requis');
      }
    }
    
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

      // Restaurant-specific data
      if (formData.serviceType === 'restaurant') {
        let menuItems = [];
        
        if (menuMode === 'txt') {
          menuItems = parsedMenuItems;
        } else {
          menuItems = manualMenuItems
            .filter(item => item.name.trim() && item.price && item.description.trim())
            .map(item => ({
              name: item.name.trim(),
              price: parseFloat(item.price),
              description: item.description.trim(),
              isAvailable: true
            }));
        }
        
        // Create tables array
        const tableCountNum = parseInt(tableCount, 10);
        const capacityNum = parseInt(tableCapacity, 10) || 4;
        const tables = Array.from({ length: tableCountNum }, (_, i) => ({
          tableNumber: `T-${i + 1}`,
          capacity: capacityNum,
          isActive: true
        }));
        
        formDataToSend.append('menu', JSON.stringify(menuItems));
        formDataToSend.append('tables', JSON.stringify(tables));
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
      
      // Reset restaurant-specific state
      setMenuMode('txt');
      setMenuTxtFile(null);
      setParsedMenuItems([]);
      setManualMenuItems([{ name: '', price: '', description: '' }]);
      setTableCount('');
      setTableCapacity('4');
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
    
    // Reset restaurant-specific state
    setMenuMode('txt');
    setMenuTxtFile(null);
    setParsedMenuItems([]);
    setManualMenuItems([{ name: '', price: '', description: '' }]);
    setTableCount('');
    setTableCapacity('4');
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

            {/* Standard fields - hidden for restaurants */}
            {formData.serviceType !== 'restaurant' && (
              <>
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
              </>
            )}

            {/* Restaurant-specific fields */}
            {formData.serviceType === 'restaurant' && (
              <>
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

                {/* Menu Input Mode Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Méthode de saisie du menu <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-4 mb-4">
                    <button
                      type="button"
                      onClick={() => handleMenuModeChange('txt')}
                      className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all ${
                        menuMode === 'txt'
                          ? 'border-green-600 bg-green-50 text-green-700 font-semibold'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      📄 Fichier TXT
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMenuModeChange('manual')}
                      className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all ${
                        menuMode === 'manual'
                          ? 'border-green-600 bg-green-50 text-green-700 font-semibold'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      ✏️ Saisie manuelle
                    </button>
                  </div>

                  {/* TXT File Upload */}
                  {menuMode === 'txt' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Télécharger le fichier menu (.txt) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="file"
                          accept=".txt,text/plain"
                          onChange={handleMenuTxtFileChange}
                          className={`w-full px-4 py-2 border-2 rounded-xl focus:ring-2 outline-none ${
                            fieldErrors.menuTxt
                              ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
                              : 'border-gray-200 focus:border-green-600 focus:ring-green-200'
                          }`}
                        />
                        {fieldErrors.menuTxt && (
                          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                            <ExclamationTriangleIcon className="w-4 h-4" />
                            {fieldErrors.menuTxt}
                          </p>
                        )}
                      </div>

                      {/* Format Guide */}
                      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                        <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                          📋 Format requis du fichier TXT
                        </h4>
                        <p className="text-sm text-blue-800 mb-3">
                          Chaque ligne doit respecter exactement ce format (les espaces entre les guillemets sont importants) :
                        </p>
                        <div className="bg-white rounded-lg p-3 font-mono text-sm text-gray-800 border border-blue-300">
                          <div className="mb-2">"Nom du plat"  "Prix en MAD"  "Description courte"</div>
                          <div className="text-xs text-gray-600 mb-2">Exemple :</div>
                          <div className="space-y-1">
                            <div>"Couscous Royal"  "85"  "Couscous avec agneau, poulet et merguez"</div>
                            <div>"Tajine de poulet"  "65"  "Tajine traditionnel aux olives et citron"</div>
                            <div>"Pastilla"  "75"  "Feuilleté sucré-salé au pigeon"</div>
                          </div>
                        </div>
                        <p className="text-xs text-blue-700 mt-3">
                          ⚠️ Important : Utilisez des guillemets doubles (") et respectez les espaces entre les champs.
                        </p>
                      </div>

                      {/* Preview parsed menu */}
                      {parsedMenuItems.length > 0 && (
                        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                          <h4 className="font-semibold text-green-900 mb-2">
                            ✅ {parsedMenuItems.length} élément(s) de menu détecté(s)
                          </h4>
                          <div className="max-h-48 overflow-y-auto space-y-2">
                            {parsedMenuItems.map((item, index) => (
                              <div key={index} className="bg-white rounded-lg p-2 text-sm">
                                <div className="font-semibold">{item.name}</div>
                                <div className="text-gray-600">{item.description}</div>
                                <div className="text-green-700 font-semibold">{item.price} MAD</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Manual Menu Entry */}
                  {menuMode === 'manual' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="block text-sm font-medium text-gray-700">
                          Éléments du menu <span className="text-red-500">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={addManualMenuItem}
                          className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                        >
                          + Ajouter un élément
                        </button>
                      </div>
                      {manualMenuItems.map((item, index) => (
                        <div key={index} className="border-2 border-gray-200 rounded-xl p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Élément {index + 1}</span>
                            {manualMenuItems.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeManualMenuItem(index)}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                Supprimer
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Nom du plat *</label>
                              <input
                                type="text"
                                value={item.name}
                                onChange={(e) => handleManualMenuChange(index, 'name', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-green-600 focus:ring-1 focus:ring-green-200 outline-none"
                                placeholder="Ex: Couscous Royal"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Prix (MAD) *</label>
                              <input
                                type="number"
                                value={item.price}
                                onChange={(e) => handleManualMenuChange(index, 'price', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-green-600 focus:ring-1 focus:ring-green-200 outline-none"
                                placeholder="85"
                                min="0"
                                step="0.01"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Description *</label>
                              <input
                                type="text"
                                value={item.description}
                                onChange={(e) => handleManualMenuChange(index, 'description', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-green-600 focus:ring-1 focus:ring-green-200 outline-none"
                                placeholder="Description courte"
                                maxLength={200}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                      {fieldErrors.menuManual && (
                        <p className="text-sm text-red-600 flex items-center gap-1">
                          <ExclamationTriangleIcon className="w-4 h-4" />
                          {fieldErrors.menuManual}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Table Count */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre de tables <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={tableCount}
                      onChange={(e) => setTableCount(e.target.value)}
                      className={`w-full px-4 py-2 border-2 rounded-xl focus:ring-2 outline-none ${
                        fieldErrors.tableCount
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
                          : 'border-gray-200 focus:border-green-600 focus:ring-green-200'
                      }`}
                      min="1"
                      placeholder="Ex: 10"
                    />
                    {fieldErrors.tableCount && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <ExclamationTriangleIcon className="w-4 h-4" />
                        {fieldErrors.tableCount}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Capacité par table (personnes)
                    </label>
                    <input
                      type="number"
                      value={tableCapacity}
                      onChange={(e) => setTableCapacity(e.target.value)}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-green-600 focus:ring-2 focus:ring-green-200 outline-none"
                      min="1"
                      placeholder="4"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Toutes les tables auront la même capacité
                    </p>
                  </div>
                </div>
              </>
            )}

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

