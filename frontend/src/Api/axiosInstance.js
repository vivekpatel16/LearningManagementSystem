import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "https://learningmanagementsystem-2-bj3z.onrender.com/api", // Replace with your backend URL
  withCredentials: true, // If you're using authentication
});

export default axiosInstance;
