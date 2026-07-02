// src/api/client.js

import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000,
});

// ── REQUEST INTERCEPTOR — attach JWT ──────────────────────────────────────────
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  error => Promise.reject(error)
);

// ── RESPONSE INTERCEPTOR — handle 401 globally ────────────────────────────────
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── AUTH ──────────────────────────────────────────────────────────────────────
export const login = credentials => api.post('/auth/login/', credentials);
export const refreshToken = refresh => api.post('/auth/token/refresh/', { refresh });
export const changePassword = data => api.post('/auth/change-password/', data);

// ── USER / PROFILE ────────────────────────────────────────────────────────────
export const getProfile = () => api.get('/auth/me/');
export const getUsers = () => api.get('/admin/users/');
export const getRoles = () => api.get('/admin/roles/');
export const createUser = data => api.post('/admin/users/', data);
export const registerStudent = data => api.post('/students/register/', data);

// ── COURSES ───────────────────────────────────────────────────────────────────
export const getCourses = params => api.get('/courses/', { params });
export const getCourse = courseId => api.get(`/courses/${courseId}/`);
export const getCoursePreview = courseId => api.get(`/courses/${courseId}/preview/`);

// ── ENROLLMENT (Student) ──────────────────────────────────────────────────────
export const enroll = data => api.post('/enrollments/enroll/', data);
export const myEnrollments = () => api.get('/enrollments/my/');
export const getMyEnrollmentForCourse = (courseId) =>
  myEnrollments().then(r => {
    const match = (r.data.enrollments || []).find(e => e.course_id === courseId);
    return match || null;
  });
export const uploadPayment = (enrollmentId, fd) =>
  api.post(`/enrollments/${enrollmentId}/upload-payment/`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const getCourseCurriculum = courseId =>
  api.get(`/courses/${courseId}/curriculum/`);

// ── OPERATOR ──────────────────────────────────────────────────────────────────
export const operatorPending = () => api.get('/operator/enrollments/pending/');
export const operatorAll = params => api.get('/operator/enrollments/all/', { params });
export const operatorApprove = (id, data) => api.post(`/operator/enrollments/${id}/approve/`, data);
export const enrollmentLogs = id => api.get(`/operator/enrollments/${id}/logs/`);

// ── GENERIC HELPERS ───────────────────────────────────────────────────────────
export const get = (url, config = {}) => api.get(url, config);
export const post = (url, data = {}, config = {}) => api.post(url, data, config);
export const put = (url, data = {}, config = {}) => api.put(url, data, config);
export const patch = (url, data = {}, config = {}) => api.patch(url, data, config);
export const del = (url, config = {}) => api.delete(url, config);

// ==================== NUMBERING PATTERN FUNCTIONS ====================

export const getPatterns = async (params = {}) => {
    try {
        const response = await api.get('/numbering/patterns/', { params });
        return response;
    } catch (error) {
        throw error;
    }
};

export const createPattern = async (patternData) => {
    try {
        const response = await api.post('/numbering/patterns/', patternData);
        return response;
    } catch (error) {
        throw error;
    }
};

export const updatePattern = async (patternId, patternData) => {
    try {
        const response = await api.put(`/numbering/patterns/${patternId}/`, patternData);
        return response;
    } catch (error) {
        throw error;
    }
};

export const deletePattern = async (patternId) => {
    try {
        const response = await api.delete(`/numbering/patterns/${patternId}/`);
        return response;
    } catch (error) {
        throw error;
    }
};

export default api;