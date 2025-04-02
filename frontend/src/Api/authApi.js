import axios from "axios";
import API_CONFIG from "../config/apiConfig";

// Create a dedicated auth API instance
const AUTH_API_URL = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USERS}`;

console.log("Auth API URL:", AUTH_API_URL);

// Direct authentication functions
export const loginApi = async (credentials) => {
  console.log("Attempting login to:", `${AUTH_API_URL}/login`);
  
  try {
    const response = await axios.post(`${AUTH_API_URL}/login`, credentials, {
      headers: { "Content-Type": "application/json" },
    });
    
    console.log("Login response status:", response.status);
    return response.data;
  } catch (error) {
    console.error("Login error:", error.message);
    if (error.response) {
      console.error("Login error status:", error.response.status);
      console.error("Login error data:", error.response.data);
    }
    throw error;
  }
};

export const checkAuthApi = async (token) => {
  console.log("Checking authentication with token");
  
  try {
    const response = await axios.get(`${AUTH_API_URL}/verify-auth`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    console.log("Auth verification response:", response.status);
    return response.data;
  } catch (error) {
    console.error("Auth verification error:", error.message);
    throw error;
  }
};

export const resetPasswordRequestApi = async (email) => {
  console.log("Requesting password reset for:", email);
  
  try {
    const response = await axios.post(`${AUTH_API_URL}/forgot-password`, { email });
    console.log("Password reset request response:", response.status);
    return response.data;
  } catch (error) {
    console.error("Password reset request error:", error.message);
    throw error;
  }
};

export const verifyOtpApi = async (email, otp) => {
  try {
    const response = await axios.post(`${AUTH_API_URL}/verify-otp`, { email, otp });
    return response.data;
  } catch (error) {
    console.error("OTP verification error:", error.message);
    throw error;
  }
};

export const resetPasswordApi = async (email, otp, password) => {
  try {
    const response = await axios.post(`${AUTH_API_URL}/reset-password`, { 
      email, 
      otp, 
      password 
    });
    return response.data;
  } catch (error) {
    console.error("Password reset error:", error.message);
    throw error;
  }
}; 