import axios from 'axios';
import API_CONFIG from '../config/apiConfig';

/**
 * Test connectivity to the API server by pinging a valid endpoint
 * @returns {Promise<boolean>} - True if connection was successful
 */
export const testApiConnection = async () => {
  console.log('Testing API connection to:', API_CONFIG.BASE_URL);
  
  try {
    // Use the root domain to test connectivity, which should return at least a 404 
    // rather than using the non-existent healthcheck endpoint
    const response = await axios.get(`${API_CONFIG.BASE_URL}`, {
      timeout: 5000 // 5 second timeout
    });
    
    console.log('API connection successful:', response.status);
    return true;
  } catch (error) {
    // Even a 404 means the server is reachable
    if (error.response) {
      console.log('API connection successful (received response)', error.response.status);
      return true;
    }
    
    console.error('API connection failed:', error.message);
    
    // Log more detailed error information
    if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error setting up request:', error.message);
    }
    
    return false;
  }
}; 