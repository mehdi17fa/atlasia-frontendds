import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import S3Image from '../../components/S3Image';
import { CalendarDaysIcon, MapPinIcon, CurrencyDollarIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { FaHeart } from 'react-icons/fa';
import { useFavorites } from '../../hooks/useFavorites';

const PackageCard = ({ package: pkg, onBook }) => {
  const navigate = useNavigate();
  const { isFavorited, toggleFavorite, isAuthenticated } = useFavorites();

  const handleToggleFavorite = async (e) => {
    e.stopPropagation();
    console.log('🔄 PackageCard: handleToggleFavorite called for:', pkg._id);
    console.log('🔄 isAuthenticated:', isAuthenticated);
    
    if (!isAuthenticated) {
      alert('Please log in to save favorites');
      return;
    }
    
    console.log('🔄 Calling toggleFavorite for package...');
    const result = await toggleFavorite(pkg._id, 'package');
    console.log('🔄 toggleFavorite result:', result);
  };
  
  const formatDate = (date) => {
    if (!date) return 'Non spécifié';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getItemsText = () => {
    const items = [];
    if (pkg.services?.length > 0) items.push(`${pkg.services.length} service${pkg.services.length > 1 ? 's' : ''}`);
    if (pkg.activities?.length > 0) items.push(`${pkg.activities.length} activité${pkg.activities.length > 1 ? 's' : ''}`);
    if (pkg.restaurants?.length > 0) items.push(`${pkg.restaurants.length} restaurant${pkg.restaurants.length > 1 ? 's' : ''}`);
    return items.join(', ') || 'Aucun élément';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-secondary-200 overflow-hidden hover:shadow-xl transition-shadow duration-300">
      {/* Header Image */}
      <div className="h-48 bg-gradient-to-r from-primary-400 to-primary-600 flex items-center justify-center relative">
        {/* Heart button */}
        <button
          onClick={handleToggleFavorite}
          className="absolute top-3 right-3 p-2 bg-black bg-opacity-30 rounded-full text-white hover:bg-opacity-50 transition-all"
          title={isFavorited(pkg._id) ? "Remove from favorites" : "Add to favorites"}
        >
          <FaHeart
            className={`w-5 h-5 transition-colors duration-300 ${
              isFavorited(pkg._id) ? "text-red-500" : "text-white hover:text-red-300"
            }`}
          />
        </button>
        
        <div className="text-white text-center">
          <h3 className="text-xl font-bold mb-2">{pkg.name || 'Package Expérience'}</h3>
          <p className="text-sm opacity-90">Par {pkg.partner?.fullName || 'Partenaire'}</p>
        </div>
      </div>

      <div className="p-6">
        {/* Description */}
        <p className="text-gray-600 mb-4 line-clamp-3">
          {pkg.description || 'Découvrez une expérience unique avec ce package personnalisé.'}
        </p>

        {/* Package Details */}
        <div className="space-y-3 mb-4">
          {/* Dates */}
          <div className="flex items-center text-sm text-gray-600">
            <CalendarDaysIcon className="h-4 w-4 mr-2 text-green-600" />
            <span>
              {pkg.startDate && pkg.endDate 
                ? `${formatDate(pkg.startDate)} - ${formatDate(pkg.endDate)}`
                : 'Dates flexibles'
              }
            </span>
          </div>

          {/* Property Location */}
          {pkg.property?.localisation && (
            <div className="flex items-center text-sm text-gray-600">
              <MapPinIcon className="h-4 w-4 mr-2 text-green-600" />
              <span>{pkg.property.localisation.city || 'Maroc'}</span>
            </div>
          )}

          {/* Items Included */}
          <div className="flex items-center text-sm text-gray-600">
            <UserGroupIcon className="h-4 w-4 mr-2 text-green-600" />
            <span>{getItemsText()}</span>
          </div>
        </div>

        {/* Items Preview */}
        {(pkg.restaurants?.length > 0 || pkg.activities?.length > 0 || pkg.services?.length > 0) && (
          <div className="mb-4">
            <h4 className="font-medium text-gray-900 mb-2">Inclus dans ce package:</h4>
            <div className="space-y-2">
              {pkg.restaurants?.slice(0, 2).map((item, index) => (
                <div key={`restaurant-${index}`} className="flex items-center space-x-2">
                  {item.thumbnail && (
                    <S3Image 
                      src={item.thumbnail} 
                      alt={item.name}
                      className="w-8 h-8 object-cover rounded"
                      fallbackSrc="/placeholder.jpg"
                    />
                  )}
                  <span className="text-sm text-gray-700">🍽️ {item.name}</span>
                </div>
              ))}
              {pkg.activities?.slice(0, 2).map((item, index) => (
                <div key={`activity-${index}`} className="flex items-center space-x-2">
                  {item.thumbnail && (
                    <S3Image 
                      src={item.thumbnail} 
                      alt={item.name}
                      className="w-8 h-8 object-cover rounded"
                      fallbackSrc="/placeholder.jpg"
                    />
                  )}
                  <span className="text-sm text-gray-700">🎯 {item.name}</span>
                </div>
              ))}
              {pkg.services?.slice(0, 2).map((item, index) => (
                <div key={`service-${index}`} className="flex items-center space-x-2">
                  {item.thumbnail && (
                    <S3Image 
                      src={item.thumbnail} 
                      alt={item.name}
                      className="w-8 h-8 object-cover rounded"
                      fallbackSrc="/placeholder.jpg"
                    />
                  )}
                  <span className="text-sm text-gray-700">⚡ {item.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Price and Action */}
        <div className="flex items-center justify-between pt-4 border-t border-secondary-200">
          <div className="flex items-center">
            <CurrencyDollarIcon className="h-5 w-5 text-primary-600 mr-1" />
            <span className="text-lg font-bold text-secondary-900">
              {pkg.totalPrice ? `${pkg.totalPrice} MAD` : 'Prix sur demande'}
            </span>
          </div>
          <button
            onClick={() => onBook(pkg)}
            className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors font-medium shadow-atlasia"
          >
            Réserver
          </button>
        </div>
      </div>
    </div>
  );
};

export default function Packages() {
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);
  const [packages, setPackages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'individual', 'property'

  useEffect(() => {
    fetchPackages();
  }, [filter]);

  const fetchPackages = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filter !== 'all') {
        params.append('type', filter);
      }
      params.append('limit', '100'); // Get more packages
      
      const url = `${process.env.REACT_APP_API_URL}/api/packages/published?${params.toString()}`;
      console.log('🔗 Fetching packages from:', url);
      
      const response = await fetch(url);
      console.log('📡 Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📦 Packages received:', data.packages?.length || 0);
        console.log('📦 Package data:', data);
        
        // Debug: Log each package
        if (data.packages) {
          data.packages.forEach((pkg, index) => {
            console.log(`📦 Frontend Package ${index + 1}:`, {
              id: pkg._id,
              name: pkg.name,
              type: pkg.type,
              status: pkg.status,
              partner: pkg.partner?.fullName,
              property: pkg.property?.title || 'No property'
            });
          });
        }
        
        setPackages(data.packages || []);
      } else {
        throw new Error(`Failed to fetch packages: ${response.status}`);
      }
    } catch (err) {
      console.error('Error fetching packages:', err);
      setError('Erreur lors du chargement des packages');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookPackage = (pkg) => {
    if (!token) {
      // Redirect to login if not authenticated
      navigate('/login', { state: { from: `/packages/${pkg._id}` } });
      return;
    }

    // Navigate to booking page
    navigate(`/packages/${pkg._id}/book`);
  };

  if (isLoading) {
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
            onClick={fetchPackages}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Packages d'Expériences
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Découvrez des expériences uniques créées par nos partenaires locaux. 
            Chaque package combine hébergement, restauration, activités et services pour un séjour inoubliable.
          </p>
        </div>

        {/* Filter */}
        <div className="mb-8 flex justify-center">
          <div className="flex space-x-2 bg-secondary-100 p-1 rounded-lg">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'text-secondary-600 hover:text-primary-600'
              }`}
            >
              Tous ({packages.length})
            </button>
            <button
              onClick={() => setFilter('individual')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'individual'
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'text-secondary-600 hover:text-primary-600'
              }`}
            >
              Individuels
            </button>
            <button
              onClick={() => setFilter('property')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'property'
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'text-secondary-600 hover:text-primary-600'
              }`}
            >
              Avec Propriété
            </button>
          </div>
        </div>

        {/* Debug Info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Debug Info:</h3>
            <p className="text-sm text-blue-700">
              Total packages: {packages.length} | 
              Individual: {packages.filter(p => p && p.type === 'individual').length} | 
              Property: {packages.filter(p => p && p.type === 'property').length} | 
              Filter: {filter}
            </p>
          </div>
        )}

        {/* Packages Grid */}
        {packages.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <UserGroupIcon className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun package disponible
            </h3>
            <p className="text-gray-600">
              Les packages d'expériences seront bientôt disponibles. Revenez plus tard !
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {packages.map((pkg) => (
              <PackageCard 
                key={pkg._id} 
                package={pkg} 
                onBook={handleBookPackage}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
