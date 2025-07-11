// frontend/src/store/slices/authSlice.ts - LOADING FIX
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../../types';
import { authAPI } from '../../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  friends: User[];
  friendRequests: {
    sent: any[];
    received: any[];
  };
  isLoadingFriends: boolean;
}

// SAFE INITIAL STATE
const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('accessToken'),
  refreshToken: localStorage.getItem('refreshToken'),
  isAuthenticated: !!localStorage.getItem('accessToken'),
  isLoading: false, // CRITICAL: Default false
  error: null,
  friends: [],
  friendRequests: { sent: [], received: [] },
  isLoadingFriends: false
};

// ASYNC THUNKS with TIMEOUT
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await authAPI.login(credentials);
      
      // Store tokens
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Login failed');
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue, signal }) => {
    try {
      // Add timeout
      const timeoutId = setTimeout(() => {
        signal.throwIfAborted();
      }, 10000); // 10 second timeout

      const response = await authAPI.getCurrentUser();
      clearTimeout(timeoutId);
      return response.data.user;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch user');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.isLoading = false; // CRITICAL: Reset loading
      state.error = null;
      state.friends = [];
      state.friendRequests = { sent: [], received: [] };
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    },
    
    clearError: (state) => {
      state.error = null;
    },
    
    // CRITICAL: Force reset loading
    resetLoading: (state) => {
      state.isLoading = false;
      state.isLoadingFriends = false;
    },
    
    setTokens: (state, action: PayloadAction<{ accessToken: string; refreshToken: string }>) => {
      state.token = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;
      localStorage.setItem('accessToken', action.payload.accessToken);
      localStorage.setItem('refreshToken', action.payload.refreshToken);
    },
    
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    }
  },
  
  extraReducers: (builder) => {
    // LOGIN
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false; // CRITICAL: Reset loading
        state.user = action.payload.user;
        state.token = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false; // CRITICAL: Reset loading
        state.error = action.payload as string;
        state.isAuthenticated = false;
      });

    // FETCH USER
    builder
      .addCase(fetchCurrentUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false; // CRITICAL: Reset loading
        state.user = action.payload;
        state.error = null;
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.isLoading = false; // CRITICAL: Reset loading
        state.error = action.payload as string;
        // If token is invalid, logout
        if (action.payload === 'Unauthorized') {
          state.token = null;
          state.refreshToken = null;
          state.isAuthenticated = false;
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      });
  }
});

export const { logout, clearError, resetLoading, setTokens, updateUser } = authSlice.actions;
export default authSlice.reducer;