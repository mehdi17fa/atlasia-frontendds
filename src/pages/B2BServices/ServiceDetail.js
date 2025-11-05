import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeftIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  CheckIcon
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

const priceUnitLabels = {
  per_hour: 'Par heure',
  per_day: 'Par jour',
  per_person: 'Par personne',
  per_event: 'Par événement',
  fixed: 'Prix fixe',
  other: 'Autre'
};

export default function ServiceDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    const fetchService = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/services/${id}`, {
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
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            {error || 'Service non trouvé'}
          </h3>
          <button
            onClick={() => navigate('/services')}
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
            onClick={() => navigate('/services')}
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
          {/* Image Gallery */}
          {service.images && service.images.length > 0 ? (
            <div className="relative h-96 bg-gray-100">
              <img
                src={service.images[selectedImageIndex]}
                alt={service.title}
                className="w-full h-full object-cover"
              />
              {service.images.length > 1 && (
                <>
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                    {service.images.map((img, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`w-3 h-3 rounded-full ${
                          index === selectedImageIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                  {selectedImageIndex > 0 && (
                    <button
                      onClick={() => setSelectedImageIndex(selectedImageIndex - 1)}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2"
                    >
                      <ArrowLeftIcon className="w-5 h-5" />
                    </button>
                  )}
                  {selectedImageIndex < service.images.length - 1 && (
                    <button
                      onClick={() => setSelectedImageIndex(selectedImageIndex + 1)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2"
                    >
                      <ArrowLeftIcon className="w-5 h-5 rotate-180" />
                    </button>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="h-64 bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
              <div className="text-8xl">📦</div>
            </div>
          )}

          {/* Service Info */}
          <div className="p-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                    {serviceLabels[service.serviceType] || service.serviceType}
                  </span>
                  {service.status === 'published' && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                      Publié
                    </span>
                  )}
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">{service.title}</h2>
                {service.price > 0 && (
                  <p className="text-2xl font-bold text-green-700">
                    {service.price} MAD {priceUnitLabels[service.priceUnit] || ''}
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
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {service.description}
              </p>
            </div>

            {/* Features */}
            {service.features && service.features.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Caractéristiques</h3>
                <div className="flex flex-wrap gap-2">
                  {service.features.map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg"
                    >
                      <CheckIcon className="w-4 h-4" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Business Info */}
            {service.business && (
              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">À propos de l'entreprise</h3>
                <div className="space-y-2">
                  <p className="text-gray-700 font-medium">
                    {service.business.businessName || service.business.fullName}
                  </p>
                  {service.business.location && (
                    <p className="text-gray-600 text-sm">
                      📍 {service.business.location}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Contact Information */}
            <div className="bg-green-50 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contactez-nous</h3>
              <div className="space-y-3">
                {service.contactPhone && (
                  <div className="flex items-center gap-3">
                    <PhoneIcon className="w-5 h-5 text-green-600" />
                    <a
                      href={`tel:${service.contactPhone}`}
                      className="text-green-700 hover:text-green-800 transition-colors font-medium"
                    >
                      {service.contactPhone}
                    </a>
                  </div>
                )}
                {service.contactEmail && (
                  <div className="flex items-center gap-3">
                    <EnvelopeIcon className="w-5 h-5 text-green-600" />
                    <a
                      href={`mailto:${service.contactEmail}`}
                      className="text-green-700 hover:text-green-800 transition-colors font-medium"
                    >
                      {service.contactEmail}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Buttons */}
            <div className="flex gap-4">
              {service.contactPhone && (
                <a
                  href={`tel:${service.contactPhone}`}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors font-semibold"
                >
                  <PhoneIcon className="w-5 h-5" />
                  <span>Appeler</span>
                </a>
              )}
              {service.contactEmail && (
                <a
                  href={`mailto:${service.contactEmail}`}
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


