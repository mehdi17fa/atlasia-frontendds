// src/pages/MyProperties/MyProperties.js
import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import ListingCardGrid from "../../components/ListingCard/ListingCardGrid";
import SectionTitle from "../../components/shared/SectionTitle";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaUser } from 'react-icons/fa';

const API_BASE = process.env.REACT_APP_API_URL;

export default function MyProperties() {
  const { user, token } = useContext(AuthContext);
  const [draftProperties, setDraftProperties] = useState([]);
  const [publishedProperties, setPublishedProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyProperties();
  }, []);

  const fetchMyProperties = async () => {
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
        console.log("✅ Published properties:", publishedProps.length);
        
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
        <ListingCardGrid listings={draftProperties} />
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
          onClick={() => navigate('/add-property')}
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
      </div>
    </div>
  );
}
