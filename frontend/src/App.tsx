// frontend/src/App.tsx - LOADING FIX
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from './store';
import { fetchCurrentUser, resetLoading } from './store/slices/authSlice';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';

// Components
import LoadingSpinner from './components/ui/LoadingSpinner';

const App: React.FC = () => {
  const dispatch = useDispatch();
  const [appInitialized, setAppInitialized] = useState(false);
  
  // SAFE SELECTORS
  const authState = useSelector((state: RootState) => state.auth);
  const { user, token, isAuthenticated, isLoading } = authState || {};

  useEffect(() => {
    const initializeApp = async () => {
      console.log('🚀 App initializing...');
      
      // Check if we have a token
      const storedToken = localStorage.getItem('accessToken');
      
      if (storedToken && !user) {
        console.log('📝 Token found, fetching user...');
        try {
          await dispatch(fetchCurrentUser());
        } catch (error) {
          console.error('❌ Failed to fetch user:', error);
          // Clear invalid token
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      }
      
      // Force reset loading after 5 seconds (safety net)
      setTimeout(() => {
        dispatch(resetLoading());
        setAppInitialized(true);
        console.log('✅ App initialized');
      }, 5000);
      
      // Normal initialization
      setTimeout(() => {
        setAppInitialized(true);
        console.log('✅ App initialized (normal)');
      }, 1000);
    };

    initializeApp();
  }, [dispatch, user]);

  // LOADING STATES with TIMEOUT
  if (!appInitialized || isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Yükleniyor...
          </p>
          {/* SAFETY: Force unlock after 10 seconds */}
          <p className="mt-2 text-xs text-gray-400">
            Eğer bu ekran 10 saniyeden fazla kalırsa, sayfayı yenileyin.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/login" 
            element={
              isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
            } 
          />
          <Route 
            path="/register" 
            element={
              isAuthenticated ? <Navigate to="/" replace /> : <RegisterPage />
            } 
          />
          
          {/* Protected Routes */}
          <Route 
            path="/" 
            element={
              isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />
            } 
          />
          
          {/* Catch all */}
          <Route 
            path="*" 
            element={<Navigate to="/" replace />} 
          />
        </Routes>
      </div>
    </Router>
  );
};

export default App;