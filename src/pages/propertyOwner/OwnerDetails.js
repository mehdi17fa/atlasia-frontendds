import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../api";
import { StarIcon } from "@heroicons/react/24/solid";
import { MapPinIcon, HomeIcon } from "@heroicons/react/24/outline";
import InitialsAvatar from "../../components/shared/InitialsAvatar";
import S3Image from "../../components/S3Image";
import PropertyOptionsMenu from "../../components/shared/PropertyOptionsMenu";
import { AuthContext } from "../../context/AuthContext";

export default function OwnerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [owner, setOwner] = useState(null);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Property management functions
  const handlePropertyEdit = (property) => {
    navigate(`/edit-property/${property._id}`);
  };

  const handlePropertyDelete = async (property) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la propriété "${property.title || 'cette propriété'}" ?`)) {
      try {
        const deleteUrl = `/api/property/${property._id}`;
        console.log('🗑️ Attempting to delete property:', {
          propertyId: property._id,
          url: deleteUrl,
          fullUrl: `${api.defaults.baseURL}${deleteUrl}`,
          method: 'DELETE'
        });
        
        const response = await api.delete(deleteUrl);
        
        console.log('✅ Delete response:', response);
        
        if (response.data.success) {
          // Refresh properties list
          const updatedProperties = properties.filter(p => p._id !== property._id);
          setProperties(updatedProperties);
          // Show success message
          alert('Propriété supprimée avec succès');
        } else {
          throw new Error(response.data.message || 'Erreur lors de la suppression');
        }
      } catch (error) {
        console.error('❌ Error deleting property:', {
          error: error,
          response: error.response,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message
        });
        
        const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de la suppression de la propriété';
        alert(`Erreur: ${errorMessage} (Status: ${error.response?.status || 'N/A'})`);
        throw error; // Re-throw to let PropertyOptionsMenu handle it
      }
    }
  };

  const handlePropertyInfo = (property) => {
    navigate(`/property/${property._id}`);
  };

  useEffect(() => {
    const fetchOwnerAndProperties = async () => {
      try {
        console.log("🔍 Fetching owner with ID:", id);

        // Fetch owner data
        const ownerRes = await api.get(`/api/auth/user/${id}`);
        console.log("👤 Owner data received:", ownerRes.data);
        setOwner(ownerRes.data.user);

        // Fetch owner's properties
        console.log("🏠 Fetching properties for owner...");
        const propertiesRes = await api.get(`/api/property/owner/${id}`);
        console.log("🏠 Properties received:", propertiesRes.data);
        setProperties(propertiesRes.data.properties || []);

        setError(null);
      } catch (err) {
        console.error("Error fetching owner or properties:", err);
        console.error("Error response:", err.response?.data);

        // The API interceptor will handle 401 errors and token refresh automatically
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
      {/* Mobile Header */}
      <div className="md:hidden sticky top-0 z-50 bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Back Button */}
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center w-10 h-10 text-green-700 hover:text-green-800 hover:bg-green-50 rounded-full transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Center: Atlasia Branding */}
            <div className="text-center">
              <button
                onClick={() => {
                  // Navigate based on user role
                  if (user?.role === 'tourist' || !user) {
                    navigate('/');
                  } else if (user?.role === 'owner') {
                    navigate('/owner-welcome');
                  } else if (user?.role === 'partner') {
                    navigate('/partner-welcome');
                  } else {
                    navigate('/');
                  }
                }}
                className="font-bold text-green-700 text-xl hover:text-green-800 transition-colors"
              >
                ATLASIA
              </button>
            </div>

            {/* Right: Empty space for balance */}
            <div className="w-10"></div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
            {owner.profilePic || owner.profileImage ? (
              <S3Image
                src={owner.profilePic || owner.profileImage}
                alt={owner.fullName || owner.displayName || owner.name || 'Hôte'}
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                fallbackSrc="/profilepic.jpg"
              />
            ) : (
              <InitialsAvatar
                name={owner.fullName || owner.displayName || owner.name || 'Hôte'}
                size="w-24 h-24"
                textSize="text-3xl"
                backgroundColor="bg-gradient-to-br from-blue-500 to-green-500"
                className="border-4 border-white shadow-lg"
              />
            )}
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
                  className="relative border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <S3Image
                    src={property.photos?.[0]}
                    alt={property.title}
                    className="w-full h-48 object-cover cursor-pointer"
                    fallbackSrc="/villa1.jpg"
                    onClick={() => navigate(`/property/${property._id}`)}
                  />
                  
                  {/* Options menu */}
                  <PropertyOptionsMenu
                    property={property}
                    onEdit={handlePropertyEdit}
                    onDelete={handlePropertyDelete}
                    onInfo={handlePropertyInfo}
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
