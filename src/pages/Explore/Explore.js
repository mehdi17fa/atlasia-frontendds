// src/pages/Explore/Explore.js
import React, { useEffect, useState, useContext } from "react";
import { api } from "../../api";
import ListingCardGrid from "../../components/ListingCard/ListingCardGrid";
import SectionTitle from "../../components/shared/SectionTitle";
import SearchBar from "../../components/explore/SearchBar";
import InteractiveMap from "../../components/InteractiveMap";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { AuthContext } from "../../context/AuthContext";

export default function Explore() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMapView, setIsMapView] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const navigate = useNavigate();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { logout } = useContext(AuthContext);

  useEffect(() => {
    const fetchProperties = async () => {
      // Wait for auth to load first
      if (authLoading) {
        console.log('⏳ Waiting for auth to load...');
        return;
      }

      let endpoint = '/api/property';
      let logMessage = 'Making API call to: /api/property (public)';
      
      // For intermediate/partner users, fetch properties available for cohosting
      if (isAuthenticated && user?.role === 'partner') {
        endpoint = '/api/property/available-for-cohosting';
        logMessage = 'Making API call to: /api/property/available-for-cohosting (partner)';
      }

      try {
        const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:4000';
        console.log(logMessage);
        console.log('User role:', user?.role);
        console.log('Is authenticated:', isAuthenticated);
        console.log('🌐 API Base URL:', baseUrl);
        console.log('🔗 Full request URL:', `${baseUrl}${endpoint}`);
        
        // Try with axios first, fallback to fetch if CORS issues persist
        let res;
        try {
          res = await api.get(endpoint);
        } catch (corsError) {
          if (corsError.code === 'ERR_NETWORK' || corsError.message.includes('CORS')) {
            console.log('⚠️ Axios CORS issue detected, trying direct fetch...');
            
            const token = localStorage.getItem('atlasia_access_token') || localStorage.getItem('accessToken');
            const fetchOptions = {
              method: 'GET',
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
              }
            };
            
            const response = await fetch(`${baseUrl}${endpoint}`, fetchOptions);
            
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            res = { data, status: response.status };
          } else {
            throw corsError;
          }
        }
        console.log('Full API response:', res);
        console.log('Response data:', res.data);
        console.log('Response status:', res.status);
        
        const properties = res.data.properties || [];
        
        // Debug logging to see what we're getting
        console.log('Properties from API:', properties);
        console.log('Number of properties:', properties.length);
        if (properties.length > 0) {
          console.log('First property:', properties[0]);
          console.log('First property photos:', properties[0].photos);
        }
        
        setProperties(properties);
      } catch (err) {
        console.error("❌ Error fetching properties:", err);
        console.error("📝 Error response:", err.response);
        console.error("💬 Error message:", err.message);
        console.error("🌐 Error code:", err.code);
        
        // Check for CORS-related errors
        if (err.code === 'ERR_NETWORK' || err.message.includes('CORS') || err.message.includes('Network Error')) {
          console.error('🚑 CORS Error detected!');
          console.error('🔗 Request was trying to reach:', `${process.env.REACT_APP_API_URL}${endpoint}`);
          console.error('🌐 Backend URL configured as:', process.env.REACT_APP_API_URL);
          setError('CORS Error: Unable to connect to the backend. Please check if the backend is running and CORS is properly configured.');
        } else {
          setError(err.response?.data?.message || err.message || 'Failed to fetch properties');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchProperties();
  }, [authLoading, isAuthenticated, user?.role]); // Re-run when auth state changes

  const handleCardClick = (id) => {
    // For intermediate/partner users, navigate to cohosting preview
    if (isAuthenticated && user?.role === 'partner') {
      navigate(`/cohosting-preview/${id}`);
    } else {
      navigate(`/property/${id}`);
    }
  };

  const handleMapPropertyClick = (propertyId) => {
    const property = properties.find(p => p._id === propertyId);
    setSelectedProperty(property);
    // Navigate to property details
    navigate(`/property/${propertyId}`);
  };

  if (loading) return <p className="text-center mt-20">Chargement...</p>;

  if (error) {
    return (
      <div className="px-4 md:px-20 pt-1">
        <SectionTitle title="Explorer" />
        <div className="text-center py-12">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-red-700 mb-2">
            Erreur de connexion
          </h3>
          <p className="text-red-600 text-sm mb-4">
            {error}
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const handleToggleView = () => {
    setIsMapView(!isMapView);
  };

  // Get the appropriate title and action button text based on user role
  const getTitle = () => {
    if (isAuthenticated && user?.role === 'partner') {
      return "Propriétés disponibles pour co-hébergement";
    }
    return "Explorer";
  };

  const getActionButtonText = () => {
    if (isAuthenticated && user?.role === 'partner') {
      return "Voir pour co-hébergement";
    }
    return undefined; // Default button text
  };

  return (
    <div className="px-4 md:px-20 pt-1 pb-28">
      
      <SectionTitle title={getTitle()} />
      
      {/* Show role-specific info for partners */}
      {isAuthenticated && user?.role === 'partner' && (
        <div className="mb-6 text-center bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 text-sm">
            En tant que partenaire, vous voyez ici toutes les propriétés disponibles pour le co-hébergement.
          </p>
        </div>
      )}

      {properties.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏠</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Aucune propriété disponible
          </h3>
          <p className="text-gray-500 text-sm">
            {isAuthenticated && user?.role === 'partner' 
              ? "Il n'y a actuellement aucune propriété disponible pour le co-hébergement."
              : "Il n'y a actuellement aucune propriété publiée à explorer."
            }
          </p>
        </div>
      ) : (
        <>
          {isAuthenticated && user?.role === 'partner' && (
            <div className="mb-6 text-center">
              <p className="text-gray-600">
                {properties.length} propriété{properties.length > 1 ? 's' : ''} disponible{properties.length > 1 ? 's' : ''} pour le co-hébergement
              </p>
            </div>
          )}
          <ListingCardGrid 
            listings={properties} 
            onCardClick={handleCardClick}
          />
        </>
      )}
    </div>
  );
}

