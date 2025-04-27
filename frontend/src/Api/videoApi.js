import axiosInstance from "./axiosInstance";
import { store } from "../features/auth/store";
import { logout } from "../features/auth/authSlice";
import axios from "axios";

const Video_API = axios.create({ baseURL: `${axiosInstance.defaults.baseURL}/courses` });

Video_API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

// Add response interceptor to handle token expiration
Video_API.interceptors.response.use(
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

/**
 * Upload a new video
 * @param {FormData} formData - FormData containing video, title, description, chapter_id
 * @param {Function} onProgress - Progress callback function
 * @returns {Promise} - API response
 */
const uploadVideo = async (formData, onProgress) => {
  try {
    // Check if the formData contains a thumbnail field and handle it properly
    const hasOriginalThumbnail = formData.has('thumbnail');
    
    // If there's a thumbnail field, we need to extract it and send it as video_thumbnail
    // because the Multer configuration doesn't expect a 'thumbnail' field
    if (hasOriginalThumbnail) {
      const thumbnail = formData.get('thumbnail');
      formData.delete('thumbnail');
      
      // If it's a file, convert to base64
      if (thumbnail instanceof File) {
        const base64Thumbnail = await fileToBase64(thumbnail);
        formData.append('video_thumbnail', base64Thumbnail);
      } else if (typeof thumbnail === 'string' && thumbnail.startsWith('data:')) {
        // If it's already a base64 string, use it directly
        formData.append('video_thumbnail', thumbnail);
      }
    }
    
    const config = {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
      timeout: 600000 // 10 minutes
    };
    
    const response = await Video_API.post('/video', formData, config);
    return response.data;
  } catch (error) {
    console.error('Error uploading video:', error);
    throw error;
  }
};

/**
 * Update an existing video
 * @param {string} videoId - Video ID
 * @param {FormData} formData - FormData containing video, title, description, chapter_id
 * @param {Function} onProgress - Progress callback function
 * @returns {Promise} - API response
 */
const updateVideo = async (videoId, formData, onProgress) => {
  try {
    // Check if the formData contains a thumbnail field and handle it properly
    const hasOriginalThumbnail = formData.has('thumbnail');
    
    // If there's a thumbnail field, we need to extract it and send it as video_thumbnail
    if (hasOriginalThumbnail) {
      const thumbnail = formData.get('thumbnail');
      formData.delete('thumbnail');
      
      // If it's a file, convert to base64
      if (thumbnail instanceof File) {
        const base64Thumbnail = await fileToBase64(thumbnail);
        formData.append('video_thumbnail', base64Thumbnail);
      } else if (typeof thumbnail === 'string' && thumbnail.startsWith('data:')) {
        // If it's already a base64 string, use it directly
        formData.append('video_thumbnail', thumbnail);
      }
    }
    
    const config = {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
      timeout: 600000 // 10 minutes
    };
    
    const response = await Video_API.patch(`/video/${videoId}`, formData, config);
    return response.data;
  } catch (error) {
    console.error(`Error updating video ${videoId}:`, error);
    throw error;
  }
};

/**
 * Delete a video
 * @param {string} videoId - Video ID
 * @returns {Promise} - API response
 */
const deleteVideo = async (videoId) => {
  try {
    const response = await Video_API.delete(`/video/${videoId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting video ${videoId}:`, error);
    throw error;
  }
};

/**
 * Get videos by chapter
 * @param {string} chapterId - Chapter ID
 * @returns {Promise} - API response
 */
const getVideosByChapter = async (chapterId) => {
  try {
    const response = await Video_API.get(`/video/${chapterId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching videos for chapter ${chapterId}:`, error);
    throw error;
  }
};

/**
 * Get all chapter content including videos using ChapterContent API
 * @param {string} chapterId - Chapter ID
 * @returns {Promise} - Returns all content for the chapter with details
 */
const getChapterContent = async (chapterId) => {
  try {
    const response = await axiosInstance.get(`/chapter-content/chapter/${chapterId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    // The API returns data in format { success: true, contents: [...] }
    if (response.data && response.data.success) {
      return response.data.contents;
    }
    
    // If no specific success structure, return the whole data
    return response.data;
  } catch (error) {
    console.error(`Error fetching chapter content for chapter ${chapterId}:`, error);
    throw error;
  }
};

/**
 * Get only video content from a chapter using ChapterContent API
 * @param {string} chapterId - Chapter ID
 * @returns {Promise} - Returns only video content for the chapter
 */
const getVideoContentByChapter = async (chapterId) => {
  try {
    const response = await getChapterContent(chapterId);
    
    // Filter to only include videos (content_type_ref === 'VideoInfo')
    const videoContent = response.filter(item => item.content_type_ref === 'VideoInfo');
    
    return videoContent.map(item => ({
      ...item.contentDetails,
      order: item.order
    }));
  } catch (error) {
    console.error(`Error fetching video content for chapter ${chapterId}:`, error);
    throw error;
  }
};

/**
 * Convert a file to base64 string
 * @param {File} file - The file to convert
 * @returns {Promise<string>} - Base64 string
 */
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

export { 
  uploadVideo, 
  updateVideo, 
  deleteVideo, 
  getVideosByChapter,
  getChapterContent,
  getVideoContentByChapter
};
export default Video_API; 