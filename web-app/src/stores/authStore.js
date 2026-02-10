import { create } from 'zustand';
import { authService } from '../services/authService';

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.login(email, password);
      if (response.success && response.data) {
        const { user, token } = response.data;
        localStorage.setItem('auth_token', token);
        localStorage.setItem('user', JSON.stringify(user));
        set({ user, token, isLoading: false });
        return true;
      } else {
        set({ error: response.error || 'Login failed', isLoading: false });
        return false;
      }
    } catch (error) {
      set({ error: error.message || 'Login failed', isLoading: false });
      return false;
    }
  },

  register: async (email, password, firstName, lastName) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.register(email, password, firstName, lastName);
      if (response.success && response.data) {
        const { user, token } = response.data;
        localStorage.setItem('auth_token', token);
        localStorage.setItem('user', JSON.stringify(user));
        set({ user, token, isLoading: false });
        return true;
      } else {
        set({ error: response.error || 'Registration failed', isLoading: false });
        return false;
      }
    } catch (error) {
      set({ error: error.message || 'Registration failed', isLoading: false });
      return false;
    }
  },

  logout: () => {
    authService.logout();
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    set({ user: null, token: null, error: null });
  },

  updateUser: (userData) => {
    set((state) => ({
      user: state.user ? { ...state.user, ...userData } : null,
    }));
    const user = authService.getCurrentUser();
    if (user) {
      localStorage.setItem('user', JSON.stringify({ ...user, ...userData }));
    }
  },

  clearError: () => set({ error: null }),

  loadFromStorage: () => {
    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('user');
    if (token && user) {
      set({ token, user: JSON.parse(user) });
    }
  },
}));
