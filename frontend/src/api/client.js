import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000 // 30s timeout for RAG operations
});

// Request interceptor to attach JWT token if stored in localStorage
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('cinematch_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for consistent error extraction
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred';
    const statusCode = error.response?.status || 500;
    
    // Clear token if unauthorized
    if (statusCode === 401) {
      localStorage.removeItem('cinematch_token');
    }

    return Promise.reject({
      statusCode,
      message,
      data: error.response?.data
    });
  }
);

export default apiClient;
