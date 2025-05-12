import axiosInstance from "./axiosInstance";
import { store } from "../features/auth/store";
import { logout } from "../features/auth/authSlice";
import axios from "axios";

const Document_API = axios.create({ baseURL: `${axiosInstance.defaults.baseURL}/documents` });

Document_API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

// Add response interceptor to handle token expiration
Document_API.interceptors.response.use(
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

// Document API functions
const uploadDocument = async (formData) => {
  try {
    const response = await Document_API.post('/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading document:', error);
    throw error;
  }
};

const getDocument = async (documentId) => {
  try {
    console.log(`Fetching document with ID: ${documentId}`);
    const response = await axiosInstance.get(`/documents/${documentId}`);
    console.log('Document data received:', response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching document:", error);
    throw error;
  }
};

const updateDocument = async (documentId, formData) => {
  try {
    const response = await Document_API.put(`/${documentId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });
    return response.data;
  } catch (error) {
    console.error(`Error updating document ${documentId}:`, error);
    throw error;
  }
};

const deleteDocument = async (documentId) => {
  try {
    const response = await Document_API.delete(`/${documentId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting document ${documentId}:`, error);
    throw error;
  }
};

const trackDocumentProgress = async (documentId, progressData) => {
  try {
    const response = await Document_API.post(`/${documentId}/progress`, progressData);
    return response.data;
  } catch (error) {
    console.error(`Error tracking document progress for ${documentId}:`, error);
    throw error;
  }
};

const getDocumentProgress = async (documentId, courseId, chapterId) => {
  try {
    const response = await Document_API.get(`/${documentId}/progress`, {
      params: { courseId, chapterId }
    });
    return response.data;
  } catch (error) {
    console.error(`Error getting document progress for ${documentId}:`, error);
    throw error;
  }
};

const getCourseDocuments = async (courseId) => {
  try {
    const response = await axiosInstance.get(`/courses/${courseId}/documents`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const getDocumentContent = async (documentId) => {
  try {
    const response = await axiosInstance.get(`/documents/${documentId}/content`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const getDocumentFromChapterContent = async (chapterContentId) => {
  try {
    console.log(`Fetching document from chapter content ID: ${chapterContentId}`);
    const response = await axiosInstance.get(`/chapter-content/${chapterContentId}`);
    console.log('Chapter content data received:', response.data);
    
    if (response.data && response.data.content_type_ref === 'Document') {
      return response.data.contentDetails;
    } else {
      throw new Error('Invalid content type or document not found');
    }
  } catch (error) {
    console.error("Error fetching document from chapter content:", error);
    throw error;
  }
};

const formatPdfUrl = (url) => {
  if (!url) return '';
  
  // Get API base URL from axiosInstance defaults
  const apiBaseUrl = axiosInstance.defaults.baseURL || 'http://localhost:5000/api';
  // Extract server URL (remove /api if present)
  const serverBaseUrl = apiBaseUrl.replace(/\/api$/, '');
  
  // Handle upload paths directly - this is the key fix
  if (url.startsWith('uploads/') || url.includes('/uploads/')) {
    // Extract just the path part
    const pathOnly = url.includes('/uploads/') 
        ? url.substring(url.indexOf('/uploads/'))
        : '/uploads/' + url.replace('uploads/', '');
        
    // Prepend the server base URL (not the API URL)
    return `${serverBaseUrl}${pathOnly}`;
  }
  
  // If URL is already absolute (starts with http or https), return it as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // If URL is a relative path without leading slash, add it
  if (!url.startsWith('/')) {
    url = '/' + url;
  }
  
  // Use server base URL instead of window.location.origin
  return `${serverBaseUrl}${url}`;
};

export { 
  uploadDocument, 
  getDocument, 
  updateDocument, 
  deleteDocument, 
  trackDocumentProgress, 
  getDocumentProgress, 
  getCourseDocuments, 
  getDocumentContent, 
  getDocumentFromChapterContent, 
  formatPdfUrl 
};
export default Document_API; 