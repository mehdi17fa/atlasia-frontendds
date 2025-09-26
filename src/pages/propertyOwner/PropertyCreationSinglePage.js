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
    documents: []
  });

  // Step navigation logic (following package creation pattern)
  const handleNext = () => {
    if (currentStep < 8) {
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
    setError('');
  };

  const handleEquipmentToggle = (equipment) => {
    setFormData(prev => ({
      ...prev,
      equipments: prev.equipments.includes(equipment)
        ? prev.equipments.filter(e => e !== equipment)
        : [...prev.equipments, equipment]
    }));
  };

  const handleAddPhoto = (result) => {
    if (formData.photos.length >= 4) {
      return;
    }
    
    let photoUrl = null;
    
    if (typeof result === 'string') {
      photoUrl = result;
    } else if (result && typeof result === 'object') {
      photoUrl = result.url || result.key || result.location || result.src;
    } else if (result && result.length > 0) {
      const firstResult = result[0];
      photoUrl = typeof firstResult === 'object' ? firstResult.url : firstResult;
    }
    
    if (!photoUrl) {
      setError('Erreur lors de l\'upload de l\'image. URL non trouvée.');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      photos: [...prev.photos, photoUrl]
    }));
    
    setError('');
  };

  const handleRemovePhoto = (index) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  // Step validation functions (following package creation pattern)
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
        return formData.title.trim() !== '';
      case 7:
        return formData.description.trim() !== '';
      case 8:
        return formData.price && parseFloat(formData.price) > 0;
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
        return 'Veuillez saisir un titre pour votre propriété';
      case 7:
        return 'Veuillez saisir une description de votre propriété';
      case 8:
        return 'Veuillez saisir un prix valide par nuit';
      default:
        return 'Étape invalide';
    }
  };

  const handleSaveDraft = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const payload = { ...formData };
      
      console.log('💾 Saving property draft with payload:', payload);
      
      const response = await fetch(`${API_BASE}/api/property`, {
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
        console.log('✅ Property draft saved successfully:', data);
        alert('Brouillon enregistré avec succès!');
        navigate('/owner-welcome');
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Failed to save draft' }));
        console.error('❌ Draft save error:', response.status, errorData);
        
        // Handle token expiration like in package creation
        if (response.status === 401) {
          setError('Votre session a expiré. Veuillez vous reconnecter.');
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
    // More detailed validation like in package creation
    const validationErrors = [];
    if (!validateStep(1)) validationErrors.push('Localisation requise');
    if (!validateStep(2)) validationErrors.push('Type de propriété requis');
    if (!validateStep(3)) validationErrors.push('Nombre d\'invités requis');
    if (!validateStep(5)) validationErrors.push('Au moins une photo requise');
    if (!validateStep(6)) validationErrors.push('Titre requis');
    if (!validateStep(7)) validationErrors.push('Description requise');
    if (!validateStep(8)) validationErrors.push('Prix requis');

    if (validationErrors.length > 0) {
      setError(`Veuillez compléter les étapes requises: ${validationErrors.join(', ')}`);
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const payload = { ...formData };
      
      console.log('🚀 Creating property for publish with payload:', payload);
      
      const response = await fetch(`${API_BASE}/api/property`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      console.log('📡 Create response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Property created successfully:', data);
        alert('Propriété créée et publiée avec succès!');
        navigate('/owner-welcome');
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Failed to create property' }));
        console.error('❌ Create error:', response.status, errorData);
        
        // Handle token expiration like in package creation
        if (response.status === 401) {
          setError('Votre session a expiré. Veuillez vous reconnecter.');
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
          setError(errorData.message || 'Échec de la création de la propriété');
        }
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
    'Type de Propriété',
    'Informations',
    'Équipements',
    'Photos',
    'Titre',
    'Description',
    'Prix'
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
                      const frenchSteps = ['Localisation', 'Type', 'Infos', 'Équipements', 'Photos', 'Titre', 'Desc', 'Prix'];
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
              <div className="mt-1 sm:hidden">
                <span className="text-sm font-semibold text-gray-800">
                  {steps[currentStep - 1]}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Header Section */}
        <div className="sticky top-0 z-50 bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              {/* Left: Back Button */}
              <button
                onClick={() => navigate('/owner-welcome')}
                className="flex items-center justify-center w-10 h-10 text-green-700 hover:text-green-800 hover:bg-green-50 rounded-full transition-colors"
              >
                <FaArrowLeft className="w-5 h-5" />
              </button>

              {/* Center: Atlasia Branding */}
              <div className="text-center">
                <div className="font-bold text-green-700 text-2xl">
                  Atlasia
                </div>
                <div className="text-sm text-gray-600">Créer une propriété</div>
              </div>

              {/* Right: Account Icon */}
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center justify-center w-10 h-10 bg-green-600 text-white hover:bg-green-700 rounded-full transition-colors font-semibold text-sm"
              >
                {user?.fullName ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
              </button>
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

        {/* Step Content */}
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 min-h-96">
          {/* Step 1: Localisation */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Localisation</h2>
                <p className="text-gray-600">Où se trouve votre propriété ?</p>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Ville<span className="text-red-500"> *</span></label>
                  <select
                    value={formData.localisation.city}
                    onChange={(e) => handleInputChange('city', e.target.value, 'localisation')}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                  >
                    <option value="">Sélectionner une ville</option>
                    {cities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Adresse<span className="text-red-500"> *</span></label>
                  <input
                    type="text"
                    value={formData.localisation.address}
                    onChange={(e) => handleInputChange('address', e.target.value, 'localisation')}
                    placeholder="Entrez l'adresse complète"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Code Postal<span className="text-red-500"> *</span></label>
                  <input
                    type="text"
                    value={formData.localisation.postalCode}
                    onChange={(e) => handleInputChange('postalCode', e.target.value, 'localisation')}
                    placeholder="Entrez le code postal"
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
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Type de Propriété</h2>
                <p className="text-gray-600">Quel type de propriété ajoutez-vous ?</p>
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
                <p className="text-gray-600">Combien de personnes peuvent être accueillies ?</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {infoTypes.map((info, index) => (
                  <div key={index} className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <info.icon className="w-6 h-6 text-gray-600" />
                      <span className="font-semibold text-gray-900">{info.label}</span>
                    </div>
                    <div className="flex items-center justify-center space-x-4">
                      <button
                        onClick={() => handleInputChange(
                          info.key, 
                          Math.max(info.min, formData.info[info.key] - 1),
                          'info'
                        )}
                        disabled={formData.info[info.key] <= info.min}
                        className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-600 hover:border-green-500 hover:text-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        -
                      </button>
                      <span className="text-2xl font-bold text-gray-900 min-w-8 text-center">
                        {formData.info[info.key]}
                      </span>
                      <button
                        onClick={() => handleInputChange(
                          info.key, 
                          formData.info[info.key] + 1,
                          'info'
                        )}
                        className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-600 hover:border-green-500 hover:text-green-500"
                      >
                        +
                      </button>
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
                <p className="text-gray-600">Quels équipements propose votre logement ?</p>
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
                      <div className="flex flex-col items-center space-y-2">
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
              
              {/* Photo counter and guidance */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="bg-blue-100 rounded-full p-1">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-blue-900">
                      {formData.photos.length} sur 4 photos ajoutées
                    </span>
                  </div>
                  <div className="text-xs text-blue-700">
                    Recommandé: Photos de bonne qualité
                  </div>
                </div>
              </div>

              {/* Photos grid */}
              {formData.photos.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                  {formData.photos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                        <S3Image
                          src={photo}
                          alt={`Photo ${index + 1}`}
                          className="w-full h-full object-cover"
                          fallbackSrc="/placeholder.jpg"
                        />
                      </div>
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={() => handleRemovePhoto(index)}
                          className="bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm shadow-lg transform hover:scale-110 transition-all duration-200"
                        >
                          ×
                        </button>
                      </div>
                      <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded group-hover:opacity-0 transition-opacity duration-200">
                        Photo {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add photo section */}
              {formData.photos.length < 4 && (
                <div className="flex justify-center">
                  <div className="w-full max-w-2xl">
                    <div className="h-48 rounded-xl overflow-hidden">
                      <S3ImageUpload
                        onUpload={handleAddPhoto}
                        showPreview={false}
                        className="w-full h-full"
                        folder="photos"
                        multiple={false}
                        maxFiles={1}
                        acceptedTypes={['image/jpeg', 'image/jpg', 'image/png']}
                        maxSize={5 * 1024 * 1024}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 6: Title */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Titre</h2>
                <p className="text-gray-600">Créez un titre accrocheur pour votre propriété</p>
              </div>
              
              <div>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Ex: Magnifique villa avec piscine au cœur de Marrakech"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 text-gray-900"
                />
              </div>
            </div>
          )}

          {/* Step 7: Description */}
          {currentStep === 7 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Description</h2>
                <p className="text-gray-600">Décrivez votre propriété en détail</p>
              </div>
              
              <div>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows="6"
                  placeholder="Décrivez votre propriété, ses avantages, et ce qui la rend unique..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 resize-none text-gray-900"
                />
              </div>
            </div>
          )}

          {/* Step 8: Price */}
          {currentStep === 8 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Prix</h2>
                <p className="text-gray-600">Quel est le prix par nuit de votre propriété ?</p>
              </div>
              
              <div className="max-w-md mx-auto">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Prix par nuit</label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', e.target.value)}
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
        </div>

        {/* Enhanced Mobile Navigation Buttons */}
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mt-6">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 sm:space-x-4">
            {/* Left Side - Back Navigation */}
            <div className="flex space-x-2 w-full sm:w-auto">
              {currentStep > 1 && (
                <button
                  onClick={handlePrev}
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
              )}
            </div>

            {/* Right Side - Action Buttons */}
            <div className="flex space-x-3 w-full sm:w-auto">
              {currentStep < 8 ? (
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