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
    const path = typeof window !== 'undefined' ? window.location.pathname : '';
    const token = path.startsWith('/portal')
      ? localStorage.getItem('kadamba_portal_token')
      : localStorage.getItem('kadamba_token');
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
      const path = typeof window !== 'undefined' ? window.location.pathname : '';
      if (path.startsWith('/portal')) {
        localStorage.removeItem('kadamba_portal_token');
        localStorage.removeItem('kadamba_portal_user');
        if (path !== '/portal/login' && path !== '/portal/activate') {
          window.location.assign('/portal/login');
        }
      } else {
        localStorage.removeItem('kadamba_token');
        localStorage.removeItem('kadamba_user');
        if (path.startsWith('/admin') && path !== '/admin/login') {
          window.location.assign('/admin/login');
        }
      }
    }
    return Promise.reject(error);
  },
);

export default api;
