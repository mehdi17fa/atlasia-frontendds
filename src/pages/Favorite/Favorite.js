// src/pages/Favorites/Favorites.js
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import SectionTitle from '../../components/shared/SectionTitle';
import { FaHeart, FaMapMarkerAlt, FaCalendarAlt, FaUsers } from 'react-icons/fa';
import S3Image from '../../components/S3Image';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL}/api` : 'http://localhost:4000/api';

export default function Favorites() {
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'properties', 'packages'

  useEffect(() => {
    if (user && token && user.role === 'tourist') {
      fetchFavorites();
    } else {
      setLoading(false);
    }
  }, [user, token]);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 Fetching favorites from:', `${API_BASE_URL}/favorites/`);
      const response = await axios.get(`${API_BASE_URL}/favorites/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Favorites response:', response.data);
      console.log('📊 Favorites count:', response.data.favorites?.length || 0);
      setFavorites(response.data.favorites || []);
    } catch (err) {
      console.error('❌ Error fetching favorites:', err);
      console.error('❌ Error response:', err.response?.data);
      setError(`Failed to fetch favorites: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (favoriteId, itemId, itemType) => {
    try {
      await axios.delete(`${API_BASE_URL}/favorites/${itemId}?itemType=${itemType}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFavorites(prev => prev.filter(fav => fav._id !== favoriteId));
    } catch (err) {
      console.error('Error removing favorite:', err);
      setError('Failed to remove favorite');
    }
  };

  const handleItemClick = (item, itemType) => {
    if (itemType === 'property') {
      navigate(`/property/${item._id}`);
    } else if (itemType === 'package') {
      navigate(`/packages/${item._id}/book`);
    }
  };

  const filteredFavorites = favorites.filter(fav => {
    if (activeTab === 'all') return true;
    return fav.itemType === activeTab;
  });

  const PropertyCard = ({ item, favoriteId }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative">
        <S3Image
          src={item.photos?.[0] || item.image}
          alt={item.title || 'Property'}
          className="w-full h-48 object-cover"
          fallbackSrc="/placeholder.jpg"
        />
        <button
          onClick={() => removeFavorite(favoriteId, item._id, 'property')}
          className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:scale-110 transition-transform"
        >
          <FaHeart className="w-4 h-4 text-red-500" />
        </button>
      </div>
      <div className="p-4" onClick={() => handleItemClick(item, 'property')}>
        <h3 className="font-semibold text-lg text-gray-900 mb-1">{item.title || 'Untitled Property'}</h3>
        <p className="text-gray-600 text-sm mb-2">
          {item.localisation?.city || item.localisation || 'Location not specified'}
        </p>
        <p className="font-bold text-green-600">
          {item.price ? `${item.price} MAD / nuit` : 'Price not available'}
        </p>
      </div>
    </div>
  );

  const PackageCard = ({ item, favoriteId }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-4" onClick={() => handleItemClick(item, 'package')}>
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-gray-900 mb-1">{item.name || 'Untitled Package'}</h3>
            <p className="text-gray-600 text-sm mb-2">{item.description || 'No description available'}</p>
          </div>
          <button
            onClick={() => removeFavorite(favoriteId, item._id, 'package')}
            className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors ml-2"
          >
            <FaHeart className="w-4 h-4 text-red-500" />
          </button>
        </div>
        
        {item.property && (
          <div className="flex items-center text-sm text-gray-600 mb-2">
            <FaMapMarkerAlt className="w-4 h-4 mr-1" />
            <span>{item.property.title || 'Associated Property'}</span>
          </div>
        )}
        
        <div className="flex justify-between items-center">
          <span className="font-bold text-green-600">
            {item.totalPrice ? `${item.totalPrice} MAD` : 'Price not available'}
          </span>
          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
            Package
          </span>
        </div>
      </div>
    </div>
  );

  if (!user || user.role !== 'tourist') {
    return (
      <div className="pb-20 px-4 mt-24 text-center">
        <SectionTitle title="Ma Liste" />
        <p className="text-gray-600 mt-8">Please log in as a tourist to view your favorites.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="pb-20 px-4 mt-24">
        <SectionTitle title="Ma Liste" />
        <div className="text-center mt-8">
          <p className="text-gray-600">Loading your favorites...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pb-20 px-4 mt-24">
        <SectionTitle title="Ma Liste" />
        <div className="text-center mt-8">
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchFavorites}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20 px-4 mt-24">
      <SectionTitle title="Ma Liste" />
      
      {/* Tabs */}
      <div className="flex space-x-4 mt-6 mb-6">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'all'
              ? 'bg-green-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Tout ({favorites.length})
        </button>
        <button
          onClick={() => setActiveTab('property')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'property'
              ? 'bg-green-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Logements ({favorites.filter(f => f.itemType === 'property').length})
        </button>
        <button
          onClick={() => setActiveTab('package')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'package'
              ? 'bg-green-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Packages ({favorites.filter(f => f.itemType === 'package').length})
        </button>
      </div>

      {/* Favorites List */}
      {filteredFavorites.length === 0 ? (
        <div className="text-center mt-12">
          <FaHeart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun favori</h3>
          <p className="text-gray-600 mb-4">
            {activeTab === 'all' 
              ? "Vous n'avez pas encore de favoris. Explorez et ajoutez des propriétés et packages à votre liste !"
              : `Vous n'avez pas encore de favoris ${activeTab === 'property' ? 'logements' : 'packages'}.`
            }
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Explorer
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFavorites.map((favorite) => (
            <div key={favorite._id}>
              {favorite.itemType === 'property' ? (
                <PropertyCard item={favorite.item} favoriteId={favorite._id} />
              ) : (
                <PackageCard item={favorite.item} favoriteId={favorite._id} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
