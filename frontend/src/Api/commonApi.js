import axios from "axios";
import { store } from "../features/auth/store";
import { logout } from "../features/auth/authSlice";
import API_CONFIG from "../config/apiConfig";

console.log("API Base URL:", API_CONFIG.BASE_URL);

const common_API = axios.create({ 
  baseURL: `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USERS}` 
});

// Log the full baseURL for debugging
console.log("Common API BaseURL:", `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USERS}`);

// Flag to prevent multiple redirects
let isRedirecting = false;

// Enhanced request interceptor with local token validation
common_API.interceptors.request.use((req) => {
  // Skip validation for login and public endpoints
  if (req.url === "/login" || 
      req.url === "/check-email" || 
      req.url === "/verify-otp" || 
      req.url === "/reset-password") {
    return req;
  }
  
  const token = localStorage.getItem("token");
  const storedUser = localStorage.getItem("user");
  
  if (token && storedUser) {
    try {
      // Perform basic token validation
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      
      // Basic expiration check
      const currentTime = Math.floor(Date.now() / 1000);
      if (tokenPayload.exp && tokenPayload.exp < currentTime) {
        console.error("Token expired");
        // Don't throw - let the request proceed and be rejected by server
        // This avoids redirect loops
      }
      
      // Add token to header
      req.headers.Authorization = `Bearer ${token}`;
    } catch (error) {
      // Only log invalid tokens, don't redirect to prevent loops
      console.error("Invalid token format:", error);
    }
  }
  
  return req;
}, (error) => {
  // If request interceptor throws an error, reject the promise
  return Promise.reject(error);
});

// Add response interceptor to handle token expiration
common_API.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check if error is due to unauthorized access (token expired)
    if (!isRedirecting && error.response && (error.response.status === 401 || error.response.status === 403)) {
      isRedirecting = true;
      
      console.log("Authentication error detected, redirecting to login page");
      
      // Clear localStorage directly to prevent any manipulation
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      
      // Dispatch logout action
      store.dispatch(logout());
      
      // Redirect to login page with a hard refresh
      window.location.href = "/";
      
      // Reset flag after redirect attempt
      setTimeout(() => {
        isRedirecting = false;
      }, 1000);
      
      // Show message to user
      console.error("Session expired or unauthorized access. Please login again.");
    }
    return Promise.reject(error);
  }
);

export default common_API;