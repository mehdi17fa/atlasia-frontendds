import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../api';

const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const isSameDay = (a, b) => {
  if (!a || !b) return false;
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
};

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0,0,0,0);
  return x;
};

const toDate = (v) => v instanceof Date ? startOfDay(v) : startOfDay(new Date(v));

export default function DateRangeCalendar({
  title = 'Sélectionner les dates',
  initialCheckIn,
  initialCheckOut,
  minDate,
  maxDate,
  unavailableDates = [],
  fetchAvailability, // async () => [dateStrings]
  onApply,
  onCancel,
  onClose,
  className = ''
}) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const base = initialCheckIn ? new Date(initialCheckIn) : new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const [selectedStart, setSelectedStart] = useState(initialCheckIn ? toDate(initialCheckIn) : null);
  const [selectedEnd, setSelectedEnd] = useState(initialCheckOut ? toDate(initialCheckOut) : null);
  const [blockedDates, setBlockedDates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Normalize blocked dates set for fast lookup
  const blockedSet = useMemo(() => {
    const set = new Set();
    blockedDates.forEach(d => {
      const dd = toDate(d);
      set.add(dd.getTime());
    });
    unavailableDates.forEach(d => {
      const dd = toDate(d);
      set.add(dd.getTime());
    });
    return set;
  }, [blockedDates, unavailableDates]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!fetchAvailability) return;
      try {
        setLoading(true);
        setError('');
        const dates = await fetchAvailability();
        if (mounted) setBlockedDates(dates || []);
      } catch (_) {
        if (mounted) setError("Impossible de charger les disponibilités.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [fetchAvailability]);

  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDow = (firstDay.getDay() + 6) % 7; // Make Monday first (Lun)
    const days = [];
    for (let i = 0; i < startDow; i++) {
      days.push(null);
    }
    const numDays = new Date(year, month + 1, 0).getDate();
    for (let d = 1; d <= numDays; d++) {
      days.push(new Date(year, month, d));
    }
    return days;
  }, [currentMonth]);

  const isDisabled = (date) => {
    if (!date) return true;
    const ts = startOfDay(date).getTime();
    const today = startOfDay(new Date()).getTime();
    if (minDate && ts < startOfDay(minDate).getTime()) return true;
    if (maxDate && ts > startOfDay(maxDate).getTime()) return true;
    if (ts < today) return true;
    if (blockedSet.has(ts)) return true;
    return false;
  };

  const inRange = (date) => {
    if (!date || !selectedStart || !selectedEnd) return false;
    const ts = startOfDay(date).getTime();
    return ts > selectedStart.getTime() && ts < selectedEnd.getTime();
  };

  const handleSelect = (date) => {
    if (!date || isDisabled(date)) return;
    if (!selectedStart || (selectedStart && selectedEnd)) {
      setSelectedStart(toDate(date));
      setSelectedEnd(null);
      return;
    }
    // Selecting end; ensure not disabled and after start
    const startTs = selectedStart.getTime();
    const endTs = toDate(date).getTime();
    if (endTs <= startTs) {
      setSelectedStart(toDate(date));
      setSelectedEnd(null);
      return;
    }
    // Validate that no blocked dates inside range
    for (let t = startTs; t <= endTs; t += 24*60*60*1000) {
      if (blockedSet.has(t)) {
        setError('La plage sélectionnée contient des dates indisponibles.');
        return;
      }
    }
    setError('');
    setSelectedEnd(new Date(endTs));
  };

  const apply = () => {
    if (!selectedStart || !selectedEnd) return;
    onApply && onApply(selectedStart.toISOString(), selectedEnd.toISOString());
    onClose && onClose();
  };

  const prevMonth = () => {
    const d = new Date(currentMonth);
    d.setMonth(d.getMonth() - 1);
    setCurrentMonth(d);
  };
  const nextMonth = () => {
    const d = new Date(currentMonth);
    d.setMonth(d.getMonth() + 1);
    setCurrentMonth(d);
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg border p-4 md:p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
      </div>

      {loading ? (
        <div className="py-10 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
        </div>
      ) : (
        <>
          {error && (
            <div className="mb-3 text-sm text-red-600">{error}</div>
          )}

          {/* Header controls */}
          <div className="flex items-center justify-between mb-3">
            <button onClick={prevMonth} className="px-2 py-1 rounded hover:bg-gray-100">◀</button>
            <div className="font-medium text-gray-800">
              {currentMonth.toLocaleString('fr-FR', { month: 'long', year: 'numeric' })}
            </div>
            <button onClick={nextMonth} className="px-2 py-1 rounded hover:bg-gray-100">▶</button>
          </div>

          {/* Week header */}
          <div className="grid grid-cols-7 gap-1 text-xs text-gray-600 mb-1">
            {dayNames.map(d => (
              <div key={d} className="text-center py-1">{d}</div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1">
            {daysInMonth.map((date, idx) => {
              if (!date) return <div key={`empty-${idx}`} />;
              const disabled = isDisabled(date);
              const isStart = selectedStart && isSameDay(date, selectedStart);
              const isEnd = selectedEnd && isSameDay(date, selectedEnd);
              const between = inRange(date);
              return (
                <button
                  key={date.toISOString()}
                  onClick={() => handleSelect(date)}
                  disabled={disabled}
                  className={`h-10 rounded-md text-sm flex items-center justify-center select-none border 
                    ${disabled ? 'bg-gray-100 text-gray-400 line-through cursor-not-allowed border-gray-200' : 'hover:bg-green-50 border-gray-200'}
                    ${between ? 'bg-green-100 text-green-900' : ''}
                    ${isStart || isEnd ? 'bg-green-600 text-white font-semibold' : ''}
                  `}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {selectedStart ? new Date(selectedStart).toLocaleDateString('fr-FR') : 'Début'}
              {' '}→{' '}
              {selectedEnd ? new Date(selectedEnd).toLocaleDateString('fr-FR') : 'Fin'}
            </div>
            <div className="flex gap-2">
              <button onClick={onCancel || onClose} className="px-4 py-2 rounded-lg border text-gray-800 hover:bg-gray-50">Annuler</button>
              <button onClick={apply} disabled={!selectedStart || !selectedEnd} className={`px-4 py-2 rounded-lg text-white ${selectedStart && selectedEnd ? 'bg-green-700 hover:bg-green-800' : 'bg-gray-400 cursor-not-allowed'}`}>Appliquer</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}




