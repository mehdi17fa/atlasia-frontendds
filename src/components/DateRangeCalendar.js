import React, { useEffect, useMemo, useRef, useState } from 'react';

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

// Normalize to UTC midnight to avoid timezone overlap issues when serializing
const toUtcStartIso = (d) => {
  const x = new Date(d);
  return new Date(Date.UTC(x.getFullYear(), x.getMonth(), x.getDate())).toISOString();
};

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
  const [boundaryCheckIns, setBoundaryCheckIns] = useState([]);
  const [hardBoundaryDays, setHardBoundaryDays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cellPx, setCellPx] = useState(48); // responsive day cell size in px
  const [gridGapPx, setGridGapPx] = useState(8);
  const monthRef = useRef(null);

  useEffect(() => {
    const el = monthRef.current;
    if (!el) return;
    const compute = () => {
      const width = el.clientWidth || 0;
      const minGap = 4;
      const maxGap = 12;
      const maxPx = 72;
      // Try to fill the row exactly by solving for cell and gap
      // Start with generous cell, then compute gap that makes 7*cell + 6*gap = width
      let cell = Math.min(maxPx, Math.floor(width / 7));
      let gap = (width - 7 * cell) / 6;
      if (gap < minGap) {
        gap = minGap;
        cell = Math.floor((width - 6 * gap) / 7);
      } else if (gap > maxGap) {
        gap = maxGap;
        cell = Math.floor((width - 6 * gap) / 7);
      }
      setGridGapPx(gap);
      setCellPx(cell);
    };
    compute();
    let resizeObserver;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(compute);
      resizeObserver.observe(el);
    } else {
      window.addEventListener('resize', compute);
    }
    return () => {
      if (resizeObserver) resizeObserver.disconnect();
      else window.removeEventListener('resize', compute);
    };
  }, []);

  const dayFontPx = useMemo(() => {
    if (cellPx >= 68) return 20;
    if (cellPx >= 60) return 18;
    if (cellPx >= 52) return 16;
    return 14;
  }, [cellPx]);

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

  // Normalize boundary check-in days (days that begin an existing booking)
  const boundarySet = useMemo(() => {
    const set = new Set();
    (boundaryCheckIns || []).forEach(d => {
      const dd = toDate(d);
      set.add(dd.getTime());
    });
    return set;
  }, [boundaryCheckIns]);

  // Normalize fully blocked boundary days (where checkout === next check-in)
  const hardSet = useMemo(() => {
    const set = new Set();
    (hardBoundaryDays || []).forEach(d => {
      const dd = toDate(d);
      set.add(dd.getTime());
    });
    return set;
  }, [hardBoundaryDays]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!fetchAvailability) return;
      try {
        setLoading(true);
        setError('');
        const result = await fetchAvailability();
        if (mounted) {
          if (Array.isArray(result)) {
            setBlockedDates(result || []);
            setBoundaryCheckIns([]);
            setHardBoundaryDays([]);
          } else if (result && typeof result === 'object') {
            setBlockedDates(result.blockedDates || []);
            setBoundaryCheckIns(result.boundaryCheckIns || []);
            setHardBoundaryDays(result.fullyBlockedBoundaries || []);
          }
        }
      } catch (_) {
        if (mounted) setError("Impossible de charger les disponibilités.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [fetchAvailability]);

  const daysInCurrentMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDow = (firstDay.getDay() + 6) % 7; // Monday-first
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

  // End-exclusive aware disabled check used for rendering and clicks
  const isEffectivelyDisabled = (date) => {
    if (!date) return true;
    const ts = startOfDay(date).getTime();
    if (hardSet.has(ts)) return true; // always unavailable
    if (!isDisabled(date)) return false;
    // Allow selecting a blocked/boundary day as END boundary when start chosen and no blocked nights inside
    if ((blockedSet.has(ts) || boundarySet.has(ts)) && selectedStart && !selectedEnd) {
      const startTs = selectedStart.getTime();
      if (ts > startTs) {
        for (let t = startTs; t < ts; t += 24*60*60*1000) {
          if (blockedSet.has(t)) return true; // inner blocked -> still disabled
        }
        return false; // allowed as end boundary
      }
    }
    // Otherwise disabled
    return true;
  };

  const inRange = (date) => {
    if (!date || !selectedStart || !selectedEnd) return false;
    const ts = startOfDay(date).getTime();
    return ts > selectedStart.getTime() && ts < selectedEnd.getTime();
  };

  const handleSelect = (date) => {
    if (!date) return;
    const ts = startOfDay(date).getTime();
    // Disallow starting a selection on a boundary check-in day
    if (!selectedStart && boundarySet.has(ts)) return;
    let disabled = isEffectivelyDisabled(date);

    // Allow a blocked day to serve as the END boundary when a start is chosen,
    // provided there are no blocked nights strictly inside the range
    if (disabled && blockedSet.has(ts) && selectedStart && !selectedEnd) {
      const startTs = selectedStart.getTime();
      if (ts > startTs) {
        let hasInnerBlocked = false;
        for (let t = startTs; t < ts; t += 24*60*60*1000) {
          if (blockedSet.has(t)) { hasInnerBlocked = true; break; }
        }
        if (!hasInnerBlocked) {
          disabled = false;
        }
      }
    }

    if (disabled) return;
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
    // Validate that no blocked nights inside range (end-exclusive)
    for (let t = startTs; t < endTs; t += 24*60*60*1000) {
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
    // Use UTC midnight ISO strings so adjacent bookings (checkout==next checkin) don't overlap by timezone
    onApply && onApply(toUtcStartIso(selectedStart), toUtcStartIso(selectedEnd));
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
    <div className={`bg-white rounded-xl shadow-lg border p-6 md:p-8 w-full max-w-[820px] ${className}`}>
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
          <div className="flex items-center justify-between mb-5">
            <button onClick={prevMonth} className="p-2 rounded-full hover:bg-gray-100">◀</button>
            <div className="font-medium text-gray-800">
              {currentMonth.toLocaleString('fr-FR', { month: 'long', year: 'numeric' })}
            </div>
            <button onClick={nextMonth} className="p-2 rounded-full hover:bg-gray-100">▶</button>
          </div>

          {/* One-month layout */}
          <div className="grid grid-cols-1 gap-10">
            {/* First month */}
            <div className="w-full mx-auto" ref={monthRef}>
              <div className="grid text-xs text-gray-600 mb-3" style={{ gridTemplateColumns: 'repeat(7, 1fr)', gap: `${gridGapPx}px` }}>
                {dayNames.map(d => (
                  <div key={`h1-${d}`} className="text-center py-1">{d}</div>
                ))}
              </div>
              <div className="grid" style={{ gridTemplateColumns: 'repeat(7, 1fr)', gap: `${gridGapPx}px` }}>
                {daysInCurrentMonth.map((date, idx) => {
                  if (!date) return <div key={`empty-1-${idx}`} />;
                  const ts = startOfDay(date).getTime();
                  const effectiveDisabled = isEffectivelyDisabled(date);
                  const isBoundary = boundarySet.has(ts);
                  const isHardBoundary = hardSet.has(ts);

                  const isStart = selectedStart && isSameDay(date, selectedStart);
                  const isEnd = selectedEnd && isSameDay(date, selectedEnd);
                  const between = inRange(date);
                  return (
                    <button
                      key={date.toISOString()}
                      onClick={() => handleSelect(date)}
                      disabled={effectiveDisabled}
                      title={effectiveDisabled && isBoundary && !isHardBoundary ? 'Disponible comme date de départ' : undefined}
                      className={`leading-none rounded-full flex items-center justify-center select-none border mx-auto 
                        ${effectiveDisabled 
                          ? (isBoundary && !isHardBoundary 
                              ? 'bg-white text-gray-800 cursor-not-allowed border-gray-200' 
                              : 'bg-gray-100 text-gray-400 line-through cursor-not-allowed border-gray-200') 
                          : 'hover:bg-green-50 border-gray-200'}
                        ${between ? 'bg-green-100 text-green-900' : ''}
                        ${isStart || isEnd ? 'bg-green-600 text-white font-semibold' : ''}
                      `}
                      style={{ width: '100%', aspectRatio: '1 / 1', fontSize: `${dayFontPx}px` }}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>
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




