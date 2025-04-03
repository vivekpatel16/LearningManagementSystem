/**
 * API Configuration
 * Production API URL is enforced for all environments
 */

// Force production URL for all environments
const PROD_URL = "https://learningmanagementsystem-2-bj3z.onrender.com";

// Base URL without trailing slash
const BASE_URL = PROD_URL.replace(/\/$/, '');

// Enforce HTTPS
const SECURE_URL = BASE_URL.replace(/^http:/, 'https:');

const API_CONFIG = {
  BASE_URL: SECURE_URL,
  USERS_ENDPOINT: `${SECURE_URL}/api/users`,
  COURSES_ENDPOINT: `${SECURE_URL}/api/courses`,
  CATEGORIES_ENDPOINT: `${SECURE_URL}/api/courses/category`,
  CART_ENDPOINT: `${SECURE_URL}/api/cart`,
  WISHLIST_ENDPOINT: `${SECURE_URL}/api/wishlist`,
  VIDEO_PROGRESS_ENDPOINT: `${SECURE_URL}/api/courses/video/progress`,
};

console.log("API Config loaded:", { 
  baseUrl: API_CONFIG.BASE_URL,
  usersEndpoint: API_CONFIG.USERS_ENDPOINT 
});

export default API_CONFIG; 