import axiosClient from './axiosClient';
import { BACKEND_URL, getApiUrl, getResourceUrl } from '../utils/apiUtils';

const handleApiError = (error, operation) => {
  console.error(`Course API error (${operation}):`, error);
  
  if (error.response) {
    console.error(`Status: ${error.response.status}, Data:`, error.response.data);
  } else if (error.request) {
    console.error('No response received:', error.request);
  }
  
  throw error;
};

const courseApi = {
  // Course listing
  getAllCourses: async () => {
    try {
      console.log('Fetching all courses');
      const response = await axiosClient.get('/api/courses');
      return response.data;
    } catch (error) {
      return handleApiError(error, 'getAllCourses');
    }
  },
  
  getCoursesByCategory: async (categoryId) => {
    try {
      console.log(`Fetching courses for category: ${categoryId}`);
      const response = await axiosClient.get(`/api/courses/category/${categoryId}`);
      return response.data;
    } catch (error) {
      return handleApiError(error, 'getCoursesByCategory');
    }
  },
  
  // Course details
  getCourseDetails: async (courseId) => {
    try {
      console.log(`Fetching details for course: ${courseId}`);
      const response = await axiosClient.get(`/api/courses/${courseId}`);
      return response.data;
    } catch (error) {
      return handleApiError(error, 'getCourseDetails');
    }
  },
  
  // Video progress
  getVideoProgress: async (userId, courseId, videoId) => {
    try {
      console.log(`Fetching video progress - User: ${userId}, Course: ${courseId}, Video: ${videoId}`);
      const url = `/api/courses/video/progress/${userId}/${courseId}/${videoId}`;
      console.log('Progress URL:', getApiUrl(url));
      const response = await axiosClient.get(url);
      return response.data;
    } catch (error) {
      return handleApiError(error, 'getVideoProgress');
    }
  },
  
  saveVideoProgress: async (progressData) => {
    try {
      console.log('Saving video progress:', progressData);
      const response = await axiosClient.post('/api/courses/video/progress', progressData);
      return response.data;
    } catch (error) {
      return handleApiError(error, 'saveVideoProgress');
    }
  },
  
  // Direct fetch methods as fallbacks
  directGetVideoProgress: async (userId, courseId, videoId) => {
    try {
      console.log(`Direct fetch for video progress - User: ${userId}, Course: ${courseId}, Video: ${videoId}`);
      
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      
      const url = `${BACKEND_URL}/api/courses/video/progress/${userId}/${courseId}/${videoId}`;
      console.log('Direct progress URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch progress: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Direct video progress fetch error:', error);
      throw error;
    }
  },
  
  directSaveVideoProgress: async (progressData) => {
    try {
      console.log('Direct save for video progress:', progressData);
      
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      
      const url = `${BACKEND_URL}/api/courses/video/progress`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(progressData)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save progress: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Direct save progress error:', error);
      throw error;
    }
  },
  
  // Helper for video URLs
  getVideoUrl: (videoPath) => {
    return getResourceUrl(videoPath);
  }
};

export default courseApi;
