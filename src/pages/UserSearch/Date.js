import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const DateSelectionScreens = ({ selectedDestination, onBack }) => {
  const [selectedDates, setSelectedDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date(2025, 5));
  const [isRangeSelection, setIsRangeSelection] = useState(false);
  const navigate = useNavigate();

  const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  const daysOfWeek = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'];

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7;

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      const prevMonthDay = new Date(year, month, 0 - startingDayOfWeek + i + 1);
      days.push({ day: prevMonthDay.getDate(), isCurrentMonth: false, date: prevMonthDay });
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push({ day, isCurrentMonth: true, date });
    }
    const remainingCells = 42 - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      const nextMonthDay = new Date(year, month + 1, i);
      days.push({ day: i, isCurrentMonth: false, date: nextMonthDay });
    }
    return days;
  };

  const handleDateClick = (dateObj) => {
    if (!dateObj.isCurrentMonth) return;
    const time = dateObj.date.getTime();
    if (isRangeSelection) {
      setSelectedDates((prev) => {
        const exists = prev.find(d => d.getTime() === time);
        return exists ? prev.filter(d => d.getTime() !== time) : [...prev, dateObj.date].sort((a, b) => a - b);
      });
    } else {
      setSelectedDate(dateObj.date);
    }
  };

  const isDateSelected = (dateObj) => {
    if (!dateObj.isCurrentMonth) return false;
    return isRangeSelection
      ? selectedDates.some(d => d.getTime() === dateObj.date.getTime())
      : selectedDate && selectedDate.getTime() === dateObj.date.getTime();
  };

  const getDayClassName = (dateObj) => {
    let className = "w-10 h-10 flex items-center justify-center text-sm cursor-pointer rounded-full ";
    if (!dateObj.isCurrentMonth) {
      className += "text-gray-300 ";
    } else if (isDateSelected(dateObj)) {
      className += "bg-green-800 text-white font-medium ";
    } else {
      className += "text-gray-700 hover:bg-gray-100 ";
    }
    return className;
  };

  const canProceed = () => isRangeSelection ? selectedDates.length > 0 : !!selectedDate;

  const handleNext = () => {
    if (!canProceed()) return;
    const dateSelection = isRangeSelection ? { dates: selectedDates, isRange: true } : { date: selectedDate, isRange: false };
    // Navigate to guests screen with current data
    navigate('/search-guests', { state: { selectedDestination, dateSelection } });
  };

  const toggleSelectionMode = () => {
    setIsRangeSelection(!isRangeSelection);
    setSelectedDate(null);
    setSelectedDates([]);
  };

  const navigateMonth = (direction) => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() + direction);
      return newMonth;
    });
  };

  const days = getDaysInMonth(currentMonth);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-xl w-full max-w-md h-full overflow-auto shadow-lg">
        <div className="flex items-center p-4 border-b">
          <button onClick={onBack} className="mr-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex ml-8 space-x-14">
            <span className="text-gray-400">Destination</span>
            <span className="text-green-800 font-medium border-b-2 border-green-800 pb-2">Date</span>
            <span className="text-gray-400">Invités</span>
          </div>
        </div>

        <div className="p-4">
          <div className="bg-gray-100 rounded-lg p-4 flex items-center">
            <span className="text-gray-500 text-sm mr-4">Destination</span>
            <span className="text-gray-800 font-medium ml-36">{selectedDestination}</span>
          </div>
        </div>

        <div className="px-4 mb-4">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setIsRangeSelection(false)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${!isRangeSelection ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Une journée
            </button>
            <button
              onClick={() => setIsRangeSelection(true)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${isRangeSelection ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Plusieurs jours
            </button>
          </div>
        </div>

        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-green-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>

        <div className="px-4">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => navigateMonth(-1)} className="p-2 hover:bg-gray-100 rounded-full">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-lg font-medium">
              {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h2>
            <button onClick={() => navigateMonth(1)} className="p-2 hover:bg-gray-100 rounded-full">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-7 mb-2">
            {daysOfWeek.map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 mb-8">
            {days.map((dateObj, index) => (
              <button
                key={index}
                onClick={() => handleDateClick(dateObj)}
                className={getDayClassName(dateObj)}
                disabled={!dateObj.isCurrentMonth}
              >
                {dateObj.day}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 pb-8">
          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className={`w-full py-3 rounded-full font-medium transition ${canProceed() ? 'bg-green-800 text-white hover:bg-green-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
          >
            Suivant
          </button>
        </div>
      </div>
    </div>
  );
};

export default DateSelectionScreens;
