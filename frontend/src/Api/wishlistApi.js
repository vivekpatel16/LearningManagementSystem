import axios from "axios";
import { store } from "../features/auth/store";
import { logout } from "../features/auth/authSlice";
import API_CONFIG from "../config/apiConfig";

const Wishlist_API = axios.create({ 
  baseURL: `${API_CONFIG.BASE_URL}${API_CONFIG.WISHLIST}` 
});

Wishlist_API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

// Add response interceptor to handle token expiration
Wishlist_API.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check if error is due to unauthorized access (token expired)
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Dispatch logout action
      store.dispatch(logout());
      
      // Redirect to login page
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export default Wishlist_API; 
