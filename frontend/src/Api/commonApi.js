import axiosInstance from "./axiosInstance";
import { store } from "../features/auth/store";
import { logout } from "../features/auth/authSlice";
import axios from "axios";
const common_API = axios.create({ baseURL: `${axiosInstance.defaults.baseURL}/users` });

// Flag to prevent multiple redirects
let isRedirecting = false;
let isRefreshing = false;

// Enhanced request interceptor with local token validation
common_API.interceptors.request.use((req) => {
  // Skip validation for login and public endpoints
  if (req.url === "/login" || 
      req.url === "/check-email" || 
      req.url === "/verify-otp" || 
      req.url === "/reset-password" ||
      req.url === "/refresh-token") {
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
  async (error) => {
    const originalRequest = error.config;
    
    // Check if error is due to unauthorized access (token expired)
    if (!isRedirecting && error.response && (error.response.status === 401 || error.response.status === 403)) {
      // If we're already trying to refresh the token, don't try again
      if (isRefreshing) {
        return Promise.reject(error);
      }
      
      isRefreshing = true;
      
      try {
        // Try to refresh the token
        const refreshToken = localStorage.getItem("refreshToken");
        if (refreshToken) {
          const response = await common_API.post("/refresh-token", { refreshToken });
          const { token, user } = response.data;
          
          // Update the tokens
          localStorage.setItem("token", token);
          localStorage.setItem("user", JSON.stringify(user));
          
          // Update the authorization header
          originalRequest.headers.Authorization = `Bearer ${token}`;
          
          // Retry the original request
          isRefreshing = false;
          return common_API(originalRequest);
        }
      } catch (refreshError) {
        console.error("Failed to refresh token:", refreshError);
      }
      
      // If refresh failed or no refresh token, only logout if explicitly requested
      if (error.config.url === "/verify-auth") {
        isRedirecting = true;
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        store.dispatch(logout());
        window.location.href = "/";
        setTimeout(() => {
          isRedirecting = false;
        }, 1000);
      }
      
      isRefreshing = false;
    }
    return Promise.reject(error);
  }
);

export default common_API;
