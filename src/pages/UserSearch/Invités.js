import React, { useState } from 'react';

const GuestsSelectionScreen = ({ onBack, selectedDestination, dateSelection, onSearch }) => {
  const [adultCount, setAdultCount] = useState(2);
  const [childrenCount, setChildrenCount] = useState(0);
  const [petsCount, setPetsCount] = useState(0);
  
  const formatDateDisplay = () => {
    if (!dateSelection) return '';
    
    if (dateSelection.isRange && dateSelection.dates && dateSelection.dates.length > 0) {
      const startDate = new Date(dateSelection.dates[0]);
      const endDate = new Date(dateSelection.dates[dateSelection.dates.length - 1]);
      const formatDate = (date) => {
        return `${date.getDate()} ${['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'][date.getMonth()]}`;
      };
      return `${formatDate(startDate)} - ${formatDate(endDate)}`;
    } else if (dateSelection.date) {
      const date = new Date(dateSelection.date);
      return `${date.getDate()} ${['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'][date.getMonth()]}`;
    }
    return '';
  };

  const increment = (type) => {
    switch (type) {
      case 'adults':
        setAdultCount(prev => prev + 1);
        break;
      case 'children':
        setChildrenCount(prev => prev + 1);
        break;
      case 'pets':
        setPetsCount(prev => prev + 1);
        break;
    }
  };

  const decrement = (type) => {
    switch (type) {
      case 'adults':
        setAdultCount(prev => Math.max(1, prev - 1));
        break;
      case 'children':
        setChildrenCount(prev => Math.max(0, prev - 1));
        break;
      case 'pets':
        setPetsCount(prev => Math.max(0, prev - 1));
        break;
    }
  };

  const handleSearch = () => {
    const searchData = {
      destination: selectedDestination,
      dateSelection,
      guests: {
        adults: adultCount,
        children: childrenCount,
        pets: petsCount
      }
    };
    
    onSearch(searchData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-xl w-full max-w-md h-full overflow-auto shadow-lg">
        {/* Header */}
        <div className="flex items-center p-4 border-b">
          <button onClick={onBack} className="mr-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex ml-8 space-x-14">
            <span className="text-gray-400">Destination</span>
            <span className="text-gray-400">Date</span>
            <span className="text-green-800 font-medium border-b-2 border-green-800 pb-2">Invités</span>
          </div>
        </div>

        {/* Selected Destination */}
        <div className="p-4">
          <div className="bg-gray-100 rounded-lg p-4 flex items-center mb-4">
            <span className="text-gray-500 text-sm mr-4">Destination</span>
            <span className="text-gray-800 font-medium ml-36">{selectedDestination}</span>
          </div>
          
          {/* Selected Date */}
          <div className="bg-gray-100 rounded-lg p-4 flex items-center">
            <span className="text-gray-500 text-sm mr-4">Date</span>
            <span className="text-gray-800 font-medium ml-60">{formatDateDisplay()}</span>
          </div>
        </div>

        {/* Guests Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-green-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        </div>

        {/* Main Question */}
        <div className="text-center mb-8">
          <h2 className="text-lg font-medium text-gray-800">Combien êtes-vous ?</h2>
        </div>

        {/* Adults Counter */}
        <div className="px-4 mb-6">
          <div className="flex items-center justify-center">
            <button
              onClick={() => decrement('adults')}
              className="w-10 h-10 bg-green-800 text-white rounded-full flex items-center justify-center hover:bg-green-700 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <span className="mx-8 text-2xl font-medium text-gray-800">{adultCount}</span>
            <button
              onClick={() => increment('adults')}
              className="w-10 h-10 bg-green-800 text-white rounded-full flex items-center justify-center hover:bg-green-700 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>

        {/* Others Section */}
        <div className="px-4 mb-8">
          <h3 className="text-center text-gray-700 font-medium mb-6">Autres:</h3>
          
          {/* Children */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="children"
                checked={childrenCount > 0}
                onChange={() => childrenCount > 0 ? setChildrenCount(0) : setChildrenCount(1)}
                className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <label htmlFor="children" className="ml-3 text-gray-700">Enfants</label>
            </div>
            {childrenCount > 0 && (
              <div className="flex items-center">
                <button
                  onClick={() => decrement('children')}
                  className="w-8 h-8 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center hover:bg-gray-300 transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <span className="mx-3 text-lg text-gray-800">{childrenCount}</span>
                <button
                  onClick={() => increment('children')}
                  className="w-8 h-8 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center hover:bg-gray-300 transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Pets */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="pets"
                checked={petsCount > 0}
                onChange={() => petsCount > 0 ? setPetsCount(0) : setPetsCount(1)}
                className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <label htmlFor="pets" className="ml-3 text-gray-700">
                <div>Animaux</div>
                <div className="text-sm text-gray-500">Domestique</div>
              </label>
            </div>
            {petsCount > 0 && (
              <div className="flex items-center">
                <button
                  onClick={() => decrement('pets')}
                  className="w-8 h-8 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center hover:bg-gray-300 transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <span className="mx-3 text-lg text-gray-800">{petsCount}</span>
                <button
                  onClick={() => increment('pets')}
                  className="w-8 h-8 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center hover:bg-gray-300 transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Search Button */}
        <div className="px-4 pb-8">
          <button
            onClick={handleSearch}
            className="w-full py-3 bg-green-800 text-white rounded-full font-medium hover:bg-green-700 transition"
          >
            Chercher
          </button>
        </div>
      </div>
    </div>
  );
};

export default GuestsSelectionScreen;