import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { StarIcon } from "@heroicons/react/24/solid";
import { MapPinIcon, HomeIcon } from "@heroicons/react/24/outline";
import InitialsAvatar from "../../components/shared/InitialsAvatar";
import S3Image from "../../components/S3Image";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:4000";

export default function OwnerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [owner, setOwner] = useState(null);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOwnerAndProperties = async () => {
      try {
        console.log("🔍 Fetching owner with ID:", id);

        // Fetch owner data
        const ownerRes = await axios.get(`${API_BASE}/api/auth/user/${id}`);
        console.log("👤 Owner data received:", ownerRes.data);
        setOwner(ownerRes.data.user);

        // Fetch owner's properties
        console.log("🏠 Fetching properties for owner...");
        const propertiesRes = await axios.get(`${API_BASE}/api/property/owner/${id}`);
        console.log("🏠 Properties received:", propertiesRes.data);
        setProperties(propertiesRes.data.properties || []);

        setError(null);
      } catch (err) {
        console.error("Error fetching owner or properties:", err);
        console.error("Error response:", err.response?.data);

        if (err.response?.status === 404) setError("Hôte introuvable");
        else if (err.response?.status === 400) setError("ID d'hôte invalide");
        else setError("Erreur lors du chargement des informations de l'hôte");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchOwnerAndProperties();
    else {
      setLoading(false);
      setError("ID d'hôte manquant");
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.history.back()}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  if (!owner) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Hôte introuvable</p>
          <button
            onClick={() => window.history.back()}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Navigation Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            className="flex items-center space-x-2 text-green-600 hover:text-green-700 transition-colors"
            onClick={() => window.history.back()}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">Retour</span>
          </button>
          <div className="flex items-center space-x-2">
            <button
              className="p-2 text-green-600 hover:text-green-700 transition-colors"
              onClick={() => window.history.back()}
              title="Page précédente"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              className="p-2 text-green-600 hover:text-green-700 transition-colors"
              onClick={() => window.history.forward()}
              title="Page suivante"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
            <InitialsAvatar
              name={owner.fullName || owner.displayName || owner.name || 'Hôte'}
              size="w-24 h-24"
              textSize="text-3xl"
              backgroundColor="bg-gradient-to-br from-blue-500 to-green-500"
              className="border-4 border-white shadow-lg"
            />
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {owner.fullName || owner.displayName || owner.name || 'Hôte'}
              </h1>
              <p className="text-lg text-gray-600 mb-4">
                {owner.role === 'owner' ? 'Propriétaire' : owner.role === 'partner' ? 'Partenaire' : 'Hôte'}
              </p>
              
              {/* Owner Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                {owner.email && (
                  <div className="flex items-center space-x-2">
                    <span>📧</span>
                    <span>{owner.email}</span>
                  </div>
                )}
                {owner.country && (
                  <div className="flex items-center space-x-2">
                    <span>🌍</span>
                    <span>{owner.country}</span>
                  </div>
                )}
                {owner.isVerified && (
                  <div className="flex items-center space-x-2 text-green-600">
                    <span>✅</span>
                    <span>Compte vérifié</span>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <HomeIcon className="w-4 h-4" />
                  <span>{properties.length} propriété{properties.length > 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* About Section */}
        {owner.bio && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">À propos</h2>
            <p className="text-gray-700 leading-relaxed">{owner.bio}</p>
          </div>
        )}

        {/* Properties Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <HomeIcon className="w-6 h-6 mr-2 text-green-600" />
            Propriétés ({properties.length})
          </h2>
          
          {properties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property) => (
                <div
                  key={property._id}
                  className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/property/${property._id}`)}
                >
                  <S3Image
                    src={property.photos?.[0]}
                    alt={property.title}
                    className="w-full h-48 object-cover"
                    fallbackSrc="/villa1.jpg"
                  />
                  <div className="p-4">
                    <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-1">
                      {property.title || 'Propriété sans titre'}
                    </h3>
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <MapPinIcon className="w-4 h-4 mr-1" />
                      <span className="line-clamp-1">
                        {property.localisation?.city || 'Localisation non spécifiée'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        <StarIcon className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm text-gray-600">5.0 (Nouveau)</span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">
                          {(() => {
                            if (!property.price) return 'Prix sur demande';
                            if (typeof property.price === 'number') return `${property.price} MAD`;
                            if (typeof property.price === 'object') {
                              const priceValue = property.price.weekdays || property.price.weekend || property.price.price || property.price.pricePerNight;
                              return priceValue ? `${priceValue} MAD` : 'Prix sur demande';
                            }
                            return `${property.price} MAD`;
                          })()}
                        </p>
                        <p className="text-xs text-gray-500">par nuit</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <HomeIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucune propriété
              </h3>
              <p className="text-gray-600">
                Ce propriétaire n'a pas encore de propriétés publiées.
              </p>
            </div>
          )}
        </div>

        {/* Debug Info for Development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-semibold text-yellow-800 mb-2">🔧 Debug Info:</h3>
            <div className="text-sm text-yellow-700 space-y-1">
              <p><strong>Owner ID:</strong> {id}</p>
              <p><strong>Owner Name:</strong> {owner.fullName || owner.displayName || owner.name}</p>
              <p><strong>Properties Count:</strong> {properties.length}</p>
              <p><strong>Role:</strong> {owner.role}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
