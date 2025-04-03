import axiosClient from "./axiosClient";
import { getApiUrl, BACKEND_URL } from "../utils/apiUtils";

/**
 * Direct functions for authentication using fetch instead of axios
 * to eliminate potential axios-related issues
 */

export const directLogin = async (credentials) => {
  console.log("Attempting direct login with fetch");
  
  try {
    const response = await fetch(`${BACKEND_URL}/api/users/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Login failed with status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Direct login error:", error);
    throw error;
  }
};

// Axios-based APIs for other auth operations
const authApi = {
  register: async (userData) => {
    try {
      console.log("Registering user:", userData.email);
      const response = await axiosClient.post(
        "/api/users/register",
        userData
      );
      return response.data;
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  },
  
  verifyToken: async () => {
    try {
      console.log("Verifying auth token");
      const response = await axiosClient.get("/api/users/verify");
      return response.data;
    } catch (error) {
      console.error("Token verification error:", error);
      throw error;
    }
  },
  
  updateProfile: async (userId, userData) => {
    try {
      console.log("Updating user profile for ID:", userId);
      const response = await axiosClient.put(
        `/api/users/${userId}`,
        userData
      );
      return response.data;
    } catch (error) {
      console.error("Profile update error:", error);
      throw error;
    }
  },
  
  // Use for fallback if directLogin fails
  login: async (credentials) => {
    try {
      console.log("Attempting login with axios");
      const response = await axiosClient.post(
        "/api/users/login",
        credentials
      );
      return response.data;
    } catch (error) {
      console.error("Axios login error:", error);
      throw error;
    }
  },
};

export default authApi; 