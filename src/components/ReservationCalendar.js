import React, { useState } from 'react';
import { formatDateToLocalString } from '../utils/dateUtils';

const ReservationCalendar = ({ 
  propertyId, 
  onDateSelect, 
  onClose, 
  initialCheckIn, 
  initialCheckOut 
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedCheckIn, setSelectedCheckIn] = useState(
    initialCheckIn ? new Date(initialCheckIn) : null
  );
  const [selectedCheckOut, setSelectedCheckOut] = useState(
    initialCheckOut ? new Date(initialCheckOut) : null
  );
  const [hoveredDate, setHoveredDate] = useState(null);

  // Note: Availability checking can be added later when the API endpoint is ready
  // To add property-specific availability:
  // 1. Uncomment the useEffect and fetchPropertyAvailability function
  // 2. Add back the unavailableDates state
  // 3. Update isDateUnavailable to check both past dates and unavailable dates
  // 4. Make sure the API endpoint /api/property/:id/availability exists

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const isDateUnavailable = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Only past dates are unavailable for now
    // Property-specific availability can be added later
    return date < today;
  };

  const isDateInRange = (date) => {
    if (!selectedCheckIn || !selectedCheckOut) return false;
    
    const checkIn = new Date(selectedCheckIn);
    const checkOut = new Date(selectedCheckOut);
    
    return date > checkIn && date < checkOut;
  };

  const handleDateClick = (date) => {
    if (isDateUnavailable(date)) return;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return;

    if (!selectedCheckIn || (selectedCheckIn && selectedCheckOut)) {
      // Start new selection
      setSelectedCheckIn(date);
      setSelectedCheckOut(null);
    } else if (selectedCheckIn && !selectedCheckOut) {
      // Complete selection
      if (date > selectedCheckIn) {
        setSelectedCheckOut(date);
      } else if (date < selectedCheckIn) {
        // If clicking a date before check-in, swap them
        setSelectedCheckOut(selectedCheckIn);
        setSelectedCheckIn(date);
      } else {
        // Same date clicked, deselect
        setSelectedCheckIn(null);
        setSelectedCheckOut(null);
      }
    }
  };

  const handleConfirm = () => {
    if (selectedCheckIn && selectedCheckOut) {
      const checkInStr = formatDateToLocalString(selectedCheckIn);
      const checkOutStr = formatDateToLocalString(selectedCheckOut);
      console.log('ReservationCalendar sending dates:', { checkInStr, checkOutStr });
      onDateSelect(checkInStr, checkOutStr);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getDateClassName = (date) => {
    if (!date) return 'w-12 h-12';
    
    const baseClass = 'w-12 h-12 flex items-center justify-center text-sm cursor-pointer rounded-full transition-colors';
    
    if (isDateUnavailable(date)) {
      return `${baseClass} bg-gray-100 text-gray-400 cursor-not-allowed`;
    }
    
    if (selectedCheckIn && date.toDateString() === selectedCheckIn.toDateString()) {
      return `${baseClass} bg-green-600 text-white`;
    }
    
    if (selectedCheckOut && date.toDateString() === selectedCheckOut.toDateString()) {
      return `${baseClass} bg-green-600 text-white`;
    }
    
    if (isDateInRange(date)) {
      return `${baseClass} bg-green-100 text-green-700`;
    }
    
    if (hoveredDate && selectedCheckIn && !selectedCheckOut && date > selectedCheckIn && date < hoveredDate) {
      return `${baseClass} bg-green-50 text-green-600`;
    }
    
    return `${baseClass} hover:bg-gray-100`;
  };

  const navigateMonth = (direction) => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() + direction);
      return newMonth;
    });
  };

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Sélectionner les dates</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <h3 className="text-lg font-medium">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h3>
          
          <button
            onClick={() => navigateMonth(1)}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map(day => (
            <div key={day} className="w-12 h-8 flex items-center justify-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1">
          {getDaysInMonth(currentMonth).map((date, index) => (
            <div
              key={index}
              className={getDateClassName(date)}
              onClick={() => date && handleDateClick(date)}
              onMouseEnter={() => date && setHoveredDate(date)}
              onMouseLeave={() => setHoveredDate(null)}
            >
              {date && date.getDate()}
            </div>
          ))}
        </div>

        {/* Selected Dates Summary */}
        {selectedCheckIn && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-800 mb-2">Dates sélectionnées:</h4>
            <p className="text-sm text-gray-600">
              <strong>Arrivée:</strong> {formatDate(selectedCheckIn)}
            </p>
            {selectedCheckOut && (
              <p className="text-sm text-gray-600">
                <strong>Départ:</strong> {formatDate(selectedCheckOut)}
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedCheckIn || !selectedCheckOut}
            className={`flex-1 py-2 px-4 rounded-lg font-medium ${
              selectedCheckIn && selectedCheckOut
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReservationCalendar;
