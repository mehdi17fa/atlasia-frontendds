import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import S3Image from '../../components/S3Image';
import { CalendarDaysIcon, MapPinIcon, CurrencyDollarIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { FaHeart } from 'react-icons/fa';
import { useFavorites } from '../../hooks/useFavorites';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL}/api` : 'http://localhost:4000/api';

const ActivityCard = ({ activity, onBook }) => {
  const navigate = useNavigate();
  const { isFavorited, toggleFavorite, isAuthenticated } = useFavorites();

  const handleToggleFavorite = async (e) => {
    e.stopPropagation();
    console.log('🔄 ActivityCard: handleToggleFavorite called for:', activity._id);
    console.log('🔄 isAuthenticated:', isAuthenticated);
    
    if (!isAuthenticated) {
      alert('Please log in to save favorites');
      return;
    }
    
    console.log('🔄 Calling toggleFavorite for activity...');
    const result = await toggleFavorite(activity._id, 'package');
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
    if (activity.services?.length > 0) items.push(`${activity.services.length} service${activity.services.length > 1 ? 's' : ''}`);
    if (activity.activities?.length > 0) items.push(`${activity.activities.length} activité${activity.activities.length > 1 ? 's' : ''}`);
    if (activity.restaurants?.length > 0) items.push(`${activity.restaurants.length} restaurant${activity.restaurants.length > 1 ? 's' : ''}`);
    return items.join(', ') || 'Aucun élément';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300">
      {/* Header Image */}
      <div className="h-48 bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center relative">
        {/* Heart button */}
        <button
          onClick={handleToggleFavorite}
          className="absolute top-3 right-3 p-2 bg-black bg-opacity-30 rounded-full text-white hover:bg-opacity-50 transition-all"
          title={isFavorited(activity._id) ? "Remove from favorites" : "Add to favorites"}
        >
          <FaHeart
            className={`w-5 h-5 transition-colors duration-300 ${
              isFavorited(activity._id) ? "text-red-500" : "text-white hover:text-red-300"
            }`}
          />
        </button>
        
        <div className="text-white text-center">
          <h3 className="text-xl font-bold mb-2">{activity.name || 'Activité Expérience'}</h3>
          <p className="text-sm opacity-90">Par {activity.partner?.fullName || 'Partenaire'}</p>
        </div>
      </div>

      <div className="p-6">
        {/* Description */}
        <p className="text-gray-600 mb-4 line-clamp-3">
          {activity.description || 'Découvrez une activité unique avec cette expérience personnalisée.'}
        </p>

        {/* Activity Details */}
        <div className="space-y-3 mb-4">
          {/* Dates */}
          <div className="flex items-center text-sm text-gray-600">
            <CalendarDaysIcon className="h-4 w-4 mr-2 text-blue-600" />
            <span>
              {activity.startDate && activity.endDate 
                ? `${formatDate(activity.startDate)} - ${formatDate(activity.endDate)}`
                : 'Dates flexibles'
              }
            </span>
          </div>

          {/* Items Included */}
          <div className="flex items-center text-sm text-gray-600">
            <UserGroupIcon className="h-4 w-4 mr-2 text-blue-600" />
            <span>{getItemsText()}</span>
          </div>
        </div>

        {/* Items Preview */}
        {(activity.restaurants?.length > 0 || activity.activities?.length > 0 || activity.services?.length > 0) && (
          <div className="mb-4">
            <h4 className="font-medium text-gray-900 mb-2">Inclus dans cette activité:</h4>
            <div className="space-y-2">
              {activity.restaurants?.slice(0, 2).map((item, index) => (
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
              {activity.activities?.slice(0, 2).map((item, index) => (
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
              {activity.services?.slice(0, 2).map((item, index) => (
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
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center">
            <CurrencyDollarIcon className="h-5 w-5 text-blue-600 mr-1" />
            <span className="text-lg font-bold text-gray-900">
              {activity.totalPrice ? `${activity.totalPrice} MAD` : 'Prix sur demande'}
            </span>
          </div>
          <button
            onClick={() => onBook(activity)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Réserver
          </button>
        </div>
      </div>
    </div>
  );
};

export default function Activites() {
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch only individual packages (packages without properties)
      const params = new URLSearchParams();
      params.append('type', 'individual'); // Only individual packages
      params.append('limit', '100');
      
      const url = `${API_BASE_URL}/packages/published?${params.toString()}`;
      console.log('🔗 Fetching individual packages from:', url);
      
      const response = await fetch(url);
      console.log('📡 Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('🎯 Individual packages received:', data.packages?.length || 0);
        console.log('🎯 Package data:', data);
        
        // Debug: Log each package
        if (data.packages) {
          data.packages.forEach((pkg, index) => {
            console.log(`🎯 Frontend Activity ${index + 1}:`, {
              id: pkg._id,
              name: pkg.name,
              type: pkg.type,
              status: pkg.status,
              partner: pkg.partner?.fullName,
              hasProperty: !!pkg.property
            });
          });
        }
        
        setActivities(data.packages || []);
      } else {
        throw new Error(`Failed to fetch activities: ${response.status}`);
      }
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError('Erreur lors du chargement des activités');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookActivity = (activity) => {
    if (!token) {
      // Redirect to login if not authenticated
      navigate('/login', { state: { from: `/packages/${activity._id}` } });
      return;
    }

    // Navigate to booking page
    navigate(`/packages/${activity._id}/book`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchActivities}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Activités & Expériences
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Découvrez des activités uniques et des expériences personnalisées créées par nos partenaires. 
            Chaque activité est conçue pour vous faire vivre des moments inoubliables.
          </p>
        </div>

        {/* Debug Info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Debug Info:</h3>
            <p className="text-sm text-blue-700">
              Total individual packages: {activities.length} | 
              Filter: individual (no property required)
            </p>
          </div>
        )}

        {/* Activities Grid */}
        {activities.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <UserGroupIcon className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucune activité disponible
            </h3>
            <p className="text-gray-600">
              Les activités et expériences seront bientôt disponibles. Revenez plus tard !
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {activities.map((activity) => (
              <ActivityCard 
                key={activity._id} 
                activity={activity} 
                onBook={handleBookActivity}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

