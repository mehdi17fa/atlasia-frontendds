// src/pages/MyProperties/MyProperties.js
import React, { useEffect, useState, useContext, useCallback } from "react";
import axios from "axios";
import ListingCardGrid from "../../components/ListingCard/ListingCardGrid";
import SectionTitle from "../../components/shared/SectionTitle";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from 'react-icons/fa';

const API_BASE = process.env.REACT_APP_API_URL;

export default function MyProperties() {
  const { user, token } = useContext(AuthContext);
  const [draftProperties, setDraftProperties] = useState([]);
  const [publishedProperties, setPublishedProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [publishingProperty, setPublishingProperty] = useState(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [availabilitySettings, setAvailabilitySettings] = useState({
    startDate: '',
    endDate: ''
  });
  const navigate = useNavigate();

  const fetchMyProperties = useCallback(async () => {
    setLoading(true);
    setError(null); 
    
    try {
      // Get token from localStorage as fallback
      const authToken = token || localStorage.getItem('accessToken') || localStorage.getItem('token');
      
      if (!authToken) {
        console.warn("No authentication token found");
        setError("Vous devez être connecté pour voir vos propriétés");
        setLoading(false);
        return;
      }

      if (!user) {
        console.warn("No user found in context");
        setError("Informations utilisateur manquantes");
        setLoading(false);
        return;
      }

      console.log("🔑 Fetching properties for user:", user.fullName || user.name);
      console.log("🔑 Using token:", authToken ? "EXISTS" : "MISSING");

      const response = await axios.get(`${API_BASE}/api/property/mine/all`, {
        headers: { 
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
      });

      console.log("📦 API Response:", response.data);

      if (response.data && response.data.properties) {
        const properties = response.data.properties;
        console.log("🏠 Fetched properties:", properties.length);
        console.log("🔍 First property sample:", properties[0]);

        const draftProps = properties.filter((p) => p && p.status === "draft");
        const publishedProps = properties.filter((p) => p && p.status === "published");
        
        console.log("📝 Draft properties:", draftProps.length);
        console.log("📝 Draft properties details:", draftProps);
        console.log("✅ Published properties:", publishedProps.length);
        console.log("✅ Published properties details:", publishedProps);
        
        // Debug each property status
        properties.forEach((p, index) => {
          console.log(`Property ${index}:`, {
            _id: p._id,
            title: p.title,
            status: p.status,
            localisation: p.localisation,
            price: p.price,
            info: p.info
          });
        });
        
        setDraftProperties(draftProps);
        setPublishedProperties(publishedProps);
      } else {
        console.warn("No properties found in response");
        setDraftProperties([]);
        setPublishedProperties([]);
      }
    } catch (err) {
      console.error("❌ Error fetching my properties:", err);
      
      if (err.response?.status === 401) {
        setError("Session expirée. Veuillez vous reconnecter.");
        // Redirect to login
        navigate('/login');
      } else if (err.response?.status === 403) {
        setError("Accès non autorisé. Vous devez être propriétaire.");
      } else if (err.response?.data?.message) {
        setError(`Erreur: ${err.response.data.message}`);
      } else {
        setError("Erreur lors du chargement des propriétés. Veuillez réessayer.");
      }
      
      setDraftProperties([]);
      setPublishedProperties([]);
    } finally {
      setLoading(false);
    }
  }, [token, user, navigate]);

  useEffect(() => {
    fetchMyProperties();
  }, [fetchMyProperties]);

  const handlePublishProperty = async (property) => {
    setPublishingProperty(property);
    setShowPublishModal(true);
  };

  const handleConfirmPublish = async () => {
    if (!publishingProperty) return;

    try {
      const response = await axios.patch(
        `${API_BASE}/api/property/${publishingProperty._id}/publish`,
        {
          start: availabilitySettings.startDate || null,
          end: availabilitySettings.endDate || null
        },
        {
          headers: {
            Authorization: `Bearer ${token || localStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        alert('Propriété publiée avec succès!');
        // Refresh properties list
        fetchMyProperties();
      }
    } catch (err) {
      console.error('Error publishing property:', err);
      alert(`Erreur lors de la publication: ${err.response?.data?.message || err.message}`);
    } finally {
      setShowPublishModal(false);
      setPublishingProperty(null);
      setAvailabilitySettings({ startDate: '', endDate: '' });
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-28">
        {/* Header Section */}
        <div className="sticky top-0 z-50 bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              {/* Left: Back Button */}
              <button
                onClick={() => navigate('/')}
                className="flex items-center justify-center w-10 h-10 text-green-700 hover:text-green-800 hover:bg-green-50 rounded-full transition-colors"
              >
                <FaArrowLeft className="w-5 h-5" />
              </button>

              {/* Center: Atlasia Branding */}
              <div className="text-center">
                <div className="font-bold text-green-700 text-2xl">
                  Atlasia
                </div>
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
        
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement de vos propriétés...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 pb-28">
        {/* Header Section */}
        <div className="sticky top-0 z-50 bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              {/* Left: Back Button */}
              <button
                onClick={() => navigate('/')}
                className="flex items-center justify-center w-10 h-10 text-green-700 hover:text-green-800 hover:bg-green-50 rounded-full transition-colors"
              >
                <FaArrowLeft className="w-5 h-5" />
              </button>

              {/* Center: Atlasia Branding */}
              <div className="text-center">
                <div className="font-bold text-green-700 text-2xl">
                  Atlasia
                </div>
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
        
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Erreur de chargement</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchMyProperties}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* Header Section */}
      <div className="sticky top-0 z-50 bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            {/* Left: Back Button */}
            <button
              onClick={() => navigate('/')}
              className="flex items-center justify-center w-10 h-10 text-green-700 hover:text-green-800 hover:bg-green-50 rounded-full transition-colors"
            >
              <FaArrowLeft className="w-5 h-5" />
            </button>

            {/* Center: Atlasia Branding */}
            <div className="text-center">
              <div className="font-bold text-green-700 text-2xl">
                Atlasia
              </div>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Section Title */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Mes Propriétés</h1>
          <p className="text-gray-600">Gérez vos propriétés et suivez leur statut</p>
        </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-700">{draftProperties.length}</div>
          <div className="text-sm text-yellow-600">Brouillons</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-700">{publishedProperties.length}</div>
          <div className="text-sm text-green-600">Publiées</div>
        </div>
      </div>

      {/* Draft Properties */}
      <SectionTitle title="Brouillons" />
      {draftProperties.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {draftProperties.map((property) => (
            <div key={property._id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
              {/* Image */}
              <div className="relative">
                <img 
                  src={property.photos && property.photos.length > 0 ? property.photos[0] : '/placeholder.jpg'} 
                  alt={property.title || 'Property'} 
                  className="w-full h-40 object-cover"
                />
                <div className="absolute top-2 right-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-medium">
                  Brouillon
                </div>
              </div>
              
              {/* Content */}
              <div className="p-4">
                <p className="text-sm text-gray-600 mb-1">
                  {property.localisation?.city || 'Localisation non spécifiée'}
                </p>
                <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2">
                  {property.title || 'Propriété sans titre'}
                </h3>
                <div className="flex items-center text-xs text-gray-500 mb-3 space-x-3">
                  {property.info?.bedrooms && <span>{property.info.bedrooms} chambres</span>}
                  {property.info?.guests && <span>{property.info.guests} personnes</span>}
                </div>
                
                {/* Action buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/edit-property/${property._id}`)}
                    className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => handlePublishProperty(property)}
                    className="flex-1 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Publier
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-lg mb-8">
          <div className="text-gray-400 text-4xl mb-2">📝</div>
          <p className="text-gray-500">Aucun brouillon disponible.</p>
          <p className="text-sm text-gray-400 mt-1">Créez votre première propriété pour commencer.</p>
        </div>
      )}

      {/* Published Properties */}
      <SectionTitle title="Propriétés Publiées" />
      {publishedProperties.length > 0 ? (
        <ListingCardGrid listings={publishedProperties} />
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <div className="text-gray-400 text-4xl mb-2">🏠</div>
          <p className="text-gray-500">Aucune propriété publiée.</p>
          <p className="text-sm text-gray-400 mt-1">Publiez vos brouillons pour les rendre visibles aux visiteurs.</p>
        </div>
      )}

      {/* Add Property Button */}
      <div className="fixed bottom-20 right-4 z-40">
        <button
          onClick={() => navigate('/create-property')}
          className="bg-green-600 text-white p-4 rounded-full shadow-lg hover:bg-green-700 transition-colors"
          title="Ajouter une propriété"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Publish Modal */}
      {showPublishModal && publishingProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Publier la propriété
            </h3>
            <p className="text-gray-600 mb-4">
              Définissez la période de disponibilité de votre propriété (optionnel).
            </p>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de début (optionnel)
                </label>
                <input
                  type="date"
                  value={availabilitySettings.startDate}
                  onChange={(e) => setAvailabilitySettings(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de fin (optionnel)
                </label>
                <input
                  type="date"
                  value={availabilitySettings.endDate}
                  onChange={(e) => setAvailabilitySettings(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPublishModal(false);
                  setPublishingProperty(null);
                  setAvailabilitySettings({ startDate: '', endDate: '' });
                }}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmPublish}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Publier
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
