import API_CONFIG from "../config/apiConfig";

/**
 * Get the full API URL from a relative endpoint path
 * @param {string} path - Relative API path (e.g., "/api/courses/category")
 * @returns {string} - Full API URL
 */
export const getApiUrl = (path) => {
  // Handle paths that might already include /api
  const apiPath = path.startsWith('/api') 
    ? path 
    : `/api${path.startsWith('/') ? path : `/${path}`}`;
    
  const fullUrl = `${API_CONFIG.BASE_URL}${apiPath}`;
  console.log(`API URL: ${fullUrl}`);
  return fullUrl;
};

/**
 * Convert a local backend path to a full URL (for video sources, etc.)
 * @param {string} path - Local path (e.g., "/uploads/videos/video.mp4")
 * @returns {string} - Full URL to the resource
 */
export const getResourceUrl = (path) => {
  if (!path) return null;
  
  // Remove leading slash if present
  const formattedPath = path.replace(/^\//, '');
  const fullUrl = `${API_CONFIG.BASE_URL}/${formattedPath}`;
  console.log(`Resource URL: ${fullUrl}`);
  return fullUrl;
}; 