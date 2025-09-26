import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../api';
import S3ImageUpload from '../../components/S3ImageUpload';
import S3Image from '../../components/S3Image';
import { FaArrowLeft } from 'react-icons/fa';

// Icons for property types
import { ReactComponent as AppartementIconBlack } from "../../assets/icons/Properties/appartementBlack.svg";
import { ReactComponent as AppartementIconGreen } from "../../assets/icons/Properties/appartementGreen.svg";
import { ReactComponent as VillaIconBlack } from "../../assets/icons/Properties/villaBlack.svg";
import { ReactComponent as VillaIconGreen } from "../../assets/icons/Properties/villaGreen.svg";
import { ReactComponent as ChaletIconBlack } from "../../assets/icons/Properties/chaletBlack.svg";
import { ReactComponent as ChaletIconGreen } from "../../assets/icons/Properties/chaletGreen.svg";
import { ReactComponent as StudioIconBlack } from "../../assets/icons/Properties/studioBlack.svg";
import { ReactComponent as StudioIconGreen } from "../../assets/icons/Properties/studioGreen.svg";

// Icons for info types
import { ReactComponent as GuestsIcon } from "../../assets/icons/Properties/guests.svg";
import { ReactComponent as RoomsIcon } from "../../assets/icons/Properties/rooms.svg";
import { ReactComponent as BedsIcon } from "../../assets/icons/Properties/beds.svg";
import { ReactComponent as BathsIcon } from "../../assets/icons/Properties/baths.svg";

// Icons for equipment
import { ReactComponent as WifiBlack } from "../../assets/icons/PropertyEquipment/wifiBlack.svg";
import { ReactComponent as WifiGreen } from "../../assets/icons/PropertyEquipment/wifiGreen.svg";
import { ReactComponent as TvBlack } from "../../assets/icons/PropertyEquipment/tvBlack.svg";
import { ReactComponent as TvGreen } from "../../assets/icons/PropertyEquipment/tvGreen.svg";
import { ReactComponent as WasherBlack } from "../../assets/icons/PropertyEquipment/washerBlack.svg";
import { ReactComponent as WasherGreen } from "../../assets/icons/PropertyEquipment/washerGreen.svg";
import { ReactComponent as AcBlack } from "../../assets/icons/PropertyEquipment/acBlack.svg";
import { ReactComponent as AcGreen } from "../../assets/icons/PropertyEquipment/acGreen.svg";
import { ReactComponent as HeaterBlack } from "../../assets/icons/PropertyEquipment/heaterBlack.svg";
import { ReactComponent as HeaterGreen } from "../../assets/icons/PropertyEquipment/heaterGreen.svg";
import { ReactComponent as KitchenBlack } from "../../assets/icons/PropertyEquipment/kitchenBlack.svg";
import { ReactComponent as KitchenGreen } from "../../assets/icons/PropertyEquipment/kitchenGreen.svg";
import { ReactComponent as ParkingBlack } from "../../assets/icons/PropertyEquipment/parkingBlack.svg";
import { ReactComponent as ParkingGreen } from "../../assets/icons/PropertyEquipment/parkingGreen.svg";
import { ReactComponent as PoolBlack } from "../../assets/icons/PropertyEquipment/poolBlack.svg";
import { ReactComponent as PoolGreen } from "../../assets/icons/PropertyEquipment/poolGreen.svg";
import { ReactComponent as PlaygroundBlack } from "../../assets/icons/PropertyEquipment/playgroundBlack.svg";
import { ReactComponent as PlaygroundGreen } from "../../assets/icons/PropertyEquipment/playgroundGreen.svg";

const API_BASE = process.env.REACT_APP_API_URL;

const cities = [
  "Ifrane", "Fès", "Marrakech", "Casablanca", "Rabat", "Agadir", "Tanger"
];

const propertyTypes = [
  { label: "Appartement", iconActive: AppartementIconGreen, iconInactive: AppartementIconBlack },
  { label: "Villa", iconActive: VillaIconGreen, iconInactive: VillaIconBlack },
  { label: "Chalet", iconActive: ChaletIconGreen, iconInactive: ChaletIconBlack },
  { label: "Studio / Chambre", iconActive: StudioIconGreen, iconInactive: StudioIconBlack },
];

