import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import S3Image from '../../components/S3Image';
import { CalendarDaysIcon, MapPinIcon, CurrencyDollarIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { FaHeart } from 'react-icons/fa';
import { useFavorites } from '../../hooks/useFavorites';
import axios from 'axios';

const API_BASE_URL = `${process.env.REACT_APP_API_URL}/api`;

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
    <div className="w-[240px] border rounded-xl shadow-sm bg-white overflow-hidden flex-shrink-0">
      <div className="relative">
        <div className="h-36 bg-gradient-to-r from-primary-400 to-primary-600 flex items-center justify-center">
          <div className="text-white text-center">
            <h3 className="text-lg font-bold mb-1">{activity.name || 'Activité'}</h3>
            <p className="text-xs opacity-90">Par {activity.partner?.fullName || 'Partenaire'}</p>
          </div>
        </div>
        {/* Heart button */}
        <button
          onClick={handleToggleFavorite}
          className="absolute top-2 right-2 p-1.5 bg-white bg-opacity-90 backdrop-blur-sm rounded-full shadow-sm transform transition hover:scale-110 active:scale-95"
          title={isFavorited(activity._id) ? "Remove from favorites" : "Add to favorites"}
        >
          <FaHeart
            className={`w-4 h-4 transition-colors duration-300 ${
              isFavorited(activity._id) ? "text-red-500" : "text-gray-400 hover:text-red-400"
            }`}
          />
        </button>
      </div>
      
      <div className="p-3 space-y-1">
        <div className="flex flex-wrap justify-between text-xs text-gray-600">
          <p className="font-semibold text-black-500">{activity.partner?.fullName || 'Partenaire'}</p>
          <p className="text-gray-500">Activité</p>
        </div>

        <h3 className="font-bold text-lg text-black line-clamp-1">{activity.name || 'Activité Expérience'}</h3>
        
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center">
            <CurrencyDollarIcon className="h-4 w-4 text-green-600 mr-1" />
            <span className="text-sm font-bold text-gray-900">
              {activity.totalPrice ? `${activity.totalPrice} MAD` : 'Sur demande'}
            </span>
          </div>
          <button
            onClick={() => onBook(activity)}
            className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition-colors text-xs font-medium"
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
    <div className="min-h-screen bg-white pb-28 px-4 md:px-20">
      {/* Activities Grid */}
        {activities.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-green-400 mb-4">
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
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-green-900 mb-2">Activités & Expériences</h2>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {activities.map((activity) => (
                <ActivityCard 
                  key={activity._id} 
                  activity={activity} 
                  onBook={handleBookActivity}
                />
              ))}
            </div>
          </div>
        )}
    </div>
  );
}

