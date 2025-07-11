// frontend/src/store/slices/authSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

// Types
interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  isOnline?: boolean;
  lastSeen?: Date;
}

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
  token: typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null,
  refreshToken: typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null,
  isAuthenticated: typeof window !== 'undefined' ? !!localStorage.getItem('accessToken') : false,
  isLoading: false,
  error: null,
  friends: [],
  friendRequests: {
    sent: [],
    received: []
  },
  isLoadingFriends: false,
};

// Mock API calls (replace with real API)
const mockAPI = {
  login: async (credentials: { email: string; password: string }) => {
    // Simulate API call
    return {
      data: {
        user: { id: '1', email: credentials.email, username: 'user', firstName: 'John', lastName: 'Doe' },
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token'
      }
    };
  },
  register: async (userData: any) => {
    // Simulate API call
    return {
      data: {
        user: { 
          id: '1', 
          email: userData.email, 
          username: userData.username, 
          firstName: userData.firstName, 
          lastName: userData.lastName 
        },
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token'
      }
    };
  },
  getCurrentUser: async () => {
    return {
      data: {
        user: { id: '1', email: 'user@example.com', username: 'user', firstName: 'John', lastName: 'Doe' }
      }
    };
  },
  getFriends: async () => {
    return {
      data: {
        friends: []
      }
    };
  }
};

// Async Thunks
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await mockAPI.login(credentials);
      const { user, accessToken, refreshToken } = response.data;
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
      }
      
      return { user, accessToken, refreshToken };
    } catch (error: any) {
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
      console.log('Register User Thunk Called:', userData);
      const response = await mockAPI.register(userData);
      const { user, accessToken, refreshToken } = response.data;
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
      }
      
      return { user, accessToken, refreshToken };
    } catch (error: any) {
      console.error('Register Error:', error);
      return rejectWithValue(error.response?.data?.error || 'Registration failed');
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await mockAPI.getCurrentUser();
      return response.data.user;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch user');
    }
  }
);

export const fetchFriends = createAsyncThunk(
  'auth/fetchFriends',
  async (_, { rejectWithValue }) => {
    try {
      const response = await mockAPI.getFriends();
      return response.data.friends;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch friends');
    }
  }
);

export const fetchFriendRequests = createAsyncThunk(
  'auth/fetchFriendRequests',
  async (_, { rejectWithValue }) => {
    try {
      return {
        sent: [],
        received: []
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch friend requests');
    }
  }
);

export const sendFriendRequest = createAsyncThunk(
  'auth/sendFriendRequest',
  async (userId: string, { rejectWithValue }) => {
    try {
      return { id: userId, status: 'sent' };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to send friend request');
    }
  }
);

export const respondToFriendRequest = createAsyncThunk(
  'auth/respondToFriendRequest',
  async ({ friendshipId, action }: { friendshipId: string; action: 'accept' | 'reject' }, { rejectWithValue }) => {
    try {
      return { friendship: { id: friendshipId }, action };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || `Failed to ${action} friend request`);
    }
  }
);

// Auth Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.error = null;
      state.friends = [];
      state.friendRequests = { sent: [], received: [] };
      
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
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
      state.token = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', action.payload.accessToken);
        localStorage.setItem('refreshToken', action.payload.refreshToken);
      }
    },
    addFriend: (state, action: PayloadAction<User>) => {
      state.friends.push(action.payload);
    },
    removeFriend: (state, action: PayloadAction<string>) => {
      state.friends = state.friends.filter(friend => friend.id !== action.payload);
    },
    addFriendRequest: (state, action: PayloadAction<{ type: 'sent' | 'received'; request: any }>) => {
      state.friendRequests[action.payload.type].push(action.payload.request);
    },
    removeFriendRequest: (state, action: PayloadAction<{ type: 'sent' | 'received'; requestId: string }>) => {
      state.friendRequests[action.payload.type] = state.friendRequests[action.payload.type]
        .filter(req => req.id !== action.payload.requestId);
    },
    updateFriendOnlineStatus: (state, action: PayloadAction<{ userId: string; isOnline: boolean }>) => {
      const friend = state.friends.find(f => f.id === action.payload.userId);
      if (friend) {
        friend.isOnline = action.payload.isOnline;
        if (!action.payload.isOnline) {
          friend.lastSeen = new Date();
        }
      }
    }
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
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
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
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch current user
    builder
      .addCase(fetchCurrentUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch friends
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

    // Fetch friend requests
    builder
      .addCase(fetchFriendRequests.fulfilled, (state, action) => {
        state.friendRequests = action.payload;
      });

    // Send friend request
    builder
      .addCase(sendFriendRequest.fulfilled, (state, action) => {
        state.friendRequests.sent.push(action.payload);
      });

    // Respond to friend request
    builder
      .addCase(respondToFriendRequest.fulfilled, (state, action) => {
        const { friendship, action: responseAction } = action.payload;
        
        // Remove from received requests
        state.friendRequests.received = state.friendRequests.received
          .filter((req: any) => req.id !== friendship.id);
        
        // If accepted, add to friends (mock)
        if (responseAction === 'accept') {
          // Add logic to handle friend addition
        }
      });
  },
});

// Export actions
export const { 
  logout, 
  clearError, 
  updateUser, 
  setTokens,
  addFriend,
  removeFriend,
  addFriendRequest,
  removeFriendRequest,
  updateFriendOnlineStatus
} = authSlice.actions;

// Export reducer
export default authSlice.reducer;

// Export types
export type { User, AuthState };