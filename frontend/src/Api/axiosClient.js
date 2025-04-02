import axios from 'axios';
import API_CONFIG from '../config/apiConfig';

// Create a custom axios instance for API requests
const axiosClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Add a request interceptor to handle CORS
axiosClient.interceptors.request.use(
  (config) => {
    // Add CORS headers to request
    config.headers['Access-Control-Allow-Origin'] = '*';
    
    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    console.log('Request URL:', config.url);
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor for better error handling
axiosClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API error:', error.message);
    
    // Handle different types of errors
    if (error.response) {
      // The request was made and the server responded with an error status
      console.error('Response error data:', error.response.data);
      console.error('Response error status:', error.response.status);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request
      console.error('Request setup error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default axiosClient; 