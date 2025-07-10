// frontend/src/store/slices/authSlice.ts - Düzeltilmiş logout ve token handling

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../../types';
import { authAPI, userAPI } from '../../services/api';

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

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('accessToken'),
  refreshToken: localStorage.getItem('refreshToken'),
  isAuthenticated: !!localStorage.getItem('accessToken'),
  isLoading: false,
  error: null,
  friends: [],
  friendRequests: {
    sent: [],
    received: []
  },
  isLoadingFriends: false,
};

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await authAPI.login(credentials);
      const { user, accessToken, refreshToken } = response.data;
      
      // LocalStorage'a kaydet
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      
      console.log('✅ Login successful, tokens saved');
      
      return { user, accessToken, refreshToken };
    } catch (error: any) {
      console.error('❌ Login failed:', error.response?.data);
      return rejectWithValue(error.response?.data?.error || 'Login failed');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData: {
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    password: string;
  }, { rejectWithValue }) => {
    try {
      const response = await authAPI.register(userData);
      const { user, accessToken, refreshToken } = response.data;
      
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      
      return { user, accessToken, refreshToken };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Registration failed');
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      console.log('🔍 Fetching current user...');
      const response = await userAPI.getCurrentUser();
      console.log('✅ User fetched successfully:', response.data.user);
      return response.data.user;
    } catch (error: any) {
      console.error('❌ Failed to fetch user:', error.response?.data);
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch user');
    }
  }
);

export const fetchFriends = createAsyncThunk(
  'auth/fetchFriends',
  async (_, { rejectWithValue }) => {
    try {
      const response = await userAPI.getFriends();
      return response.data.friends;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch friends');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      console.log('🚪 Logging out user...');
      
      // State'i temizle
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.error = null;
      state.friends = [];
      state.friendRequests = { sent: [], received: [] };
      
      // LocalStorage'ı temizle
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      console.log('✅ User logged out successfully');
    },
    
    clearError: (state) => {
      state.error = null;
    },
    
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    
    setTokens: (state, action: PayloadAction<{ accessToken: string; refreshToken: string }>) => {
      console.log('🔑 Setting new tokens...');
      
      state.token = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;
      state.error = null;
      
      // LocalStorage'ı güncelle
      localStorage.setItem('accessToken', action.payload.accessToken);
      localStorage.setItem('refreshToken', action.payload.refreshToken);
      
      console.log('✅ Tokens updated successfully');
    },
    
    addFriend: (state, action: PayloadAction<User>) => {
      if (!state.friends.find(friend => friend.id === action.payload.id)) {
        state.friends.push(action.payload);
      }
    },
    
    removeFriend: (state, action: PayloadAction<string>) => {
      state.friends = state.friends.filter(friend => friend.id !== action.payload);
    },
    
    addFriendRequest: (state, action: PayloadAction<{ type: 'sent' | 'received'; request: any }>) => {
      const { type, request } = action.payload;
      if (!state.friendRequests[type].find(req => req.id === request.id)) {
        state.friendRequests[type].push(request);
      }
    },
    
    removeFriendRequest: (state, action: PayloadAction<{ type: 'sent' | 'received'; requestId: string }>) => {
      const { type, requestId } = action.payload;
      state.friendRequests[type] = state.friendRequests[type].filter(req => req.id !== requestId);
    },
    
    updateFriendOnlineStatus: (state, action: PayloadAction<{ userId: string; isOnline: boolean }>) => {
      const friend = state.friends.find(friend => friend.id === action.payload.userId);
      if (friend) {
        (friend as any).isOnline = action.payload.isOnline;
      }
    },
  },
  
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      });

    // Register
    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      });

    // Fetch Current User
    builder
      .addCase(fetchCurrentUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        // Token geçersizse logout et
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      });

    // Fetch Friends
    builder
      .addCase(fetchFriends.pending, (state) => {
        state.isLoadingFriends = true;
      })
      .addCase(fetchFriends.fulfilled, (state, action) => {
        state.isLoadingFriends = false;
        state.friends = action.payload;
      })
      .addCase(fetchFriends.rejected, (state, action) => {
        state.isLoadingFriends = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  logout,
  clearError,
  updateUser,
  setTokens,
  addFriend,
  removeFriend,
  addFriendRequest,
  removeFriendRequest,
  updateFriendOnlineStatus,
} = authSlice.actions;

export default authSlice.reducer;