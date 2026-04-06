import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('pos-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('pos-refresh-token');
      if (refreshToken && !error.config._retry) {
        error.config._retry = true;
        try {
          const { data } = await axios.post('/api/auth/refresh', {
            refreshToken,
          });
          localStorage.setItem('pos-token', data.token);
          if (data.refreshToken) {
            localStorage.setItem('pos-refresh-token', data.refreshToken);
          }
          error.config.headers.Authorization = `Bearer ${data.token}`;
          return apiClient(error.config);
        } catch {
          localStorage.removeItem('pos-token');
          localStorage.removeItem('pos-refresh-token');
          localStorage.removeItem('pos-auth');
          window.location.href = '/login';
          return Promise.reject(error);
        }
      }
      localStorage.removeItem('pos-token');
      localStorage.removeItem('pos-refresh-token');
      localStorage.removeItem('pos-auth');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
