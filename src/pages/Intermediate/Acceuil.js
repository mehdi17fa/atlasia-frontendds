import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import S3Image from '../../components/S3Image';

import {
  HomeIcon,
  MapPinIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  ArchiveBoxIcon,
  CheckCircleIcon,
  RocketLaunchIcon,
  ArrowRightIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

import { AuthContext } from '../../context/AuthContext';

// API configuration
const API_BASE_URL = 'http://localhost:4000/api';

const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
  </div>
);

const PropertyCard = ({ property }) => {
  const navigate = useNavigate();

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    return `${API_BASE_URL.replace('/api', '')}/uploads/profilepic/${imagePath}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative">
        {property.photos && property.photos.length > 0 ? (
          <S3Image
            src={property.photos[0]}
            alt={property.title}
            className="w-full h-48 object-cover"
            fallbackSrc="https://via.placeholder.com/400x200?text=Pas+d'image"
          />
        ) : (
          <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
            <HomeIcon className="h-16 w-16 text-gray-400" />
          </div>
        )}
        <div className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 rounded-full text-xs font-medium">
          Co-hôte
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2">
          {property.title || 'Propriété sans titre'}
        </h3>

        <div className="text-sm text-gray-600 mb-2">
          <div className="flex items-center mb-1">
            <MapPinIcon className="h-4 w-4 mr-1 text-gray-500" />
            <span>
              {property.localisation?.city || 'Ville non définie'}
              {property.localisation?.address && `, ${property.localisation.address}`}
            </span>
          </div>

          {property.info && (
            <div className="flex items-center space-x-4 text-xs">
              <span>{property.info.guests || 0} invités</span>
              <span>{property.info.bedrooms || 0} chambres</span>
              <span>{property.info.bathrooms || 0} salles de bain</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mb-2">
          <span className={`px-2 py-1 rounded-full text-xs ${
            property.status === 'published'
              ? 'bg-green-100 text-green-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {property.status === 'published' ? 'Publiée' : 'Brouillon'}
          </span>

          {property.price && (
            <div className="text-sm font-medium text-gray-900">
              {(() => {
                if (typeof property.price === 'number') return `${property.price}€/nuit`;
                if (typeof property.price === 'object') {
                  const priceValue = property.price.weekdays || property.price.weekend || property.price.price || property.price.pricePerNight;
                  return priceValue ? `${priceValue}€/nuit` : 'Prix sur demande';
                }
                return `${property.price}€/nuit`;
              })()}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="text-xs text-gray-500">
            {property.equipments && property.equipments.length > 0 && (
              <span>{property.equipments.length} équipement{property.equipments.length > 1 ? 's' : ''}</span>
            )}
          </div>

          <button
            onClick={() => navigate(`/property/${property._id}`)}
            className="text-green-600 hover:text-green-700 text-sm font-medium"
          >
            Voir détails
          </button>
        </div>
      </div>
    </div>
  );
};

const PackageCard = ({ package: pkg }) => {
  const navigate = useNavigate();

  const getStatusColor = (status) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getItemsText = () => {
    const items = [];
    if (pkg.services?.length > 0) items.push(`${pkg.services.length} service${pkg.services.length > 1 ? 's' : ''}`);
    if (pkg.activities?.length > 0) items.push(`${pkg.activities.length} activité${pkg.activities.length > 1 ? 's' : ''}`);
    if (pkg.restaurants?.length > 0) items.push(`${pkg.restaurants.length} restaurant${pkg.restaurants.length > 1 ? 's' : ''}`);
    return items.join(', ') || 'Aucun élément';
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">
            {pkg.name || 'Package sans titre'}
          </h3>
          <p className="text-sm text-gray-600 line-clamp-2">
            {pkg.description || 'Aucune description'}
          </p>
        </div>

        <span className={`px-2 py-1 rounded-full text-xs font-medium ml-2 ${getStatusColor(pkg.status)}`}>
          {pkg.status === 'published' ? 'Publié' : 'Brouillon'}
        </span>
      </div>

      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex items-center">
          <HomeIcon className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
          <span className="truncate">{pkg.property?.title || 'Propriété non définie'}</span>
        </div>

        <div className="flex items-center">
          <CalendarDaysIcon className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
          <span className="text-xs">
            {pkg.startDate && pkg.endDate 
              ? `${new Date(pkg.startDate).toLocaleDateString('fr-FR')} - ${new Date(pkg.endDate).toLocaleDateString('fr-FR')}`
              : 'Dates non définies'
            }
          </span>
        </div>

        <div className="flex items-center">
          <ArchiveBoxIcon className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
          <span className="text-xs">{getItemsText()}</span>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
        <div className="text-xs text-gray-500">
          Créé le {new Date(pkg.createdAt).toLocaleDateString('fr-FR')}
        </div>

        <button
          onClick={() => navigate(`/package/${pkg._id}`)}
          className="text-green-600 hover:text-green-700 text-sm font-medium"
        >
          Voir détails
        </button>
      </div>
    </div>
  );
};

const EmptyState = ({ type, onAction, actionText, icon: Icon, title, description }) => (
  <div className="text-center py-12">
    <div className="mb-4 flex justify-center">
      <Icon className="h-16 w-16 text-gray-300" />
    </div>
    <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-600 mb-6 max-w-md mx-auto">{description}</p>
    <button
      onClick={onAction}
      className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
    >
      {actionText}
    </button>
  </div>
);

const ErrorAlert = ({ message, onRetry }) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
    <div className="flex items-center">
      <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
      <div className="flex-1">
        <p className="text-red-800">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-red-600 hover:text-red-700 text-sm font-medium ml-4"
        >
          Réessayer
        </button>
      )}
    </div>
  </div>
);

