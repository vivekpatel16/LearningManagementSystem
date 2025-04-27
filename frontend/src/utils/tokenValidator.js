/**
 * Validates a JWT token structure
 * @param {string} token - The JWT token to validate
 * @returns {object} - { isValid: boolean, payload?: object, error?: string }
 */
export const validateToken = (token) => {
  // Check if token exists
  if (!token) {
    return { isValid: false, error: 'No token provided' };
  }

  // Check if token has the correct format (3 parts separated by dots)
  const parts = token.split('.');
  if (parts.length !== 3) {
    return { isValid: false, error: 'Token does not have three parts' };
  }

  try {
    // Decode the payload (middle part)
    const payload = JSON.parse(atob(parts[1]));
    
    // Check for required fields
    if (!payload.id) {
      return { isValid: false, error: 'Token missing user ID' };
    }
    
    if (!payload.role) {
      return { isValid: false, error: 'Token missing user role' };
    }
    
    // Check for token expiration
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return { isValid: false, error: 'Token has expired' };
    }
    
    return { isValid: true, payload };
  } catch (error) {
    return { isValid: false, error: 'Failed to decode token: ' + error.message };
  }
};

/**
 * Validates the stored token in localStorage
 * @returns {object} - { isValid: boolean, payload?: object, error?: string }
 */
export const validateStoredToken = () => {
  const token = localStorage.getItem('token');
  return validateToken(token);
};

/**
 * Logs the current token info to console (for debugging)
 */
export const debugToken = () => {
  const result = validateStoredToken();
  
  if (result.isValid) {
    console.log('Token is valid:', result.payload);
    
    // Calculate expiration time if available
    if (result.payload.exp) {
      const expDate = new Date(result.payload.exp * 1000);
      const now = new Date();
      const minutesRemaining = Math.round((expDate - now) / 60000);
      
      console.log(`Token expires: ${expDate.toLocaleString()}`);
      console.log(`Time remaining: ${minutesRemaining} minutes`);
    }
  } else {
    console.error('Token is invalid:', result.error);
  }
  
  return result;
}; 