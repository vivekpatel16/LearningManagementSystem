import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import common_API from "../../Api/commonApi";

export const loginUser = createAsyncThunk("users/loginUser", async (credentials, { rejectWithValue }) => {
  try {
    const response = await common_API.post("/login", credentials, {
      headers: { "Content-Type": "application/json" },
    });
    localStorage.setItem("user", JSON.stringify(response.data.user));
    localStorage.setItem("token", response.data.token);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || { message: "Login failed" });
  }
});

const storedUser = JSON.parse(localStorage.getItem("user")) || null;
const storedToken = localStorage.getItem("token") || null;

const authSlice = createSlice({
  name: "auth",
  initialState: { user: storedUser, token: storedToken, loading: false, error: null },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    },
    updateUser: (state, action) => {
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => { state.loading = true; })
      .addCase(loginUser.fulfilled, (state, action) => { state.user = action.payload.user; state.token = action.payload.token; state.loading = false; })
      .addCase(loginUser.rejected, (state, action) => { state.error = action.payload?.message || "Login failed"; state.loading = false; });
  },
});

export const { logout, updateUser } = authSlice.actions;
export default authSlice.reducer;
