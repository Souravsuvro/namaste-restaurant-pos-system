import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth-store';
import toast from 'react-hot-toast';

export function useAuth() {
  const { user, isAuthenticated, login: storeLogin, logout: storeLogout } = useAuthStore();
  const navigate = useNavigate();

  const login = useCallback(
    async (pin: string) => {
      try {
        await storeLogin(pin);
        toast.success(`Welcome back!`);
        navigate('/');
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Invalid PIN';
        toast.error(message);
        throw error;
      }
    },
    [storeLogin, navigate]
  );

  const logout = useCallback(() => {
    storeLogout();
    navigate('/login');
    toast.success('Logged out');
  }, [storeLogout, navigate]);

  return {
    user,
    isAuthenticated,
    login,
    logout,
  };
}
