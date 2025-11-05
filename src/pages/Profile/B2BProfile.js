import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { BuildingOfficeIcon, PencilIcon, CheckIcon, XMarkIcon, PlusIcon, BriefcaseIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import MyServicesManagement from '../B2BServices/MyServicesManagement';

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

export default function B2BProfile() {
  const { user, setUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingBusiness, setIsAddingBusiness] = useState(false);
  const [showServicesManagement, setShowServicesManagement] = useState(false);
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

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        country: user.country || '',
        businessName: user.businessName || '',
        serviceProvided: user.serviceProvided || '',
        location: user.location || ''
      });
      
      // If business info is missing, show add business form
      if (!user.businessName && !user.serviceProvided && !user.location) {
        setIsAddingBusiness(true);
      }
    }
  }, [user]);

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSave = async () => {
    // Validate required business fields
    if (!formData.businessName || !formData.serviceProvided || !formData.location) {
      alert('Veuillez remplir tous les champs obligatoires de l\'entreprise (Nom, Service, Localisation)');
      return;
    }

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
        setIsAddingBusiness(false);
        alert('Profil mis à jour avec succès!');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Erreur lors de la mise à jour du profil. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to original user data
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        country: user.country || '',
        businessName: user.businessName || '',
        serviceProvided: user.serviceProvided || '',
        location: user.location || ''
      });
    }
    setIsEditing(false);
    setIsAddingBusiness(false);
  };

  const handleAddBusiness = () => {
    setIsAddingBusiness(true);
    setIsEditing(true);
  };

  const handleLogout = async () => {
    try {
      console.log('🚪 B2B Logout button clicked');
      
      // Clear user data and tokens
      await logout();
      
      console.log('✅ Logout completed, redirecting...');
      
      // Redirect to home page
      window.location.replace('/');
    } catch (error) {
      console.error('❌ Error during logout:', error);
      // Even if logout fails, still redirect to home
      window.location.replace('/');
    }
  };

  const hasBusinessInfo = formData.businessName && formData.serviceProvided && formData.location;

  if (!user || user.role !== 'b2b') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Cette page est réservée aux comptes B2B.</p>
          <button
            onClick={() => navigate('/profile')}
            className="text-green-700 hover:text-green-800 underline"
          >
            Retour au profil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white pb-28">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium">Retour</span>
            </button>
            <h1 className="text-2xl font-bold text-green-800">Profil B2B</h1>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors font-medium"
              title="Se déconnecter"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
              <span className="hidden sm:inline">Déconnecter</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Add Business Section - Show when business info is missing */}
        {!hasBusinessInfo && !isAddingBusiness && (
          <div className="bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-200 rounded-2xl p-8 mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-green-200 rounded-full flex items-center justify-center">
                <PlusIcon className="w-8 h-8 text-green-700" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Ajouter votre entreprise</h2>
                <p className="text-gray-600">
                  Complétez les informations de votre entreprise pour que les clients puissent vous trouver et vous contacter.
                </p>
              </div>
            </div>
            <button
              onClick={handleAddBusiness}
              className="flex items-center gap-2 px-6 py-3 bg-green-700 hover:bg-green-800 text-white rounded-xl transition-colors font-semibold"
            >
              <PlusIcon className="w-5 h-5" />
              <span>Ajouter mon entreprise</span>
            </button>
          </div>
        )}

        {/* Info Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <BuildingOfficeIcon className="w-8 h-8 text-green-700" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{formData.businessName || 'Entreprise'}</h2>
                <p className="text-gray-600">{serviceLabels[formData.serviceProvided] || 'Service'}</p>
              </div>
            </div>
            {!isEditing && hasBusinessInfo && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-700 hover:bg-green-800 text-white rounded-xl transition-colors"
              >
                <PencilIcon className="w-5 h-5" />
                <span>Modifier</span>
              </button>
            )}
          </div>

          {/* Personal Information Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b-2 border-gray-200">
              Informations personnelles
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => handleChange('fullName', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-600 focus:ring-2 focus:ring-green-200 outline-none transition-all"
                  />
                ) : (
                  <p className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900">{formData.fullName || 'Non renseigné'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <p className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900">{formData.email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => handleChange('phoneNumber', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-600 focus:ring-2 focus:ring-green-200 outline-none transition-all"
                  />
                ) : (
                  <p className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900">{formData.phoneNumber || 'Non renseigné'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pays</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => handleChange('country', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-600 focus:ring-2 focus:ring-green-200 outline-none transition-all"
                  />
                ) : (
                  <p className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900">{formData.country || 'Non renseigné'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Business Information Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b-2 border-gray-200">
              Informations professionnelles
            </h3>
            {(isEditing || isAddingBusiness || !hasBusinessInfo) ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom de l'entreprise <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => handleChange('businessName', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-600 focus:ring-2 focus:ring-green-200 outline-none transition-all"
                    placeholder="Entrez le nom de votre entreprise"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Service fourni <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.serviceProvided}
                    onChange={(e) => handleChange('serviceProvided', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-600 focus:ring-2 focus:ring-green-200 outline-none transition-all bg-white"
                    required
                  >
                    <option value="">Sélectionner un service</option>
                    {Object.entries(serviceLabels).map(([value, label]) => (
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
                    onChange={(e) => handleChange('location', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-600 focus:ring-2 focus:ring-green-200 outline-none transition-all"
                    placeholder="Ville, Pays"
                    required
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'entreprise</label>
                  <p className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900">{formData.businessName || 'Non renseigné'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service fourni</label>
                  <p className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900">
                    {serviceLabels[formData.serviceProvided] || 'Non renseigné'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Localisation</label>
                  <p className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900">{formData.location || 'Non renseigné'}</p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {(isEditing || isAddingBusiness) && (
            <div className="flex gap-4 mt-8 pt-6 border-t-2 border-gray-200">
              <button
                onClick={handleCancel}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl transition-colors font-semibold"
              >
                <XMarkIcon className="w-5 h-5" />
                <span>Annuler</span>
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-700 hover:bg-green-800 text-white rounded-xl transition-colors font-semibold ${
                  loading ? 'opacity-60 cursor-not-allowed' : ''
                }`}
              >
                <CheckIcon className="w-5 h-5" />
                <span>{loading ? 'Enregistrement...' : isAddingBusiness ? 'Ajouter l\'entreprise' : 'Enregistrer'}</span>
              </button>
            </div>
          )}

          {/* View Business Button - Show when business info exists */}
          {hasBusinessInfo && !isEditing && (
            <div className="mt-6 pt-6 border-t-2 border-gray-200 space-y-3">
              <button
                onClick={() => navigate('/b2b-services')}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl transition-colors font-semibold border-2 border-green-200"
              >
                <BuildingOfficeIcon className="w-5 h-5" />
                <span>Voir mon entreprise dans le répertoire</span>
              </button>
              <button
                onClick={() => setShowServicesManagement(!showServicesManagement)}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl transition-colors font-semibold border-2 border-blue-200"
              >
                <BriefcaseIcon className="w-5 h-5" />
                <span>{showServicesManagement ? 'Masquer' : 'Gérer'} mes services</span>
              </button>
            </div>
          )}
        </div>

        {/* Services Management Section */}
        {showServicesManagement && hasBusinessInfo && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mt-6">
            <MyServicesManagement />
          </div>
        )}
      </div>
    </div>
  );
}



