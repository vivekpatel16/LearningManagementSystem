import axios from 'axios';
import API_CONFIG from '../config/apiConfig';
import { BACKEND_URL } from '../utils/apiUtils';

// Create an axios instance with production URL
const axiosClient = axios.create({
  baseURL: BACKEND_URL, // Use direct backend URL
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 second timeout
});

// Request interceptor for adding the auth token
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    console.log(`Making ${config.method.toUpperCase()} request to: ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors
axiosClient.interceptors.response.use(
  (response) => {
    console.log(`Successful response from: ${response.config.url}`);
    return response;
  },
  (error) => {
    if (error.response) {
      console.error('Response error:', error.response.status, error.response.data);
      
      // Handle auth errors
      if (error.response.status === 401 || error.response.status === 403) {
        console.log('Authentication error - clearing local storage');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Don't redirect here, let the component handle it
      }
    } else if (error.request) {
      console.error('Network error - no response received:', error.request);
    } else {
      console.error('Error creating request:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default axiosClient; 