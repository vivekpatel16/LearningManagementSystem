import axiosInstance from "./axiosInstance";
import { store } from "../features/auth/store";
import { logout } from "../features/auth/authSlice";
import axios from "axios";

// Use the base URL from axiosInstance to stay consistent
const Quiz_API = axios.create({ 
  baseURL: `${axiosInstance.defaults.baseURL}/assessment`,
  timeout: 30000, // Increase timeout to 30 seconds
});

// Add request interceptor to include token in headers
Quiz_API.interceptors.request.use((req) => {
  // Get token from localStorage
  const token = localStorage.getItem("token");
  
  // If token exists, add it to the request headers
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
    console.log(`Quiz API Request to ${req.url}`);
    console.log(`Using token: ${token.substring(0, 15)}...`);
  } else {
    console.warn(`Quiz API Request to ${req.url} without token!`);
  }
  
  return req;
}, (error) => {
  console.error("Quiz API request error:", error);
  return Promise.reject(error);
});

// Add response interceptor to handle token expiration
Quiz_API.interceptors.response.use(
  (response) => {
    console.log(`Quiz API Response from ${response.config.url}: Status ${response.status}`);
    return response;
  },
  (error) => {
    // Log detailed error information
    if (error.response) {
      console.error(`Quiz API Error response from ${error.config.url}:`, 
                    error.response.status, error.response.data);
      
      // Check if error is due to unauthorized access (token expired)
      if (error.response.status === 401 || error.response.status === 403) {
        // Dispatch logout action
        store.dispatch(logout());
        
        // Redirect to login page
        window.location.href = "/";
      }
    } else if (error.request) {
      console.error(`Quiz API No response received for request to ${error.config.url}`);
    } else {
      console.error(`Quiz API Error setting up request to ${error.config?.url}:`, error.message);
    }
    
    return Promise.reject(error);
  }
);

/**
 * Create a minimal quiz with just title and description
 * @param {Object} quizData - Object containing title and description
 * @returns {Promise} - API response
 */
const createMinimalQuiz = async (quizData) => {
  try {
    // Add default passing score if not provided
    const quizDataWithDefaults = {
      ...quizData,
      passing_score: quizData.passing_score || 70
    };
    const response = await Quiz_API.post('/create-minimal', quizDataWithDefaults);
    return response.data;
  } catch (error) {
    console.error('Error creating minimal quiz:', error);
    throw error;
  }
};

/**
 * Create a complete quiz with questions
 * @param {Object} quizData - Object containing quiz details and questions
 * @returns {Promise} - API response
 */
const createQuiz = async (quizData) => {
  try {
    console.log("Making POST request to create quiz");
    console.log("API URL:", Quiz_API.defaults.baseURL);
    console.log("Quiz data:", JSON.stringify(quizData, null, 2));
    
    const response = await Quiz_API.post('/', quizData);
    console.log("Quiz API response:", response);
    return response.data;
  } catch (error) {
    console.error('Error creating quiz:', error);
    
    if (error.response) {
      // Server responded with an error
      console.error('Server response status:', error.response.status);
      console.error('Server response headers:', error.response.headers);
      console.error('Server response data:', JSON.stringify(error.response.data, null, 2));
      
      // If there's an error message in the response, extract and throw it
      if (error.response.data && error.response.data.message) {
        throw new Error(error.response.data.message);
      }
    } else if (error.request) {
      // Request was made but no response was received
      console.error('No response received from server:', error.request);
      throw new Error('No response from server. Please check your connection.');
    } else {
      // Something else happened while setting up the request
      console.error('Error setting up request:', error.message);
    }
    
    throw error;
  }
};

/**
 * Get a quiz by ID
 * @param {string} quizId - Quiz ID
 * @returns {Promise} - API response
 */
const getQuiz = async (quizId) => {
  try {
    const response = await Quiz_API.get(`/${quizId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching quiz ${quizId}:`, error);
    throw error;
  }
};

/**
 * Update a quiz
 * @param {string} quizId - Quiz ID
 * @param {Object} quizData - Object containing updated quiz details
 * @returns {Promise} - API response
 */
const updateQuiz = async (quizId, quizData) => {
  try {
    const response = await Quiz_API.put(`/${quizId}`, quizData);
    return response.data;
  } catch (error) {
    console.error(`Error updating quiz ${quizId}:`, error);
    throw error;
  }
};

/**
 * Delete a quiz
 * @param {string} quizId - Quiz ID
 * @returns {Promise} - API response
 */
const deleteQuiz = async (quizId) => {
  try {
    const response = await Quiz_API.delete(`/${quizId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting quiz ${quizId}:`, error);
    throw error;
  }
};

/**
 * Reorder questions in a quiz
 * @param {string} quizId - Quiz ID
 * @param {Array} questionOrder - Array of question IDs in the desired order
 * @returns {Promise} - API response
 */
const reorderQuestions = async (quizId, questionOrder) => {
  try {
    const response = await Quiz_API.put(`/${quizId}/reorder-questions`, { questionOrder });
    return response.data;
  } catch (error) {
    console.error(`Error reordering questions for quiz ${quizId}:`, error);
    throw error;
  }
};

/**
 * Get attempts for a quiz by a user
 * @param {string} quizId - Quiz ID
 * @param {string} courseId - Course ID
 * @param {string} chapterId - Chapter ID
 * @returns {Promise} - API response
 */
const getQuizAttempts = async (quizId, courseId, chapterId) => {
  try {
    const response = await Quiz_API.get(`/${quizId}/attempts?courseId=${courseId}&chapterId=${chapterId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching attempts for quiz ${quizId}:`, error);
    throw error;
  }
};

/**
 * Update a quiz with PATCH (partial update)
 * @param {string} quizId - Quiz ID
 * @param {Object} quizData - Object containing partial quiz updates
 * @returns {Promise} - API response
 */
const patchQuiz = async (quizId, quizData) => {
  try {
    console.log("Making PATCH request to update quiz");
    console.log("API URL:", `${Quiz_API.defaults.baseURL}/${quizId}`);
    console.log("Quiz data:", JSON.stringify(quizData, null, 2));
    
    const response = await Quiz_API.patch(`/${quizId}`, quizData);
    console.log("Quiz API patch response:", response);
    return response.data;
  } catch (error) {
    console.error(`Error patching quiz ${quizId}:`, error);
    
    if (error.response) {
      // Server responded with an error
      console.error('Server response status:', error.response.status);
      console.error('Server response headers:', error.response.headers);
      console.error('Server response data:', JSON.stringify(error.response.data, null, 2));
      
      // If there's an error message in the response, extract and throw it
      if (error.response.data && error.response.data.message) {
        throw new Error(error.response.data.message);
      }
    } else if (error.request) {
      // Request was made but no response was received
      console.error('No response received from server:', error.request);
      throw new Error('No response from server. Please check your connection.');
    } else {
      // Something else happened while setting up the request
      console.error('Error setting up request:', error.message);
    }
    
    throw error;
  }
};

export {
  createMinimalQuiz,
  createQuiz,
  getQuiz,
  updateQuiz,
  deleteQuiz,
  reorderQuestions,
  getQuizAttempts,
  patchQuiz
};

export default Quiz_API; 