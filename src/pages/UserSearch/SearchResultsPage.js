import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ListingCardGrid from "../../components/ListingCard/ListingCardGrid";

export default function SearchResultsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [properties, setProperties] = useState([]);
  const [filters, setFilters] = useState({
    minPrice: "",
    maxPrice: "",
    bedrooms: "",
    bathrooms: "", 
    equipments: [],
  });
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [availableFilters, setAvailableFilters] = useState({ equipments: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Get search parameters from location state or URL params
  const searchParams = useMemo(() => location.state?.searchParams || {}, [location.state?.searchParams]);

  const fetchProperties = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();

      // Destination
      if (searchParams.destination) params.append("destination", searchParams.destination);

      // Dates
      if (searchParams.dateSelection) {
        if (searchParams.dateSelection.isRange) {
          params.append("checkIn", searchParams.dateSelection.dates[0]);
          params.append("checkOut", searchParams.dateSelection.dates[1]);
        } else {
          params.append("checkIn", searchParams.dateSelection.date);
        }
      }

      // Filters
      if (filters.minPrice) params.append("minPrice", filters.minPrice);
      if (filters.maxPrice) params.append("maxPrice", filters.maxPrice);
      if (filters.bedrooms) params.append("bedrooms", filters.bedrooms);
      if (filters.bathrooms) params.append("bathrooms", filters.bathrooms);
      if (filters.equipments.length > 0) {
        filters.equipments.forEach(eq => params.append("equipments[]", eq));
      }

      // Pagination
      params.append("page", pagination.page);

      // Fetch data
      const response = await fetch(`http://localhost:4000/api/search/advanced?${params.toString()}`);
      if (!response.ok) throw new Error(`Erreur serveur ${response.status}`);

      const data = await response.json();

      let properties = data.properties || [];
      
      // Apply client-side filtering for all filter types
      properties = properties.filter(property => {
        // Price filtering
        if (filters.minPrice || filters.maxPrice) {
          const propertyPrice = property.price || property.pricePerNight || 0;
          const minPrice = parseFloat(filters.minPrice) || 0;
          const maxPrice = parseFloat(filters.maxPrice) || Infinity;
          
          if (propertyPrice < minPrice || propertyPrice > maxPrice) {
            return false;
          }
        }
        
        // Bedrooms filtering
        if (filters.bedrooms) {
          const propertyBedrooms = property.bedrooms || property.info?.bedrooms || 0;
          const requiredBedrooms = parseInt(filters.bedrooms);
          
          if (propertyBedrooms < requiredBedrooms) {
            return false;
          }
        }
        
        // Bathrooms filtering
        if (filters.bathrooms) {
          const propertyBathrooms = property.bathrooms || property.info?.bathrooms || 0;
          const requiredBathrooms = parseInt(filters.bathrooms);
          
          if (propertyBathrooms < requiredBathrooms) {
            return false;
          }
        }
        
        // Equipment filtering
        if (filters.equipments.length > 0) {
          const propertyEquipments = property.equipments || property.info?.equipments || [];
          
          // Create a mapping for better matching
          const equipmentMapping = {
            'cuisine': ['cuisine', 'kitchen', 'cooking', 'cuisinière'],
            'wifi': ['wifi', 'internet', 'connexion'],
            'télévision': ['télévision', 'tv', 'television', 'téléviseur'],
            'lave-linge': ['lave-linge', 'lave linge', 'washing machine', 'machine à laver'],
            'climatisation': ['climatisation', 'air conditioning', 'ac', 'climatiseur'],
            'chauffage': ['chauffage', 'heating', 'radiateur'],
            'parking': ['parking', 'garage', 'stationnement'],
            'piscine': ['piscine', 'pool', 'swimming pool'],
            'aire de jeux': ['aire de jeux', 'playground', 'terrain de jeu', 'espace jeux']
          };
          
          // Check if property has ALL selected equipment filters
          const hasAllEquipments = filters.equipments.every(selectedEq => {
            const searchTerms = equipmentMapping[selectedEq.toLowerCase()] || [selectedEq.toLowerCase()];
            return propertyEquipments.some(propEq => {
              const propEqLower = propEq.toLowerCase();
              return searchTerms.some(term => 
                propEqLower.includes(term) || term.includes(propEqLower)
              );
            });
          });
          
          if (!hasAllEquipments) {
            return false;
          }
        }
        
        return true;
      });
      
      // Debug: Log filtered results
      console.log('Applied filters:', filters);
      console.log('Filtered properties count:', properties.length);
      console.log('First few filtered properties:', properties.slice(0, 3));
      
      setProperties(properties);
      setPagination(data.pagination || { page: 1, pages: 1 });
      
      // Use API equipment data if available, otherwise use a predefined list
      const equipmentData = data.filters?.equipments && data.filters.equipments.length > 0 
        ? data.filters.equipments 
        : ["Wifi", "Télévision", "Lave-linge", "Climatisation", "Chauffage", "Cuisine", "Parking", "Piscine", "Aire de jeux"];
      
      setAvailableFilters({ equipments: equipmentData });

    } catch (err) {
      console.error("Erreur lors du chargement des résultats :", err);
      setError("Erreur lors du chargement des résultats");
      // Set fallback equipment data even on error
      setAvailableFilters({ 
        equipments: ["Wifi", "Télévision", "Lave-linge", "Climatisation", "Chauffage", "Cuisine", "Parking", "Piscine", "Aire de jeux"] 
      });
    } finally {
      setLoading(false);
    }
  }, [searchParams, filters, pagination.page]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleEquipmentToggle = (equipment) => {
    setFilters(prev => ({
      ...prev,
      equipments: prev.equipments.includes(equipment)
        ? prev.equipments.filter(e => e !== equipment)
        : [...prev.equipments, equipment],
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handlePropertySelect = (property) => {
    navigate(`/property/${property._id}`);
  };


  return (
    <div className="relative min-h-screen">
      <div className="transition duration-300 ease-in-out opacity-100">
        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between px-6 py-4 bg-white shadow-sm sticky top-0 z-10">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="text-sm font-medium">Retour à l'accueil</span>
            </button>
            <h1 className="text-2xl font-bold text-green-800">ATLASIA</h1>
          </div>
          <div className="flex-1 max-w-3xl mx-10">
            <div className="flex items-center justify-center">
              <h2 className="text-xl font-semibold text-gray-700">Résultats de recherche</h2>
            </div>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => navigate('/search')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Nouvelle recherche
            </button>
          </div>
        </div>

        {/* Mobile Header */}
        <div className="md:hidden bg-white shadow-sm sticky top-0 z-10">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => navigate('/')}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <h1 className="text-xl font-bold text-green-800 text-center flex-1">ATLASIA</h1>
              <button
                onClick={() => navigate('/search')}
                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                Nouvelle recherche
              </button>
            </div>
            
            <div className="text-center mb-4">
              <h2 className="text-lg font-semibold text-gray-700">Résultats de recherche</h2>
            </div>
            
            {/* Mobile Filter Button - Below Title */}
            <div className="flex justify-center">
              <button
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" />
                </svg>
                <span className="text-sm font-medium">Filtres</span>
              </button>
            </div>
          </div>
        </div>

        {/* Search info */}
        <div className="px-4 py-4">
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex items-center space-x-4">
              <div>
                <span className="text-sm text-gray-500">Destination:</span>
                <span className="ml-2 font-medium">{searchParams.destination || "Toutes les destinations"}</span>
              </div>
              {searchParams.dateSelection?.dates && (
                <div>
                  <span className="text-sm text-gray-500">Dates:</span>
                  <span className="ml-2 font-medium">{searchParams.dateSelection.dates.join(' → ')}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Sidebar filters - Hidden on mobile */}
        <div className="hidden md:block px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex gap-6">
              <div className="w-72 bg-white rounded-lg shadow-md border border-gray-200 p-6 h-fit">
                <h3 className="text-lg font-semibold mb-4">Filtres</h3>
                
                {/* Price filter */}
                <div className="mb-6">
                  <h4 className="font-medium mb-3">Prix par nuit</h4>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.minPrice}
                      onChange={e => handleFilterChange("minPrice", e.target.value)}
                      className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.maxPrice}
                      onChange={e => handleFilterChange("maxPrice", e.target.value)}
                      className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Bedrooms & Bathrooms */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <h4 className="font-medium mb-3">Chambres</h4>
                    <input
                      type="number"
                      min="0"
                      placeholder="0+"
                      value={filters.bedrooms}
                      onChange={e => handleFilterChange("bedrooms", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <h4 className="font-medium mb-3">Salles de bain</h4>
                    <input
                      type="number"
                      min="0"
                      placeholder="0+"
                      value={filters.bathrooms}
                      onChange={e => handleFilterChange("bathrooms", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Equipments */}
                <div className="mb-6">
                  <h4 className="font-medium mb-3">Équipements</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {availableFilters.equipments.map(eq => (
                      <label key={eq} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={filters.equipments.includes(eq)}
                          onChange={() => handleEquipmentToggle(eq)}
                          className="rounded text-green-600 focus:ring-green-500"
                        />
                        <span className="text-sm">{eq}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Results */}
              <div className="flex-1">
                {/* Loading state */}
                {loading && (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                    <span className="ml-3 text-gray-600">Chargement des résultats...</span>
                  </div>
                )}

                {/* Error state */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <p className="text-red-600">{error}</p>
                  </div>
                )}

                {/* Results */}
                {!loading && !error && (
                  <div>
                    {properties.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="text-6xl mb-4">🏠</div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">
                          Aucune propriété trouvée
                        </h3>
                        <p className="text-gray-500 text-sm mb-4">
                          Essayez de modifier vos critères de recherche
                        </p>
                        <button
                          onClick={() => navigate('/search')}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Nouvelle recherche
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div className="mb-4">
                          <p className="text-gray-600">
                            {properties.length} propriété{properties.length > 1 ? 's' : ''} trouvée{properties.length > 1 ? 's' : ''}
                          </p>
                        </div>
                        
                        <ListingCardGrid listings={properties} onCardClick={handlePropertySelect} />

                        {/* Pagination */}
                        {pagination.pages > 1 && (
                          <div className="flex justify-center mt-8 space-x-2">
                            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                              <button
                                key={p}
                                onClick={() => handlePageChange(p)}
                                className={`px-4 py-2 rounded-lg ${
                                  p === pagination.page
                                    ? "bg-green-600 text-white"
                                    : "bg-white border text-gray-700 hover:bg-gray-100"
                                }`}
                              >
                                {p}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Results */}
        <div className="md:hidden px-4 py-8 pb-28">
          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              <span className="ml-3 text-gray-600">Chargement des résultats...</span>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Results */}
          {!loading && !error && (
            <div>
              {properties.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🏠</div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    Aucune propriété trouvée
                  </h3>
                  <p className="text-gray-500 text-sm mb-4">
                    Essayez de modifier vos critères de recherche
                  </p>
                  <button
                    onClick={() => navigate('/search')}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Nouvelle recherche
                  </button>
                </div>
              ) : (
                <div>
                  <div className="mb-4">
                    <p className="text-gray-600">
                      {properties.length} propriété{properties.length > 1 ? 's' : ''} trouvée{properties.length > 1 ? 's' : ''}
                    </p>
                  </div>
                  
                  <ListingCardGrid listings={properties} onCardClick={handlePropertySelect} />

                  {/* Pagination */}
                  {pagination.pages > 1 && (
                    <div className="flex justify-center mt-8 space-x-2">
                      {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                        <button
                          key={p}
                          onClick={() => handlePageChange(p)}
                          className={`px-4 py-2 rounded-lg ${
                            p === pagination.page
                              ? "bg-green-600 text-white"
                              : "bg-white border text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter Overlay */}
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden transition-all duration-300 ${
          showMobileFilters ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        onClick={() => setShowMobileFilters(false)}
      >
        <div 
          className={`fixed inset-y-0 left-0 w-80 bg-white shadow-xl overflow-y-auto transform transition-transform duration-300 ease-in-out ${
            showMobileFilters ? 'translate-x-0' : '-translate-x-full'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Filtres</h3>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Price filter */}
            <div className="mb-6">
              <h4 className="font-medium mb-3">Prix par nuit</h4>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minPrice}
                  onChange={e => handleFilterChange("minPrice", e.target.value)}
                  className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxPrice}
                  onChange={e => handleFilterChange("maxPrice", e.target.value)}
                  className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Bedrooms & Bathrooms */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <h4 className="font-medium mb-3">Chambres</h4>
                <input
                  type="number"
                  min="0"
                  placeholder="0+"
                  value={filters.bedrooms}
                  onChange={e => handleFilterChange("bedrooms", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <h4 className="font-medium mb-3">Salles de bain</h4>
                <input
                  type="number"
                  min="0"
                  placeholder="0+"
                  value={filters.bathrooms}
                  onChange={e => handleFilterChange("bathrooms", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Equipments */}
            <div className="mb-6">
              <h4 className="font-medium mb-3">Équipements</h4>
              <div className="grid grid-cols-2 gap-2">
                {availableFilters.equipments.map(eq => (
                  <label key={eq} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={filters.equipments.includes(eq)}
                      onChange={() => handleEquipmentToggle(eq)}
                      className="rounded text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm">{eq}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Apply Filters Button */}
            <button
              onClick={() => setShowMobileFilters(false)}
              className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Appliquer les filtres
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
