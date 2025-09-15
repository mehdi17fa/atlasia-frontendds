import React, { useState, useEffect, useRef } from 'react';
import SearchResults from './SearchResults';

const SearchModal = ({ isOpen, onClose, onSearch }) => {
  const [destination, setDestination] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const destinationRef = useRef(null);
  const modalRef = useRef(null);

  // Focus on destination input when modal opens
  useEffect(() => {
    if (isOpen && destinationRef.current) {
      setTimeout(() => destinationRef.current.focus(), 100);
    }
  }, [isOpen]);

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Close modal when clicking outside
  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  // Fetch destination suggestions
  const fetchSuggestions = async (query) => {
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
  
    try {
      const baseUrl = "http://localhost:4000"
  
      const response = await fetch(
        `${baseUrl}/api/search/suggestions?query=${encodeURIComponent(query)}`
      );
  
      if (!response.ok) {
        throw new Error(`Erreur serveur ${response.status}`);
      }
  
      const text = await response.text(); // d’abord récupérer en texte
  
      let data;
      try {
        data = JSON.parse(text); // tenter de parser le JSON
      } catch (err) {
        console.error("La réponse n'est pas un JSON valide :", text);
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }
  
      setSuggestions(data.suggestions || []);
      setShowSuggestions(true);
  
    } catch (error) {
      console.error("Erreur lors de la récupération des suggestions :", error);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };
  
  const handleDestinationChange = (e) => {
    const value = e.target.value;
    setDestination(value);
    fetchSuggestions(value);
  };

  const handleSuggestionClick = (suggestion) => {
    setDestination(suggestion.name);
    setShowSuggestions(false);
  };

  const handleSearch = async () => {
    if (!destination.trim()) {
      destinationRef.current?.focus();
      return;
    }

    setLoading(true);

    const searchParams = {
      destination: destination.trim(),
      dateSelection: null
    };

    // Add dates if provided
    if (checkIn && checkOut) {
      searchParams.dateSelection = {
        isRange: true,
        dates: [checkIn, checkOut]
      };
    } else if (checkIn) {
      searchParams.dateSelection = {
        isRange: false,
        date: checkIn
      };
    }

    // Call the search handler passed from parent
    onSearch(searchParams);
    setLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !showSuggestions) {
      handleSearch();
    }
  };

  // Get today's date for min date validation
  const today = new Date().toISOString().split('T')[0];

  // Set default checkout date when checkin is selected
  const handleCheckInChange = (e) => {
    const selectedDate = e.target.value;
    setCheckIn(selectedDate);
    
    // Auto-set checkout to next day if not already set
    if (!checkOut && selectedDate) {
      const nextDay = new Date(selectedDate);
      nextDay.setDate(nextDay.getDate() + 1);
      setCheckOut(nextDay.toISOString().split('T')[0]);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-start justify-center pt-20 z-50"
      onClick={handleBackdropClick}
    >
      <div 
        ref={modalRef}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-semibold text-gray-900">Où souhaitez-vous aller?</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search Form */}
        <div className="p-6 space-y-6">
          {/* Destination */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Destination
            </label>
            <div className="relative">
              <input
                ref={destinationRef}
                type="text"
                value={destination}
                onChange={handleDestinationChange}
                onKeyPress={handleKeyPress}
                placeholder="Rechercher une ville ou une adresse..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 z-10 max-h-60 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{suggestion.name}</div>
                      <div className="text-sm text-gray-500 capitalize">{suggestion.type}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Arrivée
              </label>
              <input
                type="date"
                value={checkIn}
                onChange={handleCheckInChange}
                min={today}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Départ
              </label>
              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                min={checkIn || today}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Optional: Quick date options */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                const today = new Date();
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                setCheckIn(today.toISOString().split('T')[0]);
                setCheckOut(tomorrow.toISOString().split('T')[0]);
              }}
              className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Ce soir
            </button>
            <button
              onClick={() => {
                const weekend = new Date();
                weekend.setDate(weekend.getDate() + (6 - weekend.getDay())); // Next Saturday
                const sunday = new Date(weekend);
                sunday.setDate(sunday.getDate() + 1);
                setCheckIn(weekend.toISOString().split('T')[0]);
                setCheckOut(sunday.toISOString().split('T')[0]);
              }}
              className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Ce weekend
            </button>
            <button
              onClick={() => {
                const nextWeek = new Date();
                nextWeek.setDate(nextWeek.getDate() + 7);
                const weekAfter = new Date(nextWeek);
                weekAfter.setDate(weekAfter.getDate() + 7);
                setCheckIn(nextWeek.toISOString().split('T')[0]);
                setCheckOut(weekAfter.toISOString().split('T')[0]);
              }}
              className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Semaine prochaine
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium"
          >
            Annuler
          </button>
          <button
            onClick={handleSearch}
            disabled={!destination.trim() || loading}
            className="px-8 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Recherche...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Rechercher</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Example usage component showing how to integrate with SearchResults
const SearchApp = () => {
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [searchParams, setSearchParams] = useState(null);

  const handleSearch = (params) => {
    setSearchParams(params);
    setShowSearchModal(false);
    setShowResults(true);
  };

  const handleBackToSearch = () => {
    setShowResults(false);
    setShowSearchModal(true);
  };

  const handlePropertySelect = (property) => {
    console.log('Selected property:', property);
    // Navigate to property detail page
  };

  if (showResults) {
    // You would import your actual SearchResults component here
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Résultats de recherche</h2>
            <button 
              onClick={handleBackToSearch}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Nouvelle recherche
            </button>
          </div>
          <div className="space-y-4">
            <p><strong>Destination:</strong> {searchParams?.destination}</p>
            {searchParams?.dateSelection?.dates && (
              <p><strong>Dates:</strong> {searchParams.dateSelection.dates.join(' → ')}</p>
            )}
            <p className="text-sm text-gray-600">
            <SearchResults
                isOpen={showResults}
                onClose={() => setShowResults(false)}
                searchParams={searchParams}
                onPropertySelect={handlePropertySelect}
                />
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Trouvez votre logement idéal</h1>
        
        {/* Search Button */}
        <button
          onClick={() => setShowSearchModal(true)}
          className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg shadow-lg transition-colors flex items-center space-x-3 mx-auto"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span>Commencer la recherche</span>
        </button>
      </div>

      {/* Search Modal */}
      <SearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        onSearch={handleSearch}
      />
    </div>
  );
};

export default SearchApp;