import axios from 'axios';

const API = axios.create({ baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api' });

API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  signup: (data) => API.post('/auth/signup', data),
  login: (data) => API.post('/auth/login', data),
  forgotPassword: (email) => API.post('/auth/forgot-password', { email }),
  verifyOTP: (data) => API.post('/auth/verify-otp', data),
  resetPassword: (data) => API.post('/auth/reset-password', data),
  getMe: () => API.get('/auth/me'),
  updateProfile: (data) => API.put('/auth/update-profile', data),
  updateStatisticsOrder: (order) => API.put('/auth/statistics-order', { order }),
};

export const productAPI = {
  getAll: (params) => API.get('/products', { params }),
  getInventorySummary: () => API.get('/products/inventory-summary'),
  create: (data) => API.post('/products', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  csvUpload: (data) => API.post('/products/csv-upload', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  buy: (id, quantity) => API.post(`/products/${id}/buy`, { quantity }),
  update: (id, data) => API.put(`/products/${id}`, data),
  delete: (id) => API.delete(`/products/${id}`),
};

export const invoiceAPI = {
  getAll: (params) => API.get('/invoices', { params }),
  getSummary: () => API.get('/invoices/summary'),
  getById: (id) => API.get(`/invoices/${id}`),
  updateStatus: (id, status) => API.put(`/invoices/${id}/status`, { status }),
  delete: (id) => API.delete(`/invoices/${id}`),
};

export const statisticsAPI = {
  getOverview: () => API.get('/statistics/overview'),
  getGraph: (period) => API.get('/statistics/graph', { params: { period } }),
  getTopCards: () => API.get('/statistics/top-cards'),
};

export default API;
