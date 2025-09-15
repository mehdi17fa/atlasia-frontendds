import React, { useState, useEffect } from 'react';

const DestinationSearchScreens = ({ onBack, onDestinationSelected }) => {
  const [currentScreen, setCurrentScreen] = useState('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  const destinations = [
    { id: 1, name: 'Ifrane, Downtown', type: 'city' },
    { id: 2, name: 'Ifrane, Zéphire', type: 'area' },
    { id: 3, name: 'Ifrane, Farah Inn', type: 'hotel' },
    { id: 4, name: 'Ifrane', type: 'city' }
  ];

  // Fetch suggestions from API
  const fetchSuggestions = async (query) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/search/suggestions?query=${encodeURIComponent(query)}`);
      const data = await response.json();
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      // Fallback to local filtering
      const filtered = destinations.filter(dest =>
        dest.name.toLowerCase().includes(query.toLowerCase())
      );
      setSuggestions(filtered.map(d => ({ name: d.name, type: d.type })));
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        fetchSuggestions(searchQuery.trim());
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    setCurrentScreen(value.trim() ? 'results' : 'search');
  };

  const handleDestinationSelect = (destinationName) => {
    setSearchQuery(destinationName);
    onDestinationSelected(destinationName);
  };

  const getIconForType = (type) => {
    switch (type) {
      case 'city':
        return (
          <svg className="w-4 h-4 text-green-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      case 'address':
        return (
          <svg className="w-4 h-4 text-green-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4 text-green-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-xl w-full max-w-md h-full overflow-auto shadow-lg">
        {/* Header */}
        <div className="flex items-center p-4 border-b">
          <button className="mr-4" onClick={onBack}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex ml-8 space-x-14">
            <span className="text-green-800 font-medium border-b-2 border-green-800 pb-2">Destination</span>
            <span className="text-gray-400">Date</span>
            <span className="text-gray-400">Invités</span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-4">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Rechercher votre destination"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-700"
            />
            {loading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-800"></div>
              </div>
            )}
          </div>
        </div>

        {/* Content: Results or Illustration */}
        {currentScreen === 'search' ? (
          <div className="flex-1 flex items-center justify-center py-8">
            <div className="text-center">
              <div className="w-32 h-32 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-16 h-16 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm">Recherchez votre destination</p>
            </div>
          </div>
        ) : (
          <div className="px-4 pb-8">
            {suggestions.length === 0 && !loading ? (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.034 0-3.9.785-5.291 2.09M12 21a9 9 0 110-18 9 9 0 010 18z" />
                </svg>
                <p className="text-gray-500">Aucune destination trouvée</p>
                <p className="text-gray-400 text-sm mt-1">Essayez un autre terme de recherche</p>
              </div>
            ) : (
              suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="flex items-center py-3 cursor-pointer hover:bg-gray-50 rounded-lg px-2"
                  onClick={() => handleDestinationSelect(suggestion.name)}
                >
                  <div className="mr-4">
                    <div className="w-6 h-6 bg-green-50 rounded-full flex items-center justify-center">
                      {getIconForType(suggestion.type)}
                    </div>
                  </div>
                  <div className="flex-1">
                    <span className="text-gray-800">{suggestion.name}</span>
                    {suggestion.type && (
                      <div className="text-xs text-gray-500 mt-1 capitalize">
                        {suggestion.type === 'city' ? 'Ville' : 
                         suggestion.type === 'address' ? 'Adresse' : 'Lieu'}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DestinationSearchScreens;