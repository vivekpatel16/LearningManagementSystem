import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "https://learningmanagementsystem-2-bj3z.onrender.com/api", // Replace with your backend URL
  withCredentials: true, // If you're using authentication
  timeout: 30000, // Increase timeout to 30 seconds
});

// Add a request interceptor to include the token with every request
axiosInstance.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem("token");
    
    // If token exists, add it to the request headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      // console.log(`Request to ${config.url} with token: ${token.substring(0, 15)}...`);
    } else {
      console.warn(`Request to ${config.url} without token!`);
    }
    
    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to log errors
axiosInstance.interceptors.response.use(
  (response) => {
    // console.log(`Response from ${response.config.url}: Status ${response.status}`);
    return response;
  },
  (error) => {
    if (error.response) {
      console.error(`Error response from ${error.config.url}:`, error.response.status, error.response.data);
      
      // Add special handling for assessment API errors
      if (error.config.url.includes('/assessment')) {
        // Handle 403 errors
        if (error.response.status === 403) {
          const errorMsg = error.response.data?.message || '';
          
          if (errorMsg.includes('not currently available')) {
            error.assessmentUnavailable = true;
            error.userFriendlyMessage = 'This quiz is not currently available. Please contact your instructor.';
          }
          else if (errorMsg.includes('maximum number of attempts')) {
            error.maxAttemptsReached = true;
            error.userFriendlyMessage = 'You have reached the maximum number of attempts for this quiz.';
          }
          else if (errorMsg.includes('Not authorized')) {
            error.notAuthorized = true;
            error.userFriendlyMessage = 'You do not have permission to access this quiz.';
          }
        }
        // Handle 404 errors
        else if (error.response.status === 404) {
          error.notFound = true;
          error.userFriendlyMessage = 'Quiz not found. It may have been deleted or moved.';
        }
      }
    } else if (error.request) {
      console.error(`No response received for request to ${error.config.url}`);
      error.userFriendlyMessage = 'No response from server. Please check your internet connection.';
    } else {
      console.error(`Error setting up request to ${error.config?.url}:`, error.message);
      error.userFriendlyMessage = 'An error occurred while preparing your request.';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
