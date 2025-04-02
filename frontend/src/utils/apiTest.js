import axios from 'axios';
import API_CONFIG from '../config/apiConfig';

/**
 * Test connectivity to the API server
 * @returns {Promise<boolean>} - True if connection was successful
 */
export const testApiConnection = async () => {
  console.log('Testing API connection to:', API_CONFIG.BASE_URL);
  
  try {
    // Simple GET request to a lightweight endpoint
    const response = await axios.get(`${API_CONFIG.BASE_URL}/api/healthcheck`, {
      timeout: 5000 // 5 second timeout
    });
    
    console.log('API connection successful:', response.status);
    return true;
  } catch (error) {
    console.error('API connection failed:', error.message);
    
    // Log more detailed error information
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
      console.error('Error response headers:', error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error setting up request:', error.message);
    }
    
    return false;
  }
}; 