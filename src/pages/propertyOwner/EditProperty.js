import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { FaArrowLeft } from 'react-icons/fa';
import { uploadFileToS3 } from '../../utilities/s3Service';

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
];

export default function EditProperty() {
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);
  const { id } = useParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [property, setProperty] = useState(null);
  
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

  // Fetch property data on component mount
  useEffect(() => {
    fetchProperty();
  }, [id]);

  const fetchProperty = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/property/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProperty(data.property);
        
        // Pre-populate form with existing data
        setFormData({
          localisation: data.property.localisation || { city: '', address: '', postalCode: '' },
          propertyType: data.property.propertyType || '',
          info: data.property.info || { guests: 1, bedrooms: 0, beds: 0, bathrooms: 0 },
          equipments: data.property.equipments || [],
          photos: data.property.photos || [],
          title: data.property.title || '',
          description: data.property.description || '',
          price: data.property.price?.weekdays || data.property.price?.weekend || '',
          documents: data.property.documents || {}
        });
      } else {
        setError('Erreur lors du chargement de la propriété');
      }
    } catch (err) {
      setError('Erreur lors du chargement de la propriété');
    }
  };

  // Step navigation logic
  const handleNext = () => {
    if (currentStep < 9) {
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

  // Photos handling (Step 5)
  const handlePhotosSelect = async (event) => {
    try {
      const files = Array.from(event.target.files || []);
      if (files.length === 0) return;

      setIsLoading(true);
      setError('');

      // Limit total photos to 4
      const remainingSlots = Math.max(0, 4 - (formData.photos?.length || 0));
      const filesToUpload = files.slice(0, remainingSlots);

      const uploadedUrls = [];
      for (const file of filesToUpload) {
        const res = await uploadFileToS3(file, 'property-photos');
        if (res?.url) {
          uploadedUrls.push(res.url);
        }
      }

      if (uploadedUrls.length > 0) {
        setFormData(prev => ({
          ...prev,
          photos: [...(prev.photos || []), ...uploadedUrls].slice(0, 4)
        }));
      }
    } catch (err) {
      setError(err.message || 'Erreur lors du téléchargement des photos');
    } finally {
      setIsLoading(false);
      // Reset input value so selecting the same file again re-triggers change
      if (event?.target) event.target.value = '';
    }
  };

  const handleReplacePhoto = async (index, file) => {
    if (!file) return;
    try {
      setIsLoading(true);
      setError('');
      const res = await uploadFileToS3(file, 'property-photos');
      if (res?.url) {
        setFormData(prev => {
          const next = [...(prev.photos || [])];
          next[index] = res.url;
          return { ...prev, photos: next };
        });
      }
    } catch (err) {
      setError(err.message || 'Erreur lors du remplacement de la photo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemovePhoto = (index) => {
    setFormData(prev => {
      const next = [...(prev.photos || [])];
      next.splice(index, 1);
      return { ...prev, photos: next };
    });
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
        return Object.values(formData.documents).some(docs => docs && docs.length > 0);
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

  const handleUpdateProperty = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Map equipment labels to backend enum values
      const equipmentMapping = {
        'Wifi': 'wifi',
        'TV': 'tv', 
        'Lave-linge': 'washer',
        'Climatisation': 'ac',
        'Chauffage': 'heater',
        'Cuisine': 'kitchen',
        'Parking': 'parking',
        'Piscine': 'pool',
      };

      const mappedEquipments = formData.equipments.map(eq => equipmentMapping[eq] || eq);

      // Transform price structure to match backend schema
      const priceValue = parseFloat(formData.price) || 0;
      
      const payload = { 
        ...formData,
        equipments: mappedEquipments,
        price: {
          weekdays: priceValue,
          weekend: priceValue
        }
      };
      
      const response = await fetch(`${API_BASE}/api/property/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert('Propriété mise à jour avec succès!');
        navigate('/owner-welcome');
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Failed to update property' }));
        setError(`Erreur lors de la mise à jour: ${errorData.message}`);
      }
    } catch (err) {
      setError(`Erreur lors de la mise à jour: ${err.message}`);
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

  if (!property) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de la propriété...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate('/owner-welcome')}
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              <FaArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Modifier la propriété</h1>
            <div></div>
          </div>
          
          {/* Progress Bar */}
          <div className="relative w-full bg-gray-200 rounded-full h-3 shadow-inner">
            <div 
              className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500 ease-out shadow-lg"
              style={{ width: `${(currentStep / steps.length) * 100}%` }}
            >
              <div className="absolute right-0 top-0 w-3 h-3 bg-white rounded-full shadow-md transform translate-x-1 -translate-y-0.5"></div>
            </div>
          </div>

          <div className="text-center mt-3">
            <span className="text-sm font-medium text-gray-600">
              Étape {currentStep} sur {steps.length}
            </span>
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
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Mes photos ({formData.photos.length}/4)
                  </h3>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotosSelect}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      style={{ width: '100%', height: '100%' }}
                    />
                    <button
                      type="button"
                      className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50"
                      disabled={isLoading || (formData.photos?.length || 0) >= 4}
                    >
                      {isLoading ? 'Téléchargement...' : 'Ajouter des photos'}
                    </button>
                  </div>
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
                              e.target.src = '/placeholder.jpg';
                            }}
                          />
                        </div>
                        <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                          Photo {index + 1}
                        </div>
                        {/* Replace / Remove controls */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2">
                          {/* Replace */}
                          <label className="px-2 py-1 text-xs bg-white rounded shadow cursor-pointer hover:bg-gray-50">
                            Remplacer
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleReplacePhoto(index, e.target.files?.[0])}
                              className="hidden"
                            />
                          </label>
                          {/* Remove */}
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(index)}
                            className="px-2 py-1 text-xs bg-white rounded shadow hover:bg-gray-50"
                          >
                            Supprimer
                          </button>
                        </div>
                      </div>
                    ))}
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
                          onChange={(e) => handleInputChange('documents', { ...formData.documents, [docType.id]: Array.from(e.target.files) })}
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
                <p className="text-gray-600">Vérifiez les informations de votre propriété avant mise à jour</p>
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
              ) : (
                <button
                  onClick={handleUpdateProperty}
                  className="flex-1 sm:flex-none px-6 py-3 font-semibold text-white bg-gradient-to-r from-green-500 to-green-600 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50"
                  disabled={isLoading}
                >
                  <div className="flex items-center justify-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    {isLoading ? 'Mise à jour...' : 'Mettre à jour la propriété'}
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
