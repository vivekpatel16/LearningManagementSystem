import axiosInstance from "./axiosInstance";
import { store } from "../features/auth/store";
import { logout } from "../features/auth/authSlice";
import axios from "axios";

const Dashboard_API = axios.create({ baseURL: `${axiosInstance.defaults.baseURL}/admin-dashboard` });

Dashboard_API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

// Add response interceptor to handle token expiration
Dashboard_API.interceptors.response.use(
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

// Dashboard API functions
const getDashboardStats = async () => {
  try {
    const response = await Dashboard_API.get('/stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
};

const getLearningActivity = async () => {
  try {
    const response = await Dashboard_API.get('/learning-activity');
    return response.data;
  } catch (error) {
    console.error('Error fetching learning activity:', error);
    throw error;
  }
};

const getCategoryEnrollments = async () => {
  try {
    const response = await Dashboard_API.get('/category-enrollments');
    return response.data;
  } catch (error) {
    console.error('Error fetching category enrollments:', error);
    throw error;
  }
};

export { getDashboardStats, getLearningActivity, getCategoryEnrollments };
export default Dashboard_API; 