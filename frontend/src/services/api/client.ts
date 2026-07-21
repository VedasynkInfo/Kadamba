import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  // Render free-tier cold starts can exceed 15s; keep headroom for first wake.
  timeout: 45000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('kadamba_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('kadamba_token');
      localStorage.removeItem('kadamba_user');
      // If an admin session expired, return to the login screen cleanly
      // instead of leaving a broken authenticated view on screen.
      if (
        typeof window !== 'undefined' &&
        window.location.pathname.startsWith('/admin') &&
        window.location.pathname !== '/admin/login'
      ) {
        window.location.assign('/admin/login');
      }
    }
    return Promise.reject(error);
  },
);

export default api;
