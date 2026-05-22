import axios from 'axios';
import { API_URL } from '../utils/constants';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

// Attach JWT from localStorage on every request
api.interceptors.request.use((config) => {
  const authData = localStorage.getItem('eliminator-auth');
  if (authData) {
    try {
      const { state } = JSON.parse(authData);
      if (state.token) {
        config.headers.Authorization = `Bearer ${state.token}`;
      }
    } catch {
      // Ignore malformed persisted auth state.
    }
  }
  return config;
});

// Auto-logout on 401 (exclude auth attempts to prevent login page refresh loop/state loss)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !err.config?.url?.includes('/auth/')) {
      localStorage.removeItem('eliminator-auth');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
