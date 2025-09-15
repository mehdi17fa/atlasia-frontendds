import React, { useEffect, useState, useCallback } from "react";
import S3Image from "../../components/S3Image";
import ImageCarousel from "../../components/ImageCarousel";

export default function SearchResults({ isOpen, onClose, searchParams, onPropertySelect }) {
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

  const fetchProperties = useCallback(async () => {
    if (!isOpen || !searchParams) return;

    try {
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

      setProperties(data.properties || []);
      setPagination(data.pagination || { page: 1, pages: 1 });
      setAvailableFilters({ equipments: data.filters?.equipments || [] });

    } catch (err) {
      console.error("Erreur lors du chargement des résultats :", err);
    }
  }, [isOpen, searchParams, filters, pagination.page]);

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white w-[90vw] h-[90vh] rounded-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">Résultats de recherche</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar filters */}
          <div className="w-72 border-r p-4 overflow-y-auto">
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
          <div className="flex-1 overflow-y-auto p-6">
            {properties.length === 0 ? (
              <p className="text-center text-gray-600">Aucune propriété trouvée.</p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {properties.map(property => (
                  <div
                    key={property._id}
                    onClick={() => onPropertySelect(property)}
                    className="bg-white rounded-xl shadow hover:shadow-lg transition cursor-pointer overflow-hidden"
                  >
                    {property.photos && property.photos.length > 0 ? (
                      <ImageCarousel
                        images={property.photos}
                        className="h-48"
                        showDots={property.photos.length > 1}
                        showArrows={property.photos.length > 1}
                      />
                    ) : (
                      <S3Image
                        src="/placeholder.jpg"
                        alt={property.title}
                        className="h-48 w-full object-cover"
                        fallbackSrc="/placeholder.jpg"
                      />
                    )}
                    <div className="p-4">
                      <h3 className="text-lg font-semibold truncate">{property.title}</h3>
                      <p className="text-sm text-gray-500">
                        {property.localisation?.city}, {property.localisation?.address}
                      </p>
                      <p className="mt-2 font-medium text-green-600">
                        {property.price?.weekdays} MAD
                        <span className="text-sm text-gray-500"> / nuit</span>
                      </p>
                      <p className="text-sm text-gray-600">
                        {property.info?.guests} voyageurs • {property.info?.bedrooms} chambres • {property.info?.bathrooms} SDB
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

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
        </div>
      </div>
    </div>
  );
}
