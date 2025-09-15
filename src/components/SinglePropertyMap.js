import React from 'react';

const SinglePropertyMap = ({ location, className = "" }) => {
  // Get coordinates based on location
  const getCityCoordinates = (locationStr) => {
    const city = locationStr?.split(',')[0]?.toLowerCase().trim().replace(/[^a-z]/g, '') || '';
    
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
      'jhvdzv': [33.5731, -7.5898] // Assuming this is Casablanca area
    };

    return cityMap[city] || [33.9716, -6.8498]; // Default to Rabat
  };

  const coordinates = getCityCoordinates(location);
  const [lat, lng] = coordinates;

  // Create OpenStreetMap embed URL
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng-0.01},${lat-0.01},${lng+0.01},${lat+0.01}&layer=mapnik&marker=${lat},${lng}`;
  
  // Google Maps URL for external link
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  return (
    <div className={`${className}`}>
      {/* Real Map Embed */}
      <div className="w-full h-80 rounded-2xl overflow-hidden shadow-lg border">
        <iframe
          src={mapUrl}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen=""
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title={`Map showing ${location}`}
        />
      </div>

      {/* Location Information */}
      <div className="mt-4 bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Informations sur la localisation</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <span>🏙️</span>
            <span>Ville: {location?.split(',')[0] || 'Non spécifiée'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>📍</span>
            <span>Coordonnées: {lat.toFixed(4)}, {lng.toFixed(4)}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>🌍</span>
            <span>Pays: Maroc</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>🗺️</span>
            <span>
              <a 
                href={googleMapsUrl}
                target="_blank" 
                rel="noopener noreferrer"
                className="text-green-600 hover:text-green-700 font-medium hover:underline"
              >
                Ouvrir dans Google Maps →
              </a>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SinglePropertyMap;
