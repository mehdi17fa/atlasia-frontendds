/**
 * Date utility functions to handle timezone issues consistently
 */

/**
 * Format a Date object to YYYY-MM-DD string in local timezone
 * @param {Date} date - The date to format
 * @returns {string} - Formatted date string (YYYY-MM-DD)
 */
export const formatDateToLocalString = (date) => {
  if (!date || !(date instanceof Date)) return null;
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Parse a YYYY-MM-DD string to a Date object in local timezone
 * @param {string} dateString - The date string to parse
 * @returns {Date|null} - Parsed date or null if invalid
 */
export const parseLocalDateString = (dateString) => {
  if (!dateString) return null;
  
  try {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day); // month is 0-indexed
  } catch (error) {
    console.error('Error parsing date string:', dateString, error);
    return null;
  }
};

/**
 * Format a date string for display in French locale
 * @param {string} dateString - The date string to format
 * @returns {string} - Formatted date for display
 */
export const formatDateForDisplay = (dateString) => {
  if (!dateString) return "N/A";
  
  const date = parseLocalDateString(dateString);
  if (!date) return dateString;
  
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

/**
 * Check if a date is today or in the future
 * @param {string|Date} date - The date to check
 * @returns {boolean} - True if date is today or future
 */
export const isDateTodayOrFuture = (date) => {
  const checkDate = typeof date === 'string' ? parseLocalDateString(date) : date;
  if (!checkDate) return false;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  checkDate.setHours(0, 0, 0, 0);
  
  return checkDate >= today;
};

/**
 * Get the number of days between two dates
 * @param {string|Date} startDate - The start date
 * @param {string|Date} endDate - The end date
 * @returns {number} - Number of days between dates
 */
export const getDaysBetween = (startDate, endDate) => {
  const start = typeof startDate === 'string' ? parseLocalDateString(startDate) : startDate;
  const end = typeof endDate === 'string' ? parseLocalDateString(endDate) : endDate;
  
  if (!start || !end) return 0;
  
  const timeDiff = end.getTime() - start.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
};