const PackageBookingCard = ({ booking, onStatusUpdate }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [partnerMessage, setPartnerMessage] = useState('');

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const handleStatusUpdate = async (status) => {
    setIsUpdating(true);
    try {
      await onStatusUpdate(booking._id, status, partnerMessage);
      setShowMessage(false);
      setPartnerMessage('');
    } catch (error) {
      console.error('Error updating booking status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">
            {booking.package?.name || 'Package'}
          </h3>
          <p className="text-sm text-gray-600 mb-2">
            Client: {booking.user?.fullName || 'Nom non disponible'}
          </p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
          {booking.status === 'confirmed' ? 'Confirmé' : 'Annulé'}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <CalendarDaysIcon className="h-4 w-4 mr-2" />
          <span>
            {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}
          </span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <UserGroupIcon className="h-4 w-4 mr-2" />
          <span>{booking.guests} invité{booking.guests > 1 ? 's' : ''}</span>
        </div>
      </div>

      {booking.message && (
        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <p className="text-sm text-gray-700">
            <strong>Message du client:</strong> {booking.message}
          </p>
        </div>
      )}

      {booking.status === 'confirmed' && (
        <div className="flex space-x-2">
          <button
            onClick={() => setShowMessage(!showMessage)}
            className="flex-1 bg-red-50 text-red-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
            disabled={isUpdating}
          >
            Annuler
          </button>
        </div>
      )}

      {showMessage && (
        <div className="mt-4 space-y-3 border-t pt-4">
          <textarea
            value={partnerMessage}
            onChange={(e) => setPartnerMessage(e.target.value)}
            placeholder="Message pour le client (optionnel)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            rows="2"
          />
          <div className="flex space-x-2">
            <button
              onClick={() => handleStatusUpdate('cancelled')}
              className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              disabled={isUpdating}
            >
              {isUpdating ? 'Annulation...' : 'Confirmer l\'annulation'}
            </button>
            <button
              onClick={() => setShowMessage(false)}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-400 transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default function PartnerDashboard() {
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);

  const [properties, setProperties] = useState([]);
  const [packages, setPackages] = useState([]);
  const [packageBookings, setPackageBookings] = useState([]);
  const [isLoadingProperties, setIsLoadingProperties] = useState(true);
  const [isLoadingPackages, setIsLoadingPackages] = useState(true);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);
  const [error, setError] = useState(null);

  // API helper utilisant token
  const apiCall = async (endpoint, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    });

    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
      return;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    await Promise.all([fetchProperties(), fetchPackages(), fetchPackageBookings()]);
  };

  const fetchProperties = async () => {
    try {
      setIsLoadingProperties(true);
      setError(null);

      const response = await apiCall('/partner/my-properties');
      if (response.success && Array.isArray(response.properties)) {
        setProperties(response.properties);
      } else {
        setProperties([]);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
      setError(error.message || 'Erreur lors du chargement des propriétés');
      setProperties([]);
    } finally {
      setIsLoadingProperties(false);
    }
  };

  const fetchPackages = async () => {
    try {
      setIsLoadingPackages(true);
      const response = await apiCall('/packages/mine');
      if (response.success && Array.isArray(response.packages)) {
        setPackages(response.packages);
      } else {
        setPackages([]);
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
      setError(error.message || 'Erreur lors du chargement des packages');
      setPackages([]);
    } finally {
      setIsLoadingPackages(false);
    }
  };

  const fetchPackageBookings = async () => {
    try {
      setIsLoadingBookings(true);
      const response = await apiCall('/packagebooking/partner');
      if (response.success && Array.isArray(response.bookings)) {
        setPackageBookings(response.bookings);
      } else {
        setPackageBookings([]);
      }
    } catch (error) {
      console.error('Error fetching package bookings:', error);
      setError(error.message || 'Erreur lors du chargement des réservations');
      setPackageBookings([]);
    } finally {
      setIsLoadingBookings(false);
    }
  };

  const handleBookingStatusUpdate = async (bookingId, status, message) => {
    try {
      const response = await apiCall(`/packagebooking/${bookingId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, message })
      });

      if (response.success) {
        // Refresh bookings after update
        await fetchPackageBookings();
        alert(`Réservation ${status === 'confirmed' ? 'acceptée' : 'annulée'} avec succès!`);
      } else {
        throw new Error(response.message || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Error updating booking status:', error);
      alert('Erreur lors de la mise à jour de la réservation');
      throw error;
    }
  };

  const stats = {
    totalProperties: properties.length,
    publishedProperties: properties.filter(p => p.status === 'published').length,
    totalPackages: packages.length,
    publishedPackages: packages.filter(p => p.status === 'published').length,
    draftPackages: packages.filter(p => p.status === 'draft').length,
  };

  const retryFetch = () => {
    setError(null);
    fetchData();
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-4 sm:mb-0">
              <h1 className="text-2xl font-bold text-gray-900">Tableau de bord partenaire</h1>
              <p className="text-gray-600">Gérez vos propriétés co-hôtes et vos packages</p>
            </div>

            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => navigate('/cohosting-explore')}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-center"
              >
                Explorer les propriétés
              </button>
              <button
                onClick={() => navigate('/create-package')}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-center"
              >
                Créer un package
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <HomeIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Propriétés co-hôtes</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalProperties}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Propriétés publiées</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.publishedProperties}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ArchiveBoxIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total packages</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalPackages}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <RocketLaunchIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Packages publiés</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.publishedPackages}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <ErrorAlert message={error} onRetry={retryFetch} />
        )}

        {/* Properties Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Mes propriétés co-hôtes</h2>
            <button
              onClick={() => navigate('/cohosting-explore')}
              className="text-green-600 hover:text-green-700 font-medium text-sm flex items-center"
            >
              Explorer plus de propriétés
              <ArrowRightIcon className="h-4 w-4 ml-1" />
            </button>
          </div>

          {isLoadingProperties ? (
            <LoadingSpinner />
          ) : properties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property) => (
                <PropertyCard key={property._id} property={property} />
              ))}
            </div>
          ) : (
            <EmptyState
              type="properties"
              icon={HomeIcon}
              title="Aucune propriété co-hôte"
              description="Vous ne co-hébergez aucune propriété pour le moment. Explorez les opportunités de co-hébergement disponibles."
              onAction={() => navigate('/cohosting-explore')}
              actionText="Explorer les propriétés"
            />
          )}
        </div>

        {/* Services Section - Combined Co-hosted Properties and Packages */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Mes services</h2>
            <div className="flex items-center space-x-4">
              {stats.draftPackages > 0 && (
                <span className="text-sm text-amber-600 flex items-center">
                  <ClockIcon className="h-4 w-4 mr-1" />
                  {stats.draftPackages} brouillon{stats.draftPackages > 1 ? 's' : ''}
                </span>
              )}
              <button
                onClick={() => navigate('/create-package')}
                className="text-green-600 hover:text-green-700 font-medium text-sm flex items-center"
              >
                Créer un nouveau package
                <ArrowRightIcon className="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>

          {/* Co-hosted Properties Subsection */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <HomeIcon className="h-5 w-5 mr-2 text-green-600" />
                Propriétés co-hébergées ({properties.length})
              </h3>
              <button
                onClick={() => navigate('/cohosting-explore')}
                className="text-green-600 hover:text-green-700 font-medium text-sm flex items-center"
              >
                Explorer plus de propriétés
                <ArrowRightIcon className="h-4 w-4 ml-1" />
              </button>
            </div>
            
            {properties.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {properties.map((property) => (
                  <PropertyCard key={property._id} property={property} isCohosted={true} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <HomeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Aucune propriété co-hébergée</p>
                <button
                  onClick={() => navigate('/cohosting-explore')}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Explorer les propriétés disponibles
                </button>
              </div>
            )}
          </div>

          {/* Packages Subsection */}
          <div className="mb-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <ArchiveBoxIcon className="h-5 w-5 mr-2 text-green-600" />
              Packages d'expériences ({packages.length})
            </h3>
            
            {isLoadingPackages ? (
              <LoadingSpinner />
            ) : packages.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {packages.map((pkg) => (
                  <PackageCard key={pkg._id} package={pkg} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <ArchiveBoxIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Aucun package créé</p>
                <button
                  onClick={() => navigate('/create-package')}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Créer votre premier package
                </button>
              </div>
            )}
          </div>

          {/* Package Bookings Subsection */}
          <div className="mb-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <CalendarDaysIcon className="h-5 w-5 mr-2 text-green-600" />
              Réservations de packages ({packageBookings.length})
            </h3>
            
            {isLoadingBookings ? (
              <LoadingSpinner />
            ) : packageBookings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {packageBookings.map((booking) => (
                  <PackageBookingCard 
                    key={booking._id} 
                    booking={booking} 
                    onStatusUpdate={handleBookingStatusUpdate}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <CalendarDaysIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Aucune réservation de package</p>
                <p className="text-sm text-gray-500">Les réservations de vos packages apparaîtront ici</p>
              </div>
            )}
          </div>

          {/* Empty State - Only show if all services are empty */}
          {properties.length === 0 && packages.length === 0 && packageBookings.length === 0 && 
           !isLoadingProperties && !isLoadingPackages && !isLoadingBookings && (
            <EmptyState
              type="services"
              icon={UserGroupIcon}
              title="Aucun service disponible"
              description="Vous n'avez pas encore de propriétés co-hébergées, packages ou réservations. Commencez par postuler pour co-héberger une propriété ou créer votre premier package d'expériences."
              onAction={() => navigate('/cohosting-explore')}
              actionText="Explorer les propriétés à co-héberger"
            />
          )}
        </div>
      </div>
    </div>
  );
}
