import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import common_API from "../../Api/commonApi";

export const loginUser = createAsyncThunk("users/loginUser", async (credentials, { rejectWithValue }) => {
  try {
    const response = await common_API.post("/login", credentials, {
      headers: { "Content-Type": "application/json" },
    });
    
    // Check if token is valid (contains necessary role info)
    const token = response.data.token;
    if (!token) {
      return rejectWithValue({ message: "Invalid token received" });
    }
    
    // Verify JWT contents
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      // Ensure role in token matches role in user object
      if (payload.role !== response.data.user.role) {
        return rejectWithValue({ message: "Authentication data mismatch" });
      }
    } catch (err) {
      return rejectWithValue({ message: "Invalid token format" });
    }
    
    localStorage.setItem("user", JSON.stringify(response.data.user));
    localStorage.setItem("token", response.data.token);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || { message: "Login failed" });
  }
});

export const verifyAuth = createAsyncThunk("users/verifyAuth", async (_, { rejectWithValue }) => {
  try {
    // Token is automatically attached by the API interceptor
    const response = await common_API.get("/verify-auth");
    
    if (response.data.success) {
      // Get verified user info from server
      const serverUser = response.data.user;
      
      // Only do minimal validation to prevent loops
      const token = localStorage.getItem("token");
      
      // Skip detailed token validation if no token - let rejection handle it
      if (!token) {
        localStorage.removeItem("user");
        return rejectWithValue("No token available");
      }
      
      return serverUser;
    } else {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      return rejectWithValue(response.data.message || "Authentication failed");
    }
  } catch (error) {
    // Handle token expiration, network errors, etc.
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    return rejectWithValue(error.response?.data?.message || "Authentication verification failed");
  }
});

const storedUser = JSON.parse(localStorage.getItem("user")) || null;
const storedToken = localStorage.getItem("token") || null;

const authSlice = createSlice({
  name: "auth",
  initialState: { 
    user: storedUser, 
    token: storedToken, 
    loading: false, 
    error: null 
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.loading = false;
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    },
    updateUser: (state, action) => {
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => { 
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => { 
        state.user = action.payload.user; 
        state.token = action.payload.token; 
        state.loading = false;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => { 
        state.error = action.payload?.message || "Login failed"; 
        state.loading = false;
        state.user = null;
        state.token = null;
      })
      .addCase(verifyAuth.pending, (state) => { 
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyAuth.fulfilled, (state, action) => { 
        state.user = action.payload;
        state.loading = false;
        state.error = null;
        // Update localStorage with verified user data
        localStorage.setItem("user", JSON.stringify(action.payload));
      })
      .addCase(verifyAuth.rejected, (state, action) => { 
        state.user = null;
        state.token = null;
        state.error = action.payload || "Authentication verification failed"; 
        state.loading = false; 
        // Clear localStorage on failed verification
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      });
  },
});

export const { logout, updateUser } = authSlice.actions;
export default authSlice.reducer;
