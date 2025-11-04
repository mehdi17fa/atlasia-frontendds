// src/pages/CohostingExplore/CohostingExplore.js
import React, { useEffect, useState, useContext } from "react";
import { api } from "../../api";
import ListingCardGrid from "../../components/ListingCard/ListingCardGrid";
import SectionTitle from "../../components/shared/SectionTitle";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { FaArrowLeft } from 'react-icons/fa';

export default function CohostingExplore() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState(null);
  const navigate = useNavigate();
  const { token, user } = useContext(AuthContext);

  useEffect(() => {
    const fetchAvailableProperties = async () => {
      try {
        console.log("🚀 Making API call to: /api/property/available-for-cohosting");
        
        const res = await api.get(`/api/property/available-for-cohosting`);
        
        console.log("✅ API call successful:", res.data);
        setProperties(res.data.properties || []);
        
      } catch (err) {
        console.error("❌ Error details:", {
          message: err.message,
          status: err.response?.status,
          statusText: err.response?.statusText,
          data: err.response?.data,
          headers: err.response?.headers
        });
        
        setDebugInfo({
          error: err.message,
          status: err.response?.status,
          data: err.response?.data
        });
        
        if (err.response?.status === 401) {
          navigate("/login");
          return;
        } else if (err.response?.status === 403) {
          alert("Vous devez avoir un rôle de partenaire pour voir ces propriétés");
          navigate(-1);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAvailableProperties();
  }, [navigate, token]);

  const handleCardClick = (id) => {
    navigate(`/cohosting-preview/${id}`);
  };

  if (loading) return <p className="text-center mt-20">Chargement...</p>;

  // Show debug info if there was an error
  if (debugInfo) {
    return (
      <div className="px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <h3 className="text-red-800 font-semibold mb-2">Debug Info:</h3>
          <pre className="text-sm text-red-700">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
        <button 
          onClick={() => navigate(-1)}
          className="bg-green-700 text-white px-6 py-2 rounded-full hover:bg-green-800"
        >
          Retour
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* Header Section (same style as OwnerIncomePage) */}
      <div className="sticky top-0 z-50 bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            {/* Left: Back Button */}
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center w-10 h-10 text-green-700 hover:text-green-800 hover:bg-green-50 rounded-full transition-colors"
            >
              <FaArrowLeft className="w-5 h-5" />
            </button>

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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <SectionTitle title="Propriétés disponibles pour co-hébergement" />
      
      {properties.length === 0 ? (
        <div className="text-center mt-20">
          <p className="text-gray-500 text-lg mb-4">
            Aucune propriété disponible pour le co-hébergement pour le moment.
          </p>
          <button 
            onClick={() => navigate(-1)}
            className="bg-green-700 text-white px-6 py-2 rounded-full hover:bg-green-800"
          >
            Retour
          </button>
        </div>
      ) : (
        <>
          <div className="mb-6 text-center">
            <p className="text-gray-600">
              {properties.length} propriété{properties.length > 1 ? 's' : ''} disponible{properties.length > 1 ? 's' : ''} pour le co-hébergement
            </p>
          </div>
          <ListingCardGrid 
            listings={properties} 
            onCardClick={handleCardClick}
          />
        </>
      )}
      </div>
    </div>
  );
}