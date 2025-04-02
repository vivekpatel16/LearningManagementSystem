// API URLs configuration
const API_CONFIG = {
  // Base URL for API calls - ensure it doesn't end with a slash and uses HTTPS
  BASE_URL: (import.meta.env.VITE_API_BASE_URL || "https://learningmanagementsystem-2-bj3z.onrender.com")
    .replace(/\/$/, "")  // Remove trailing slash if present
    .replace(/^http:/, "https:"), // Force HTTPS
  
  // API endpoints - ensure they start with a slash
  ENDPOINTS: {
    USERS: "/api/users",
    COURSES: "/api/courses",
    ADMIN: "/api/admin",
    WISHLIST: "/api/wishlist",
  }
};

// Log the configuration
console.log("API Configuration loaded:", {
  baseUrl: API_CONFIG.BASE_URL,
  usersEndpoint: API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.USERS
});

export default API_CONFIG; 