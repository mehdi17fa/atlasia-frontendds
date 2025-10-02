import React, { useState } from 'react';
import Calendar from './shared/Calendar';
import ReservationCalendar from './ReservationCalendar';

const CalendarTest = () => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedRange, setSelectedRange] = useState([null, null]);
  const [showReservationCalendar, setShowReservationCalendar] = useState(false);
  const [reservationDates, setReservationDates] = useState({ checkIn: null, checkOut: null });

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold text-gray-800">Calendar Test Component</h1>
      
      {/* Single Date Selection */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Single Date Selection</h2>
        <Calendar 
          value={selectedDate} 
          onChange={setSelectedDate} 
          mode="single" 
        />
        <p className="text-sm text-gray-600">
          Selected: {selectedDate ? selectedDate.toLocaleDateString() : 'None'}
        </p>
      </div>

      {/* Range Selection */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Range Selection</h2>
        <Calendar 
          value={selectedRange} 
          onChange={setSelectedRange} 
          mode="range" 
        />
        <p className="text-sm text-gray-600">
          Selected: {selectedRange[0] ? selectedRange[0].toLocaleDateString() : 'None'} 
          {selectedRange[1] && ` - ${selectedRange[1].toLocaleDateString()}`}
        </p>
      </div>

      {/* Reservation Calendar Test */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Reservation Calendar (Modal)</h2>
        <button 
          onClick={() => setShowReservationCalendar(true)}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Open Reservation Calendar
        </button>
        <p className="text-sm text-gray-600">
          Check-in: {reservationDates.checkIn ? (() => {
            const [year, month, day] = reservationDates.checkIn.split('-').map(Number);
            return new Date(year, month - 1, day).toLocaleDateString('fr-FR');
          })() : 'None'} | 
          Check-out: {reservationDates.checkOut ? (() => {
            const [year, month, day] = reservationDates.checkOut.split('-').map(Number);
            return new Date(year, month - 1, day).toLocaleDateString('fr-FR');
          })() : 'None'}
        </p>
      </div>

      {/* Reset Buttons */}
      <div className="space-x-4">
        <button 
          onClick={() => setSelectedDate(null)}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
        >
          Reset Single
        </button>
        <button 
          onClick={() => setSelectedRange([null, null])}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
        >
          Reset Range
        </button>
        <button 
          onClick={() => setReservationDates({ checkIn: null, checkOut: null })}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
        >
          Reset Reservation
        </button>
      </div>

      {/* Reservation Calendar Modal */}
      {showReservationCalendar && (
        <ReservationCalendar
          propertyId="test-property"
          onDateSelect={(checkIn, checkOut) => {
            setReservationDates({ checkIn, checkOut });
            setShowReservationCalendar(false);
          }}
          onClose={() => setShowReservationCalendar(false)}
          initialCheckIn={reservationDates.checkIn}
          initialCheckOut={reservationDates.checkOut}
        />
      )}
    </div>
  );
};

export default CalendarTest;
