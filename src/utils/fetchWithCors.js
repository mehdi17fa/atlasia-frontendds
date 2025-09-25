// Utility function for making fetch requests with proper CORS configuration
export const fetchWithCors = async (url, options = {}) => {
  const defaultOptions = {
    credentials: 'include', // Important for CORS with credentials
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers
    },
    ...options
  };

  // Add Authorization header if token is available
  const token = localStorage.getItem('accessToken');
  if (token && !defaultOptions.headers.Authorization) {
    defaultOptions.headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, defaultOptions);
    
    // Log CORS-related issues
    if (!response.ok) {
      console.error('Fetch request failed:', {
        url,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });
    }
    
    return response;
  } catch (error) {
    console.error('Fetch request error:', {
      url,
      error: error.message,
      name: error.name
    });
    throw error;
  }
};

// Wrapper for common JSON requests
export const fetchJSON = async (url, options = {}) => {
  const response = await fetchWithCors(url, options);
  
  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorData || response.statusText}`);
  }
  
  return response.json();
};
