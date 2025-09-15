import React, { useState } from "react";

const monthNames = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];
const weekDays = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year, month) {
  let day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

/**
 * Calendar component
 * @param {Date|[Date,Date]} value - selected date or range
 * @param {function} onChange - callback with new value
 * @param {"single"|"range"} mode - selection mode
 */
export default function Calendar({ value, onChange, mode = "single" }) {
  const today = new Date();
  // Defensive: ensure value is a valid Date or [Date, Date|null]
  let initialMonth, initialYear;
  if (mode === "single") {
    initialMonth = value instanceof Date ? value.getMonth() : today.getMonth();
    initialYear = value instanceof Date ? value.getFullYear() : today.getFullYear();
  } else {
    const arr = Array.isArray(value) ? value : [null, null];
    initialMonth = arr[0] instanceof Date ? arr[0].getMonth() : today.getMonth();
    initialYear = arr[0] instanceof Date ? arr[0].getFullYear() : today.getFullYear();
  }
  const [currentMonth, setCurrentMonth] = useState(initialMonth);
  const [currentYear, setCurrentYear] = useState(initialYear);
  const [viewMode, setViewMode] = useState("day"); // "day" | "month" | "year"
  const [rangeSelecting, setRangeSelecting] = useState(false);

  // For year selection, show a range around the current year
  const yearRange = [];
  for (let y = currentYear - 5; y <= currentYear + 6; y++) {
    yearRange.push(y);
  }

  // --- Day Mode ---
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfWeek = getFirstDayOfWeek(currentYear, currentMonth);

  // Previous month's trailing days
  const prevMonthDays = [];
  if (firstDayOfWeek > 0) {
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const prevMonthTotalDays = getDaysInMonth(prevYear, prevMonth);
    for (let i = prevMonthTotalDays - firstDayOfWeek + 1; i <= prevMonthTotalDays; i++) {
      prevMonthDays.push({ day: i, isCurrent: false });
    }
  }

  // Current month's days
  const monthDays = [];
  for (let i = 1; i <= daysInMonth; i++) {
    monthDays.push({ day: i, isCurrent: true });
  }

  // Next month's leading days
  const totalCells = prevMonthDays.length + monthDays.length;
  const nextMonthDays = [];
  for (let i = 1; totalCells + nextMonthDays.length < 42; i++) {
    nextMonthDays.push({ day: i, isCurrent: false });
  }

  const allDays = [...prevMonthDays, ...monthDays, ...nextMonthDays];

  // --- Month Mode ---
  const monthsGrid = [];
  for (let i = 0; i < 12; i++) {
    monthsGrid.push(i);
  }
  while (monthsGrid.length < 12) monthsGrid.push(null);

  // --- Year Mode ---
  const yearsGrid = [...yearRange];
  while (yearsGrid.length % 12 !== 0) yearsGrid.push(null);

  // --- Handlers ---
  const handlePrev = () => {
    if (viewMode === "day") {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else if (viewMode === "month") {
      setCurrentYear(currentYear - 1);
    } else if (viewMode === "year") {
      const minYear = yearRange[0] - 12;
      for (let y = minYear; y < minYear + 12; y++) yearRange.unshift(y);
      setCurrentYear(currentYear - 12);
    }
  };

  const handleNext = () => {
    if (viewMode === "day") {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    } else if (viewMode === "month") {
      setCurrentYear(currentYear + 1);
    } else if (viewMode === "year") {
      const maxYear = yearRange[yearRange.length - 1] + 1;
      for (let y = maxYear; y < maxYear + 12; y++) yearRange.push(y);
      setCurrentYear(currentYear + 12);
    }
  };

  // --- Selection logic ---
  const isSingle = mode === "single";
  const selectedDate = isSingle
    ? value instanceof Date ? value : null
    : Array.isArray(value) ? value : [null, null];

  function isSameDay(d1, d2) {
    return (
      d1 && d2 &&
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    );
  }

  function isInRange(day) {
    if (isSingle || !selectedDate[0] || !selectedDate[1]) return false;
    const d = new Date(currentYear, currentMonth, day);
    return d >= selectedDate[0] && d <= selectedDate[1];
  }

  function isRangeStart(day) {
    if (isSingle || !selectedDate[0]) return false;
    return (
      selectedDate[0].getDate() === day &&
      selectedDate[0].getMonth() === currentMonth &&
      selectedDate[0].getFullYear() === currentYear
    );
  }

  function isRangeEnd(day) {
    if (isSingle || !selectedDate[1]) return false;
    return (
      selectedDate[1].getDate() === day &&
      selectedDate[1].getMonth() === currentMonth &&
      selectedDate[1].getFullYear() === currentYear
    );
  }

  const handleSelectDay = (dayObj, idx) => {
    if (!dayObj.isCurrent) return;
    const day = dayObj.day;
    const date = new Date(currentYear, currentMonth, day);

    if (isSingle) {
      if (selectedDate && isSameDay(selectedDate, date)) {
        // Deselect if already selected
        onChange && onChange(null);
      } else {
        onChange && onChange(date);
      }
    } else {
      // Range selection logic
      if (!selectedDate[0] && !selectedDate[1]) {
        // Start new range
        onChange && onChange([date, null]);
        setRangeSelecting(true);
      } else if (selectedDate[0] && !selectedDate[1]) {
        if (isSameDay(selectedDate[0], date)) {
          // Deselect start
          onChange && onChange([null, null]);
          setRangeSelecting(false);
        } else if (date < selectedDate[0]) {
          // If end before start, swap
          onChange && onChange([date, selectedDate[0]]);
          setRangeSelecting(false);
        } else {
          onChange && onChange([selectedDate[0], date]);
          setRangeSelecting(false);
        }
      } else if (selectedDate[0] && selectedDate[1]) {
        // If both are set, check if clicking on start or end to deselect
        if (isSameDay(selectedDate[0], date) || isSameDay(selectedDate[1], date)) {
          onChange && onChange([null, null]);
          setRangeSelecting(false);
        } else {
          // Start new range
          onChange && onChange([date, null]);
          setRangeSelecting(true);
        }
      }
    }
  };

  const handleSelectMonth = (monthIdx) => {
    setCurrentMonth(monthIdx);
    setViewMode("day");
  };

  const handleSelectYear = (year) => {
    setCurrentYear(year);
    setViewMode("month");
  };

  return (
    <div className="bg-white rounded-xl p-4 w-80 relative">
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={handlePrev}
          className="text-green-800 text-2xl px-2"
        >
          &#60;
        </button>
        <div className="flex items-center gap-2 font-semibold text-lg font-['Lexend']">
          {viewMode === "day" && (
            <>
              <span
                className="cursor-pointer px-1 rounded hover:bg-green-50"
                onClick={() => setViewMode("month")}
              >
                {monthNames[currentMonth]}
              </span>
              <span
                className="cursor-pointer px-1 rounded hover:bg-green-50"
                onClick={() => setViewMode("year")}
              >
                {currentYear}
              </span>
            </>
          )}
          {viewMode === "month" && (
            <span
              className="cursor-pointer px-1 rounded hover:bg-green-50"
              onClick={() => setViewMode("year")}
            >
              {currentYear}
            </span>
          )}
          {viewMode === "year" && (
            <span className="px-1 rounded font-bold">{`${yearRange[0]} - ${yearRange[yearRange.length - 1]}`}</span>
          )}
        </div>
        <button
          onClick={handleNext}
          className="text-green-800 text-2xl px-2"
        >
          &#62;
        </button>
      </div>

      {/* Weekdays header only in day mode */}
      {viewMode === "day" && (
        <div className="grid grid-cols-7 text-center mb-1">
          {weekDays.map((d) => (
            <div key={d} className="text-gray-500 font-medium font-['Lexend']">{d}</div>
          ))}
        </div>
      )}

      {/* Day selection */}
      {viewMode === "day" && (
        <div className="grid grid-cols-7 text-center gap-y-1">
          {allDays.map((dayObj, idx) => {
            let isSelected = false;
            let isStart = false;
            let isEnd = false;
            let isBetween = false;

            if (isSingle) {
              isSelected =
                dayObj.isCurrent &&
                selectedDate &&
                selectedDate.getDate() === dayObj.day &&
                selectedDate.getMonth() === currentMonth &&
                selectedDate.getFullYear() === currentYear;
            } else {
              isStart = dayObj.isCurrent && isRangeStart(dayObj.day);
              isEnd = dayObj.isCurrent && isRangeEnd(dayObj.day);
              isBetween =
                dayObj.isCurrent &&
                selectedDate[0] &&
                selectedDate[1] &&
                isInRange(dayObj.day) &&
                !isStart &&
                !isEnd;
            }

            return (
              <button
                key={idx}
                disabled={!dayObj.isCurrent}
                onClick={() => handleSelectDay(dayObj, idx)}
                className={`w-9 h-9 mx-auto font-['Lexend']
                  ${!dayObj.isCurrent ? "text-gray-300 cursor-default" : ""}
                  ${isSingle && isSelected ? "bg-green-800 text-white font-bold" : ""}
                  ${!isSingle && isStart ? "bg-green-800 text-white font-bold" : ""}
                  ${!isSingle && isEnd ? "bg-green-800 text-white font-bold" : ""}
                  ${!isSingle && isBetween ? "bg-green-100 text-green-900 font-bold" : ""}
                  ${dayObj.isCurrent && !isSelected && !isStart && !isEnd && !isBetween ? "bg-white shadow hover:bg-green-100" : ""}
                  rounded-lg transition`}
              >
                {dayObj.day}
              </button>
            );
          })}
        </div>
      )}

      {/* Month selection */}
      {viewMode === "month" && (
        <div className="grid grid-cols-3 gap-2 mt-2">
          {monthsGrid.map((monthIdx) => {
            if (monthIdx === null) return <div key={Math.random()} />;
            const isSelected = monthIdx === currentMonth;
            return (
              <button
                key={monthIdx}
                onClick={() => handleSelectMonth(monthIdx)}
                className={`w-20 h-10 font-['Lexend'] mx-auto
                  ${isSelected ? "bg-green-800 text-white font-bold" : "bg-white shadow hover:bg-green-100"}
                  rounded-lg transition`}
              >
                {monthNames[monthIdx].slice(0, 3)}
              </button>
            );
          })}
        </div>
      )}

      {/* Year selection */}
      {viewMode === "year" && (
        <div className="grid grid-cols-3 gap-2 mt-2">
          {yearsGrid.map((year, idx) => {
            if (year === null) return <div key={idx} />;
            const isSelected = year === currentYear;
            return (
              <button
                key={year}
                onClick={() => handleSelectYear(year)}
                className={`w-20 h-10 font-['Lexend'] mx-auto
                  ${isSelected ? "bg-green-800 text-white font-bold" : "bg-white shadow hover:bg-green-100"}
                  rounded-lg transition`}
              >
                {year}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}