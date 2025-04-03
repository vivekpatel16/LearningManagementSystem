
import axiosInstance from "./axiosInstance";
import { store } from "../features/auth/store";
import { logout } from "../features/auth/authSlice";
import axios from "axios";
const Courses_API = axios.create({ baseURL: `${axiosInstance.defaults.baseURL}/courses` });

Courses_API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

// Add response interceptor to handle token expiration
Courses_API.interceptors.response.use(
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

export default Courses_API;
