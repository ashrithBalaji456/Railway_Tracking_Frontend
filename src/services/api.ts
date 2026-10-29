import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://railway-tracking-backend-gwa2.onrender.com';

const api = axios.create({
  baseURL: `${API_BASE_URL}`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiry / errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('username');
      localStorage.removeItem('email');
      localStorage.removeItem('userId');
      localStorage.removeItem('roles');
      window.location.href = '/login';
    }
    const message = error.response?.data?.message || 'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

export const getDisruptions = async (type?: string): Promise<any> => {
  const url = type && type !== 'ALL' ? `/api/v1/disruptions/exceptions?type=${type}` : '/api/v1/disruptions/exceptions';
  return api.get(url);
};

export const getDisruptionsSummary = async (): Promise<any> => {
  return api.get('/api/v1/disruptions/summary');
};

export const getTrainDelayReport = async (trainNumber: string): Promise<any> => {
  return api.get(`/api/v1/trains/${trainNumber}/delay`);
};

export const getTrainFare = async (trainNumber: string, source: string, destination: string): Promise<any> => {
  return api.get(`/api/v1/trains/${trainNumber}/fare?source=${encodeURIComponent(source)}&destination=${encodeURIComponent(destination)}`);
};

export const getTrainsBetween = async (from: string, to: string, date?: string): Promise<any> => {
  const dateQuery = date ? `&date=${encodeURIComponent(date)}` : '';
  return api.get(`/api/v1/trains/between?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}${dateQuery}`);
};

export const getJourneyOverlay = async (requestBody: any): Promise<any> => {
  return api.post('/api/v1/journey/overlay', requestBody);
};

export const getBlogs = async (category?: string, query?: string): Promise<any> => {
  const params = new URLSearchParams();
  if (category && category !== 'All') params.append('category', category);
  if (query && query.trim()) params.append('q', query.trim());
  const qs = params.toString();
  return api.get(qs ? `/api/v1/blogs?${qs}` : '/api/v1/blogs');
};

export const getBlogBySlug = async (slug: string): Promise<any> => {
  return api.get(`/api/v1/blogs/${encodeURIComponent(slug)}`);
};

export const getFeaturedBlogs = async (): Promise<any> => {
  return api.get('/api/v1/blogs/featured');
};

export const getBlogCategories = async (): Promise<any> => {
  return api.get('/api/v1/blogs/categories');
};

export default api;
