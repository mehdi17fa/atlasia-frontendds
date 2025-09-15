// src/pages/Explore/Explore.js
import React, { useEffect, useState } from "react";
import { api } from "../../api";
import ListingCardGrid from "../../components/ListingCard/ListingCardGrid";
import SectionTitle from "../../components/shared/SectionTitle";
import SearchBar from "../../components/explore/SearchBar";
import InteractiveMap from "../../components/InteractiveMap";
import { useNavigate } from "react-router-dom";

export default function Explore() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMapView, setIsMapView] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        console.log('Making API call to: /api/property');
        const res = await api.get('/api/property');
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
        console.error("Error fetching properties:", err);
        console.error("Error response:", err.response);
        console.error("Error message:", err.message);
        setError(err.response?.data?.message || err.message || 'Failed to fetch properties');
      } finally {
        setLoading(false);
      }
    };
    fetchProperties();
  }, []);

  const handleCardClick = (id) => {
    navigate(`/property/${id}`);
  };

  const handleMapPropertyClick = (propertyId) => {
    const property = properties.find(p => p._id === propertyId);
    setSelectedProperty(property);
    // Optional: navigate to property details
    // navigate(`/property/${propertyId}`);
  };

  if (loading) return <p className="text-center mt-20">Chargement...</p>;

  if (error) {
    return (
      <div className="px-4 py-8">
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

  return (
    <div className="px-4 py-8">
      <SectionTitle title="Explorer" />
      

      {properties.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏠</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Aucune propriété disponible
          </h3>
          <p className="text-gray-500 text-sm">
            Il n'y a actuellement aucune propriété publiée à explorer.
          </p>
        </div>
      ) : (
        <ListingCardGrid listings={properties} onCardClick={handleCardClick} />
      )}
    </div>
  );
}

