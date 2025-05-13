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
    const response = await Document_API.get(`/${documentId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching document ${documentId}:`, error);
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

export { 
  uploadDocument, 
  getDocument, 
  updateDocument, 
  deleteDocument, 
  trackDocumentProgress, 
  getDocumentProgress 
};
export default Document_API; 