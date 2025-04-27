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
    } else if (error.request) {
      console.error(`No response received for request to ${error.config.url}`);
    } else {
      console.error(`Error setting up request to ${error.config?.url}:`, error.message);
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
