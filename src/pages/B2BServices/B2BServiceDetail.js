import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { 
  BuildingOfficeIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

const serviceLabels = {
  restaurant: 'Restaurant',
  catering: 'Traiteur',
  transportation: 'Transport',
  tours: 'Tours',
  activities: 'Activités',
  cleaning: 'Nettoyage',
  maintenance: 'Maintenance',
  'event-planning': 'Planification d\'événements',
  photography: 'Photographie',
  other: 'Autre'
};

const serviceIcons = {
  restaurant: '🍽️',
  catering: '🥘',
  transportation: '🚗',
  tours: '🗺️',
  activities: '🎯',
  cleaning: '🧹',
  maintenance: '🔧',
  'event-planning': '🎉',
  photography: '📸',
  other: '🏢'
};

export default function B2BServiceDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { user } = useAuth();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Determine where to go back based on where user came from
  const getBackPath = () => {
    // If user came from restauration/services page, go back there
    if (location.state?.from === 'services' || location.state?.from === 'restauration') {
      return '/restauration';
    }
    // Default to b2b-services page
    return '/b2b-services';
  };

  useEffect(() => {
    const fetchService = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/b2b/${id}`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Service non trouvé');
          }
          throw new Error(`Erreur serveur ${response.status}`);
        }

        const data = await response.json();
        setService(data.service);
      } catch (err) {
        console.error('Erreur lors du chargement du service:', err);
        setError(err.message || 'Erreur lors du chargement du service');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchService();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du service...</p>
        </div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <BuildingOfficeIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            {error || 'Service non trouvé'}
          </h3>
          <button
            onClick={() => navigate(getBackPath())}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Retour aux services
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white pb-28">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => navigate(getBackPath())}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors mb-4"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span className="font-medium">Retour aux services</span>
          </button>
          <h1 className="text-2xl font-bold text-green-800">Détails du service</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Service Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
          {/* Service Image or Icon */}
          <div className="h-64 bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center relative">
            {service.profilePic ? (
              <img
                src={service.profilePic}
                alt={service.businessName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-8xl">{serviceIcons[service.serviceProvided] || '🏢'}</div>
            )}
            <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full">
              <span className="text-lg font-semibold text-green-700">
                {serviceLabels[service.serviceType || service.serviceProvided] || service.serviceType || service.serviceProvided}
              </span>
            </div>
          </div>

          {/* Service Info */}
          <div className="p-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">{service.title || service.businessName}</h2>
                {service.price > 0 && (
                  <p className="text-xl font-semibold text-green-700">
                    {service.price} MAD {service.priceUnit === 'per_hour' ? '/heure' : service.priceUnit === 'per_day' ? '/jour' : service.priceUnit === 'per_person' ? '/personne' : ''}
                  </p>
                )}
              </div>
            </div>
            
            {/* Location */}
            <div className="flex items-center gap-3 mb-6">
              <MapPinIcon className="w-6 h-6 text-green-600" />
              <span className="text-lg text-gray-700">{service.location}</span>
            </div>

            {/* Description */}
            {service.description && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {service.description}
                </p>
              </div>
            )}

            {/* Features */}
            {service.features && service.features.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Caractéristiques</h3>
                <div className="flex flex-wrap gap-2">
                  {service.features.map((feature, index) => (
                    <div
                      key={index}
                      className="px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm"
                    >
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contact Information */}
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations de contact</h3>
              <div className="space-y-3">
                {service.fullName && (
                  <div className="flex items-center gap-3">
                    <BuildingOfficeIcon className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-700">{service.fullName}</span>
                  </div>
                )}
                {service.phoneNumber && (
                  <a
                    href={`tel:${service.phoneNumber}`}
                    className="flex items-center gap-3 text-green-600 hover:text-green-700 transition-colors"
                  >
                    <PhoneIcon className="w-5 h-5" />
                    <span>{service.phoneNumber}</span>
                  </a>
                )}
                {service.email && (
                  <a
                    href={`mailto:${service.email}`}
                    className="flex items-center gap-3 text-green-600 hover:text-green-700 transition-colors"
                  >
                    <EnvelopeIcon className="w-5 h-5" />
                    <span>{service.email}</span>
                  </a>
                )}
                {service.country && (
                  <div className="flex items-center gap-3">
                    <MapPinIcon className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-700">{service.country}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Info message for B2B users */}
            {user?.role === 'b2b' && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> En tant qu'utilisateur B2B, vous pouvez consulter les informations du service et contacter le prestataire, mais la réservation est réservée aux touristes.
                </p>
              </div>
            )}

            {/* Contact Buttons */}
            <div className="flex gap-4">
              {service.phoneNumber && (
                <a
                  href={`tel:${service.phoneNumber}`}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors font-semibold"
                >
                  <PhoneIcon className="w-5 h-5" />
                  <span>Appeler</span>
                </a>
              )}
              {service.email && (
                <a
                  href={`mailto:${service.email}`}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors font-semibold"
                >
                  <EnvelopeIcon className="w-5 h-5" />
                  <span>Envoyer un email</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


