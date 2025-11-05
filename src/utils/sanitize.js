// Utility functions for input sanitization

/**
 * Sanitize text input - remove dangerous characters and trim
 */
export const sanitizeText = (text, maxLength = null) => {
  if (!text || typeof text !== 'string') return '';
  
  // Remove HTML tags
  let sanitized = text.replace(/<[^>]*>/g, '');
  
  // Remove script tags and dangerous patterns
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=/gi, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  // Limit length if specified
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
};

/**
 * Sanitize email address
 */
export const sanitizeEmail = (email) => {
  if (!email || typeof email !== 'string') return '';
  
  // Remove whitespace and convert to lowercase
  const sanitized = email.trim().toLowerCase();
  
  // Basic email validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(sanitized)) {
    return '';
  }
  
  return sanitized;
};

/**
 * Sanitize phone number - keep only digits and limit to 10 digits
 */
export const sanitizePhone = (phone) => {
  if (!phone || typeof phone !== 'string') return '';
  
  // Keep only digits
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Limit to 10 digits
  const sanitized = digitsOnly.substring(0, 10);
  
  return sanitized;
};

/**
 * Sanitize price - ensure it's a valid number
 */
export const sanitizePrice = (price) => {
  if (!price && price !== 0) return '';
  
  // Convert to string and remove non-numeric characters except decimal point
  const priceStr = String(price).replace(/[^\d.]/g, '');
  
  // Parse as float
  const parsed = parseFloat(priceStr);
  
  if (isNaN(parsed) || parsed < 0) {
    return '';
  }
  
  // Round to 2 decimal places
  return Math.round(parsed * 100) / 100;
};

/**
 * Sanitize features string - split by comma and clean each feature
 */
export const sanitizeFeatures = (features) => {
  if (!features || typeof features !== 'string') return '';
  
  // Split by comma, trim each, filter empty
  const featureArray = features
    .split(',')
    .map(f => sanitizeText(f, 50).trim())
    .filter(f => f.length > 0);
  
  return featureArray.join(', ');
};

/**
 * Validate and sanitize service type
 */
export const sanitizeServiceType = (serviceType, validTypes) => {
  if (!serviceType || typeof serviceType !== 'string') return '';
  
  const normalized = serviceType.toLowerCase().trim();
  
  if (validTypes.includes(normalized)) {
    return normalized;
  }
  
  return '';
};

/**
 * Validate title (2-100 characters)
 */
export const validateTitle = (title) => {
  const sanitized = sanitizeText(title);
  if (sanitized.length < 2) {
    return { valid: false, error: 'Le titre doit contenir au moins 2 caractères', value: '' };
  }
  if (sanitized.length > 100) {
    return { valid: false, error: 'Le titre ne peut pas dépasser 100 caractères', value: sanitized.substring(0, 100) };
  }
  return { valid: true, error: null, value: sanitized };
};

/**
 * Validate description (10-2000 characters)
 */
export const validateDescription = (description) => {
  const sanitized = sanitizeText(description);
  if (sanitized.length < 10) {
    return { valid: false, error: 'La description doit contenir au moins 10 caractères', value: '' };
  }
  if (sanitized.length > 2000) {
    return { valid: false, error: 'La description ne peut pas dépasser 2000 caractères', value: sanitized.substring(0, 2000) };
  }
  return { valid: true, error: null, value: sanitized };
};

/**
 * Validate location (2-200 characters)
 */
export const validateLocation = (location) => {
  const sanitized = sanitizeText(location);
  if (sanitized.length < 2) {
    return { valid: false, error: 'La localisation doit contenir au moins 2 caractères', value: '' };
  }
  if (sanitized.length > 200) {
    return { valid: false, error: 'La localisation ne peut pas dépasser 200 caractères', value: sanitized.substring(0, 200) };
  }
  return { valid: true, error: null, value: sanitized };
};

/**
 * Validate price (0 or positive number)
 */
export const validatePrice = (price) => {
  const sanitized = sanitizePrice(price);
  if (sanitized === '' && price !== '' && price !== null && price !== undefined) {
    return { valid: false, error: 'Le prix doit être un nombre valide', value: '' };
  }
  return { valid: true, error: null, value: sanitized };
};

/**
 * Validate email (optional field)
 */
export const validateEmail = (email) => {
  if (!email || email.trim() === '') {
    return { valid: true, error: null, value: '' }; // Optional field
  }
  
  const sanitized = sanitizeEmail(email);
  if (!sanitized) {
    return { valid: false, error: 'Format d\'email invalide', value: '' };
  }
  
  return { valid: true, error: null, value: sanitized };
};

/**
 * Validate phone (optional field) - must be exactly 10 digits
 */
export const validatePhone = (phone) => {
  if (!phone || phone.trim() === '') {
    return { valid: true, error: null, value: '' }; // Optional field
  }
  
  const sanitized = sanitizePhone(phone);
  if (sanitized.length !== 10) {
    return { valid: false, error: 'Le numéro de téléphone doit contenir exactement 10 chiffres', value: sanitized };
  }
  
  return { valid: true, error: null, value: sanitized };
};

/**
 * Validate image file
 */
export const validateImageFile = (file) => {
  if (!file) {
    return { valid: false, error: 'Aucun fichier sélectionné' };
  }
  
  // Check file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (!validTypes.includes(file.type)) {
    return { valid: false, error: 'Le fichier doit être une image (JPEG, PNG, WebP ou GIF)' };
  }
  
  // Check file size (5MB max)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return { valid: false, error: 'L\'image ne peut pas dépasser 5MB' };
  }
  
  return { valid: true, error: null };
};

