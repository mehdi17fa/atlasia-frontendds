import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MagnifyingGlassIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  FunnelIcon,
  XMarkIcon
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

export default function ServicesBrowser() {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [filters, setFilters] = useState({
    serviceType: 'all',
    location: '',
    minPrice: '',
    maxPrice: ''
  });
  
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [showFilters, setShowFilters] = useState(false);

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters.serviceType !== 'all') params.append('serviceType', filters.serviceType);
      if (filters.location) params.append('location', filters.location);
      if (filters.minPrice) params.append('minPrice', filters.minPrice);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
      params.append('page', pagination.page);
      params.append('limit', '12');

      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/services/published?${params.toString()}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) throw new Error(`Erreur serveur ${response.status}`);

      const data = await response.json();
      setServices(data.services || []);
      setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      console.error('Erreur lors du chargement des services:', err);
      setError('Erreur lors du chargement des services');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const clearFilters = () => {
    setFilters({
      serviceType: 'all',
      location: '',
      minPrice: '',
      maxPrice: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleServiceClick = (serviceId) => {
    navigate(`/service/${serviceId}`, { state: { from: 'restauration' } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white pb-28">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium">Retour</span>
            </button>
            <h1 className="text-2xl font-bold text-green-800">Services Disponibles</h1>
            <div className="w-20"></div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par localisation..."
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-600 focus:ring-2 focus:ring-green-200 outline-none transition-all"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-2"
            >
              <FunnelIcon className="w-5 h-5" />
              <span className="hidden md:inline">Filtres</span>
            </button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type de service</label>
                  <select
                    value={filters.serviceType}
                    onChange={(e) => handleFilterChange('serviceType', e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-green-600 focus:ring-2 focus:ring-green-200 outline-none transition-all bg-white"
                  >
                    <option value="all">Tous les services</option>
                    {Object.entries(serviceLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prix minimum (MAD)</label>
                  <input
                    type="number"
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-green-600 focus:ring-2 focus:ring-green-200 outline-none transition-all"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prix maximum (MAD)</label>
                  <input
                    type="number"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-green-600 focus:ring-2 focus:ring-green-200 outline-none transition-all"
                    min="0"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors flex items-center gap-2"
                >
                  <XMarkIcon className="w-5 h-5" />
                  <span>Effacer les filtres</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Results Count */}
        {!loading && !error && (
          <div className="mb-4">
            <p className="text-gray-600">
              {pagination.total} service{pagination.total > 1 ? 's' : ''} trouvé{pagination.total > 1 ? 's' : ''}
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <span className="ml-3 text-gray-600">Chargement des services...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Services Grid */}
        {!loading && !error && (
          <div>
            {services.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Aucun service trouvé
                </h3>
                <p className="text-gray-500 text-sm mb-4">
                  Essayez de modifier vos critères de recherche
                </p>
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Effacer les filtres
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {services.map((service) => (
                    <div
                      key={service._id}
                      onClick={() => handleServiceClick(service._id)}
                      className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all cursor-pointer overflow-hidden group"
                    >
                      {/* Service Image */}
                      <div className="h-48 bg-gradient-to-br from-green-100 to-green-200 relative overflow-hidden">
                        {service.images && service.images.length > 0 ? (
                          <img
                            src={service.images[0]}
                            alt={service.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-6xl">
                            📦
                          </div>
                        )}
                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
                          <span className="text-sm font-semibold text-green-700">
                            {serviceLabels[service.serviceType] || service.serviceType}
                          </span>
                        </div>
                      </div>

                      {/* Service Info */}
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-green-700 transition-colors line-clamp-1">
                          {service.title}
                        </h3>
                        
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                          {service.description}
                        </p>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-gray-600 text-sm">
                            <MapPinIcon className="w-4 h-4" />
                            <span>{service.location}</span>
                          </div>
                          {service.price > 0 && (
                            <div className="text-green-700 font-semibold">
                              {service.price} MAD {priceUnitLabels[service.priceUnit] || ''}
                            </div>
                          )}
                          {service.business && (
                            <div className="text-sm text-gray-500">
                              Par {service.business.businessName || service.business.fullName}
                            </div>
                          )}
                          
                          {/* Restaurant Menu Preview */}
                          {service.serviceType === 'restaurant' && service.restaurantDetails?.menu?.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <div className="text-xs font-semibold text-gray-700 mb-2">Menu ({service.restaurantDetails.menu.length} plat{service.restaurantDetails.menu.length > 1 ? 's' : ''})</div>
                              <div className="max-h-32 overflow-y-auto space-y-1">
                                {service.restaurantDetails.menu.slice(0, 3).map((item, idx) => (
                                  <div key={idx} className="text-xs text-gray-600 flex justify-between">
                                    <span className="truncate flex-1">{item.name}</span>
                                    <span className="text-green-700 font-semibold ml-2">{item.price} MAD</span>
                                  </div>
                                ))}
                                {service.restaurantDetails.menu.length > 3 && (
                                  <div className="text-xs text-gray-500 italic">
                                    +{service.restaurantDetails.menu.length - 3} autre{service.restaurantDetails.menu.length - 3 > 1 ? 's' : ''}...
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {/* Restaurant Tables Info */}
                          {service.serviceType === 'restaurant' && service.restaurantDetails?.tables?.length > 0 && (
                            <div className="mt-2 text-xs text-gray-600">
                              🪑 {service.restaurantDetails.tables.length} table{service.restaurantDetails.tables.length > 1 ? 's' : ''} disponible{service.restaurantDetails.tables.length > 1 ? 's' : ''}
                              {service.restaurantDetails.tables[0]?.capacity && (
                                <span className="ml-1">(max {service.restaurantDetails.tables[0].capacity} pers./table)</span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Contact Info */}
                        {(service.contactPhone || service.contactEmail) && (
                          <div className="flex gap-2 pt-4 border-t border-gray-100">
                            {service.contactPhone && (
                              <a
                                href={`tel:${service.contactPhone}`}
                                onClick={(e) => e.stopPropagation()}
                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors text-sm"
                              >
                                <PhoneIcon className="w-4 h-4" />
                                <span>Appeler</span>
                              </a>
                            )}
                            {service.contactEmail && (
                              <a
                                href={`mailto:${service.contactEmail}`}
                                onClick={(e) => e.stopPropagation()}
                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg transition-colors text-sm"
                              >
                                <EnvelopeIcon className="w-4 h-4" />
                                <span>Email</span>
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="flex justify-center gap-2">
                    {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          page === pagination.page
                            ? 'bg-green-600 text-white'
                            : 'bg-white border text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


