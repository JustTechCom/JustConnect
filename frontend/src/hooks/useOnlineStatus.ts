
// frontend/src/hooks/useOnlineStatus.ts
import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setIsOnline } from '../store/slices/uiSlice';

export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnlineState] = useState(navigator.onLine);
  const dispatch = useDispatch();

  useEffect(() => {
    function handleOnline() {
      setIsOnlineState(true);
      dispatch(setIsOnline(true));
    }

    function handleOffline() {
      setIsOnlineState(false);
      dispatch(setIsOnline(false));
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [dispatch]);

  return isOnline;
}