const infoTypes = [
  { label: "Invités", icon: GuestsIcon, key: "guests", min: 1 },
  { label: "Chambres", icon: RoomsIcon, key: "bedrooms", min: 0 },
  { label: "Lits", icon: BedsIcon, key: "beds", min: 0 },
  { label: "Salles de bain", icon: BathsIcon, key: "bathrooms", min: 0 },
];

const equipmentsList = [
  { label: "Wifi", iconActive: WifiGreen, iconInactive: WifiBlack },
  { label: "TV", iconActive: TvGreen, iconInactive: TvBlack },
  { label: "Lave-linge", iconActive: WasherGreen, iconInactive: WasherBlack },
  { label: "Climatisation", iconActive: AcGreen, iconInactive: AcBlack },
  { label: "Chauffage", iconActive: HeaterGreen, iconInactive: HeaterBlack },
  { label: "Cuisine", iconActive: KitchenGreen, iconInactive: KitchenBlack },
  { label: "Parking", iconActive: ParkingGreen, iconInactive: ParkingBlack },
  { label: "Piscine", iconActive: PoolGreen, iconInactive: PoolBlack },
  { label: "Aire de jeux", iconActive: PlaygroundGreen, iconInactive: PlaygroundBlack },
];

export default function PropertyCreationSinglePage() {
  const navigate = useNavigate();
  const { user, token } = useContext(AuthContext);
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form data state
  const [formData, setFormData] = useState({
    localisation: {
      city: '',
      address: '',
      postalCode: ''
    },
    propertyType: '',
    info: {
      guests: 1,
      bedrooms: 0,
      beds: 0,
      bathrooms: 0
    },
    equipments: [],
    photos: [],
    title: '',
    description: '',
    price: '',
    documents: {}
  });

  // Step navigation logic (following package creation pattern)
  const handleNext = () => {
    if (currentStep < 9) {
      console.log('Previous step validation result:', validateStep(currentStep));
      if (!validateStep(currentStep)) {
        setError(getValidationErrorMessage(currentStep));
        return;
      }
      setCurrentStep(currentStep + 1);
      setError('');
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError('');
    }
  };

  const handleStepClick = (stepNumber) => {
    if (stepNumber <= currentStep) {
      setCurrentStep(stepNumber);
      setError('');
    }
  };

  const handleInputChange = (field, value, parentKey = null) => {
    setFormData(prev => {
      if (parentKey) {
        return {
          ...prev,
          [parentKey]: {
            ...prev[parentKey],
            [field]: value
          }
        };
      }
      return {
        ...prev,
        [field]: value
      };
    });
  };

  const handleEquipmentToggle = (equipment) => {
    setFormData(prev => ({
      ...prev,
      equipments: prev.equipments.includes(equipment)
        ? prev.equipments.filter(e => e !== equipment)
        : [...prev.equipments, equipment]
    }));
  };

  // Enhanced upload handler with comprehensive error handling
  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;
    
    // Check if we have reached limit
    const currentPhotoCount = formData.photos.length;
    const maxPhotos = 4;
    
    if (currentPhotoCount + files.length > maxPhotos) {
      setError(`Maximum ${maxPhotos} photos autorisées. (${currentPhotoCount}/${maxPhotos} + ${files.length} fichiers sélectionnés)`);
      event.target.value = '';
      return;
    }
    
    console.log('📤 Processing files:', files.map(f => f.name));
    setError('');
    
    try {
      // Upload to S3 using enhanced service 
      const { uploadFileToS3 } = await import('../../utilities/s3Service');
      console.log('🔄 Starting S3 uploads...');
      
      const uploadPromises = files.map(async (file) => {
        console.log('📤 Processing file:', file.name, file.type, file.size);
        
        try {
          const result = await uploadFileToS3(file, 'photos');
          
          console.log('✅ Upload result received for', file.name, ':', result);
          
          // Extract photo URL with multiple fallback methods
          let photoUrl = null;
          
          if (result && typeof result === 'object') {
            // Try standard format first
            photoUrl = result.url || result.key || result.location;
            console.log('📸 Standard format URL for', file.name, ':', photoUrl);
            
            // Try alternative names
            if (!photoUrl) {
              photoUrl = result.fileUrl || result.downloadUrl || result.uploadUrl;
              console.log('📸 Alternative format URL for', file.name, ':', photoUrl);
            }
            
            // Try any string in the object that looks like a URL
            if (!photoUrl) {
              const entries = Object.values(result);
              for (const value of entries) {
                if (typeof value === 'string' && value.length > 10 && value.includes('http')) {
                  photoUrl = value;
                  console.log('📸 Found URL in result object for', file.name, ':', photoUrl);
                  break;
                }
              }
            }
          } else if (typeof result === 'string') {
            photoUrl = result;
            console.log('📸 Result is direct string URL for', file.name, ':', photoUrl);
          }
          
          if (photoUrl && photoUrl.length > 10 && (photoUrl.includes('http') || photoUrl.includes('amazonaws'))) {
            console.log('✅ Valid photo URL confirmed for', file.name, ':', photoUrl);
            return photoUrl;
          } else {
            console.error('❌ Invalid photo URL extracted for', file.name, ':', result);
            throw new Error(`URL invalide reçue du serveur pour ${file.name}: ${JSON.stringify(result, null, 2)}`);
          }
        } catch (fileError) {
          console.error('❌ Upload error for file', file.name, ':', fileError);
          
          const errorMessage = fileError?.message || fileError?.toString() || 'Erreur inconnue';
          
          // Try to extract URL even from errors (backend inconsistency handling)
          if (errorMessage.toLowerCase().includes('successfully') || errorMessage.toLowerCase().includes('uploaded')) {
            console.log('⚠️ Backend marked successful upload as error for', file.name);
            
            // Try to extract URL from error response
            let urlFromError = null;
            
            if (fileError.response?.data?.url || fileError.response?.data?.key) {
              urlFromError = fileError.response.data.url || fileError.response.data.key;
            } else {
              // Search error message for URLs
              const urlMatch = errorMessage.match(/https?:\/\/[^\s\n\)]+/i);
              if (urlMatch) {
                urlFromError = urlMatch[0];
              }
            }
            
            if (urlFromError) {
              console.log('✅ Extracted URL from error response for', file.name, ':', urlFromError);
              return urlFromError;
            }
          }
          
          throw fileError;
        }
      });
      
      // Wait for all uploads to complete
      const photoUrls = await Promise.all(uploadPromises);
      console.log('📸 All uploads completed:', photoUrls);
      
      // Add all URLs to photos array
      setFormData(prev => ({
        ...prev,
        photos: [...prev.photos, ...photoUrls]
      }));
      
      console.log('✅ All photos added to form successfully!', photoUrls.length, 'uploaded');
      setError('');
      
    } catch (error) {
      console.error('❌ Upload error caught:', error);
      const errorMessage = error?.message || error?.toString() || 'Erreur inconnue';
      setError(`Erreur lors du téléchargement: ${errorMessage}. Certaines photos peuvent avoir été uploadées.`);
    }
    
    // Clear the input
    event.target.value = '';
  };

  const handleRemovePhoto = (index) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const handleDocumentUpload = (event, documentType) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setFormData(prev => ({
      ...prev,
      documents: {
        ...prev.documents,
        [documentType]: files
      }
    }));
    
    // Clear the input
    event.target.value = '';
  };

  const handleRemoveDocument = (documentType, index) => {
    setFormData(prev => ({
      ...prev,
      documents: {
        ...prev.documents,
        [documentType]: prev.documents[documentType]?.filter((_, i) => i !== index) || []
      }
    }));
  };

  // Step validation functions
  const validateStep = (step) => {
    switch (step) {
      case 1:
        return formData.localisation.city && formData.localisation.address && formData.localisation.postalCode;
      case 2:
        return formData.propertyType !== '';
      case 3:
        return formData.info.guests >= 1;
      case 4:
        return true; // Equipment step is optional
      case 5:
        return formData.photos.length > 0;
      case 6:
        return formData.title.trim() !== '' && formData.description.trim() !== '';
      case 7:
        return formData.price && parseFloat(formData.price) > 0;
      case 8:
        return Object.values(formData.documents).some(docs => docs && docs.length > 0); // Check if any documents exist
      default:
        return true;
    }
  };

  const getValidationErrorMessage = (step) => {
    switch (step) {
      case 1:
        return 'Veuillez remplir la localisation complète de votre propriété';
      case 2:
        return 'Veuillez sélectionner un type de propriété';
      case 3:
        return 'Le nombre d\'invités doit être d\'au moins 1';
      case 4:
        return 'Aucun équipement sélectionné (optionnel - peut être complété plus tard)';
      case 5:
        return 'Veuillez ajouter au moins une photo de votre propriété';
      case 6:
        return 'Veuillez saisir un titre et une description pour votre propriété';
      case 7:
        return 'Veuillez saisir un prix valide par nuit';
      case 8:
        return 'Veuillez télécharger au moins un document légal';
      default:
        return 'Étape invalide';
    }
  };

  const handleSaveDraft = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const payload = { ...formData, isDraft: true };
      console.log('💾 Saving property draft with payload:', payload);
      
      const response = await fetch(`${API_BASE}/api/property`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Property draft saved successfully:', data);
        alert('Brouillon enregistré avec succès!');
        navigate('/owner-welcome');
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Failed to save draft' }));
        console.error('❌ Draft save error:', response.status, errorData);
        
        // Check for token expiration
        if (response.status === 401 || response.status === 403) {
          console.log('🔐 Token expired during draft save');
          alert('Votre session a expiré. Veuillez vous reconnecter.');
          navigate('/login');
          return;
        }
        
        setError(`Erreur lors de l'enregistrement: ${errorData.message}`);
      }
    } catch (err) {
      console.error('❌ Draft save error:', err);
      setError(`Erreur lors de l'enregistrement du brouillon: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublish = async () => {
    const validationErrors = [];
    
    if (!validateStep(1)) validationErrors.push('Localisation requise');
    if (!validateStep(2)) validationErrors.push('Type de propriété requis');
    if (!validateStep(3)) validationErrors.push('Nombre d\'invités requis');
    if (!validateStep(5)) validationErrors.push('Au moins une photo requise');
    if (!validateStep(6)) validationErrors.push('Titre et description requis');
    if (!validateStep(7)) validationErrors.push('Prix requis');
    if (!validateStep(8)) validationErrors.push('Documents légaux requis');

    if (validationErrors.length > 0) {
      setError(`Veuillez compléter les étapes requises: ${validationErrors.join(', ')}`);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const payload = { 
        ...formData, 
        isDraft: false, // Ensure publish flag is explicit
        status: 'published' // Explicit status setting
      };
      console.log('🚀 Creating property for publish with payload:', payload);
      
      const response = await fetch(`${API_BASE}/api/property`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Property created successfully:', data);
        alert('Propriété créée et publiée avec succès!');
        navigate('/owner-welcome');
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Failed to create property' }));
        console.error('❌ Create error:', response.status, errorData);
        
        if (response.status === 401 || response.status === 403) {
          console.log('🔐 Token expired during property creation');
          alert('Votre session a expiré. Veuillez vous reconnecter.');
          navigate('/login');
          return;
        }
        
        setError(`Erreur lors de la création: ${errorData.message}`);
      }
    } catch (err) {
      console.error('❌ Property creation error:', err);
      setError(`Erreur lors de la création de la propriété: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    'Localisation',
    'Type de propriété',
    'Informations',
    'Équipements',
    'Photos',
    'Titre & Description',
    'Prix',
    'Documents',
    'Confirmation'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28">
        {/* Mobile-Optimized Progress Bar */}
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-6">
          <div className="mb-6">
            {/* Mobile Progress Steps */}
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
                  <span className="text-xs mt-1 text-gray-600 font-medium text-center leading-tight sm:hidden">
                    {(() => {
                      const frenchSteps = ['Localisation', 'Type', 'Infos', 'Équipements', 'Photos', 'Titre & Desc', 'Prix', 'Documents', 'Confirm'];
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
                Étape {currentStep} sur {steps.length}
              </span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* Step 1: Location */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Localisation</h2>
                <p className="text-gray-600">Où se trouve votre propriété ?</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ville
                  </label>
                  <select
                    value={formData.localisation.city}
                    onChange={(e) => handleInputChange('city', e.target.value, 'localisation')}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                  >
                    <option value="">Sélectionnez une ville</option>
                    {cities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adresse
                  </label>
                  <input
                    type="text"
                    value={formData.localisation.address}
                    onChange={(e) => handleInputChange('address', e.target.value, 'localisation')}
                    placeholder="Ex: 123 Rue de la Paix"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Code postal
                  </label>
                  <input
                    type="text"
                    value={formData.localisation.postalCode}
                    onChange={(e) => handleInputChange('postalCode', e.target.value, 'localisation')}
                    placeholder="Ex: 53000"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Property Type */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Type de propriété</h2>
                <p className="text-gray-600">Quel type de logement proposez-vous ?</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {propertyTypes.map((type, index) => {
                  const IconComponent = formData.propertyType === type.label ? type.iconActive : type.iconInactive;
                  const isSelected = formData.propertyType === type.label;
                  
                  return (
                    <div
                      key={index}
                      onClick={() => handleInputChange('propertyType', type.label)}
                      className={`border-2 rounded-xl p-6 cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
                        isSelected 
                          ? 'border-green-500 bg-green-50 shadow-lg scale-105' 
                          : 'border-gray-200 hover:border-green-300 bg-white'
                      }`}
                    >
                      <div className="flex flex-col items-center space-y-4">
                        <IconComponent className="w-12 h-12" />
                        <span className="font-semibold text-gray-900">{type.label}</span>
                        {isSelected && (
                          <div className="flex items-center text-green-600 text-sm font-medium">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Sélectionné
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: Property Info */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Informations</h2>
                <p className="text-gray-600">Précisez les détails de votre propriété</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {infoTypes.map((info, index) => (
                  <div key={index} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <info.icon className="w-6 h-6 text-green-600" />
                        <span className="font-medium text-gray-900">{info.label}</span>
                      </div>
                      <div className="flex items-center space-x-3 bg-white rounded-lg border border-gray-200 p-1">
                        <button
                          onClick={() => handleInputChange(info.key, Math.max(info.min, formData.info[info.key] - 1), 'info')}
                          className="w-8 h-8 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-bold transition-colors"
                          disabled={formData.info[info.key] <= info.min}
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-semibold text-gray-900">{formData.info[info.key]}</span>
                        <button
                          onClick={() => handleInputChange(info.key, formData.info[info.key] + 1, 'info')}
                          className="w-8 h-8 rounded-md bg-green-100 hover:bg-green-200 flex items-center justify-center text-green-600 font-bold transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Equipment */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Équipements</h2>
                <p className="text-gray-600">Quels équipements offrez-vous ?</p>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-2">
                  <div className="bg-blue-100 rounded-full p-1">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-blue-900">
                    Cette étape est optionnelle - vous pouvez la compléter plus tard
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {equipmentsList.map((equipment, index) => {
                  const IconComponent = formData.equipments.includes(equipment.label) ? equipment.iconActive : equipment.iconInactive;
                  const isSelected = formData.equipments.includes(equipment.label);
                  
                  return (
                    <div
                      key={index}
                      onClick={() => handleEquipmentToggle(equipment.label)}
                      className={`border-2 rounded-xl p-4 cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                        isSelected 
                          ? 'border-green-500 bg-green-50 shadow-lg scale-105' 
                          : 'border-gray-200 hover:border-green-300 bg-white'
                      }`}
                    >
                      <div className="flex flex-col items-center space-y-3">
                        <IconComponent className="w-8 h-8" />
                        <span className="text-sm font-medium text-gray-900 text-center">{equipment.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 5: Photos */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Photos</h2>
                <p className="text-gray-600">Ajoutez quelques photos de votre propriété</p>
              </div>
              
              {/* Photos section */}
              <div className="space-y-6">
                {/* Photos header */}
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Mes photos ({formData.photos.length}/4)
                  </h3>
                  {formData.photos.length > 0 && (
                    <button
                      onClick={() => {
                        setFormData(prev => ({ ...prev, photos: [] }));
                        console.log('🗑️ All photos cleared');
                      }}
                      className="text-red-500 text-sm hover:text-red-700"
                    >
                      Effacer tout
                    </button>
                  )}
                </div>

                {/* Photos grid */}
                {formData.photos.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {formData.photos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 shadow-lg">
                          <img
                            src={photo}
                            alt={`Photo ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.error(`❌ Image ${index + 1} failed to load:`, photo);
                              e.target.src = '/placeholder.jpg';
                            }}
                            onLoad={() => {
                              console.log(`✅ Image ${index + 1} loaded:`, photo);
                            }}
                          />
                        </div>
                        <button
                          onClick={() => handleRemovePhoto(index)}
                          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                        <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                          Photo {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload section */}
                {formData.photos.length < 4 && (
                  <div className="space-y-4">
                    {/* Upload area */}
                    <div
                      className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-gray-400 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => document.getElementById('photo-upload-input').click()}
                    >
                      <div className="text-gray-400">
                        <svg className="h-12 w-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <h4 className="text-lg font-medium text-gray-900 mb-2">Upload Photos</h4>
                      <p className="text-sm text-gray-500 mb-4">Click to upload multiple photos or drag and drop</p>
                      <p className="text-xs text-gray-400">JPG, JPEG, PNG up to 5MB each (max 4 photos)</p>
                    </div>

                    {/* Hidden file input */}
                    <input
                      id="photo-upload-input"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 6: Title & Description */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Titre & Description</h2>
                <p className="text-gray-600">Donnez un titre accrocheur et décrivez votre propriété en détail</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Titre de votre propriété</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Ex: Magnifique villa avec piscine au cœur de Marrakech"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 text-gray-900"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows="6"
                    placeholder="Décrivez votre propriété, ses avantages, et ce qui la rend unique..."
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 resize-none text-gray-900"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 7: Price */}
          {currentStep === 7 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Prix</h2>
                <p className="text-gray-600">Quel est le prix par nuit de votre propriété ?</p>
              </div>
              
              <div className="relative">
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-3 pr-16 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 text-gray-900 text-xl font-semibold"
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                  MAD/nuit
                </div>
              </div>
            </div>
          )}

          {/* Step 8: Documents */}
          {currentStep === 8 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Documents Légaux</h2>
                <p className="text-gray-600">Téléchargez vos documents légaux pour vérification</p>
              </div>
              
              <div className="space-y-4">
                {[
                  { id: 'property_deed', name: 'Acte de propriété', description: 'Acte notarié ou titre de propriété attestant votre droit de propriété sur le bien' },
                  { id: 'identity', name: 'Pièce d\'identité', description: 'Carte nationale d\'identité, passeport ou permis de conduire en cours de validité' },
                  { id: 'tax_certificate', name: 'Certificat fiscal foncier', description: 'Certificat de non opposition ou de paiement de la taxe foncière daté de moins de 3 mois' },
                  { id: 'municipal_certificate', name: 'Attestation administrative', description: 'Attestation de la municipalité ou de l\'administration locale prouvant que le bien est autorisé à la location' }
                ].map((docType) => (
                  <div key={docType.id} className="border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-green-500 transition-colors">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900 mb-2">{docType.name}</div>
                      <div className="text-sm text-gray-600 mb-4">{docType.description}</div>
                      
                      <div className="relative">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          multiple
                          onChange={(e) => handleDocumentUpload(e, docType.id)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <button 
                          type="button"
                          className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
                        >
                          {formData.documents[docType.id]?.length > 0 
                            ? `${formData.documents[docType.id].length} fichier(s) sélectionné(s)`
                            : 'Télécharger des fichiers'
                          }
                        </button>
                      </div>
                      
                      {formData.documents[docType.id]?.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {formData.documents[docType.id].map((file, index) => (
                            <div key={index} className="flex items-center justify-between bg-green-50 px-3 py-2 rounded-lg">
                              <span className="text-sm text-green-700 truncate">{file.name}</span>
                              <button
                                onClick={() => handleRemoveDocument(docType.id, index)}
                                className="ml-2 text-red-500 hover:text-red-700"
                              >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 9: Confirmation */}
          {currentStep === 9 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Confirmation</h2>
                <p className="text-gray-600">Vérifiez les informations de votre propriété avant publication</p>
              </div>

              {/* Confirmation Details */}
              <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
                {/* Location */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">📍 Localisation</h3>
                  <p className="text-gray-700">{formData.localisation.address}</p>
                  <p className="text-gray-600">{formData.localisation.city}, {formData.localisation.postalCode}</p>
                </div>

                {/* Property Type & Info */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">🏠 Type de propriété</h3>
                  <p className="text-gray-700 mb-2">{formData.propertyType}</p>
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>👥 Invités: {formData.info.guests}</div>
                    <div>🛏️ Chambres: {formData.info.bedrooms}</div>
                    <div>🛏️ Lits: {formData.info.beds}</div>
                    <div>🚿 Salles de bain: {formData.info.bathrooms}</div>
                  </div>
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">📝 Titre & Description</h3>
                  <p className="text-gray-800 font-medium mb-2">{formData.title}</p>
                  <p className="text-gray-600">{formData.description}</p>
                </div>

                {/* Price */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">💰 Prix</h3>
                  <p className="text-green-600 font-semibold text-lg">{formData.price} MAD/nuit</p>
                </div>

                {/* Photos section preview */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">📸 Photos</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {formData.photos.length > 0 ? (
                      formData.photos.slice(0, 4).map((photo, index) => (
                        <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                          {photo.includes('https') ? (
                            <img
                              className="w-full h-full object-cover"
                              src={photo}
                              alt="Property preview"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full bg-gray-200">
                              📷
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 sm:col-span-4 text-center py-4 text-gray-500">
                        No photos uploaded
                      </div>
                    )}
                  </div>
                </div>

                {/* Documents section preview */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">📄 Documents</h3>
                  {Object.keys(formData.documents).length > 0 ? (
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(formData.documents).map(([docType, files]) => 
                        files && files.length > 0 ? (
                          <div key={docType} className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
                            <span className="text-sm text-green-700">
                              {docType === 'property_deed' ? 'Acte de propriété' :
                               docType === 'identity' ? 'Pièce d\'identité' :
                               docType === 'tax_certificate' ? 'Certificat fiscal foncier' :
                               docType === 'municipal_certificate' ? 'Attestation admin' : docType}
                            </span>
                            <span className="text-xs text-green-600">{files.length} fichier(s)</span>
                          </div>
                        ) : null
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500">Aucun document uploadé</p>
                  )}
                </div>

                {/* Equipment section preview */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">⚙️ Équipements</h3>
                  {formData.equipments && formData.equipments.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {formData.equipments.map((equip) => (
                        <span key={equip} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                          {equip === 'wifi' ? 'Wi-Fi' :
                           equip === 'tv' ? 'TV' :
                           equip === 'washer' ? 'Machine à laver' :
                           equip === 'ac' ? 'Climatisé' :
                           equip === 'heater' ? 'Chauffage' :
                           equip === 'kitchen' ? 'Cuisine' :
                           equip === 'parking' ? 'Parking' :
                           equip === 'pool' ? 'Piscine' : equip}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">Aucun équipement sélectionné</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mt-6">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
            {/* Left Side - Back Button */}
            <div className="w-full sm:w-auto">
              {currentStep > 1 && (
                <button
                  onClick={handlePrev}
                  className="flex items-center justify-center w-full sm:w-auto px-4 py-3 font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-200"
                >
                  <FaArrowLeft className="w-4 h-4 mr-2" />
                  Retour
                </button>
              )}
            </div>

            {/* Right Side - Action Buttons */}
            <div className="flex space-x-3 w-full sm:w-auto">
              {currentStep < 9 ? (
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
                      {isLoading ? 'Publication...' : 'Publier Propriété'}
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
}
