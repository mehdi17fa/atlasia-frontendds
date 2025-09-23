import React from 'react';

const InteractiveMap = ({ properties = [], onPropertyClick, selectedProperty, className = "" }) => {
  // Get city coordinates for Moroccan cities
  const getCityCoordinates = (city) => {
    const cityMap = {
      'casablanca': [33.5731, -7.5898],
      'rabat': [33.9716, -6.8498],
      'fes': [34.0181, -5.0078],
      'marrakech': [31.6295, -7.9811],
      'tangier': [35.7595, -5.8340],
      'agadir': [30.4278, -9.5981],
      'meknes': [33.8935, -5.5473],
      'oujda': [34.6814, -1.9086],
      'kenitra': [34.2610, -6.5802],
      'tetouan': [35.5889, -5.3626],
      'ifrane': [33.5228, -5.1106],
      'akhawayn': [33.5228, -5.1106],
      'downtown': [33.5731, -7.5898],
      'jhvdzv': [33.5731, -7.5898]
    };

    const normalizedCity = city?.toLowerCase().trim().replace(/[^a-z]/g, '') || '';
    return cityMap[normalizedCity] || [33.9716, -6.8498]; // Default to Rabat
  };

  // Create property markers with coordinates
  const propertyMarkers = properties.map(property => {
    const cityCoords = getCityCoordinates(property.location?.split(',')[0] || property.title);
    return {
      ...property,
      coordinates: cityCoords,
      lat: cityCoords[0],
      lng: cityCoords[1]
    };
  });

  const handleMarkerClick = (property) => {
    if (onPropertyClick) {
      onPropertyClick(property._id);
    }
  };

  // Create a property list view with map links since multiple embedded maps would be too heavy
  return (
    <div className={`relative ${className}`}>
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🗺️</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">Vue Carte</h3>
          <p className="text-gray-500 text-sm">
            {properties.length} propriété{properties.length !== 1 ? 's' : ''} disponible{properties.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Properties List with Map Links */}
        <div className="space-y-4">
          {propertyMarkers.map((property) => {
            const isSelected = selectedProperty?._id === property._id;
            const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${property.lat},${property.lng}`;
            
            return (
              <div 
                key={property._id}
                className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                  isSelected ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleMarkerClick(property)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                        isSelected ? 'bg-red-500' : 'bg-green-500'
                      }`}>
                        {(() => {
                          if (!property.price) return '?';
                          if (typeof property.price === 'number') return `${property.price}€`;
                          if (typeof property.price === 'object') {
                            const priceValue = property.price.weekdays || property.price.weekend || property.price.price || property.price.pricePerNight;
                            return priceValue ? `${priceValue}€` : '?';
                          }
                          return `${property.price}€`;
                        })()}
                      </div>
                      <h4 className="font-semibold text-gray-900">{property.title}</h4>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">
                      📍 {property.location || 'Localisation non spécifiée'}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>🛏️ {property.bedrooms || 0} chambres</span>
                      <span>👥 {property.guests || 0} invités</span>
                      <span className="font-semibold text-green-600">
                        {(() => {
                          if (!property.price) return '?€/nuit';
                          if (typeof property.price === 'number') return `${property.price}€/nuit`;
                          if (typeof property.price === 'object') {
                            const priceValue = property.price.weekdays || property.price.weekend || property.price.price || property.price.pricePerNight;
                            return priceValue ? `${priceValue}€/nuit` : '?€/nuit';
                          }
                          return `${property.price}€/nuit`;
                        })()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-2 ml-4">
                    <a
                      href={googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600 transition text-center"
                    >
                      🗺️ Voir sur la carte
                    </a>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPropertyClick(property._id);
                      }}
                      className="bg-green-500 text-white px-3 py-1 rounded text-xs hover:bg-green-600 transition"
                    >
                      Voir détails
                    </button>
                  </div>
                </div>
                
                {isSelected && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm text-gray-600 mb-2">
                      {property.description || 'Aucune description disponible'}
                    </p>
                    <div className="text-xs text-gray-500">
                      Coordonnées: {property.lat.toFixed(4)}, {property.lng.toFixed(4)}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected property details below */}
      {selectedProperty && (
        <div className="mt-4 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2">{selectedProperty.title}</h3>
              <p className="text-sm text-gray-600 mb-2">📍 {selectedProperty.location}</p>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>🛏️ {selectedProperty.bedrooms || 0} chambres</span>
                <span>👥 {selectedProperty.guests || 0} invités</span>
                <span className="font-semibold text-green-600">
                  {(() => {
                    if (!selectedProperty.price) return '?€/nuit';
                    if (typeof selectedProperty.price === 'number') return `${selectedProperty.price}€/nuit`;
                    if (typeof selectedProperty.price === 'object') {
                      const priceValue = selectedProperty.price.weekdays || selectedProperty.price.weekend || selectedProperty.price.price || selectedProperty.price.pricePerNight;
                      return priceValue ? `${priceValue}€/nuit` : '?€/nuit';
                    }
                    return `${selectedProperty.price}€/nuit`;
                  })()}
                </span>
              </div>
            </div>
            <button
              onClick={() => onPropertyClick && onPropertyClick(selectedProperty._id)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition"
            >
              Voir les détails
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractiveMap;
