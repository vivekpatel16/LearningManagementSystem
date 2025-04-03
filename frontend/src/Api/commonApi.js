import axiosInstance from "./axiosInstance";
import { store } from "../features/auth/store";
import { logout } from "../features/auth/authSlice";
import axios from "axios";
const common_API = axios.create({ baseURL: `${axiosInstance.defaults.baseURL}/users` });

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
      
      // Clear localStorage directly to prevent any manipulation
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      
      // Dispatch logout action
      store.dispatch(logout());
      
      // Redirect to login page
      window.location.href = "/";
      
      // Reset flag after redirect (though this won't execute)
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
