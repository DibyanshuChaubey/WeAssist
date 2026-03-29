// API Service for Hostel Issue Reporting System

import axios from 'axios';
import { getApiBaseUrl } from '../utils/apiBaseUrl';

const API_BASE_URL = getApiBaseUrl();

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('authToken') || localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = String(error.response?.data?.msg || error.response?.data?.error || '');
    const isJwtValidationError =
      status === 422 && /(token|jwt|signature|segments|expired|authorization)/i.test(message);

    if (status === 401 || isJwtValidationError) {
      // Token expired or invalid
      sessionStorage.removeItem('authToken');
      sessionStorage.removeItem('user');
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ==================== AUTH ====================

export const authService = {
  // Register new user
  register: async (userData: {
    name: string;
    email: string;
    password: string;
    hostel?: string;
  }) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // Login
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Logout
  logout: () => {
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('user');
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },

  // Get current user
  getCurrentUser: () => {
    const sessionUserStr = sessionStorage.getItem('user');
    if (sessionUserStr) {
      return JSON.parse(sessionUserStr);
    }
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Check if authenticated
  isAuthenticated: () => {
    return !!(sessionStorage.getItem('authToken') || localStorage.getItem('authToken'));
  },
};

// ==================== ISSUES ====================

export const issuesService = {
  // Get all issues (filtered by role)
  getIssues: async (params?: {
    page?: number;
    per_page?: number;
    status?: string;
    category?: string;
    priority?: string;
  }) => {
    const response = await api.get('/issues', { params });
    return response.data;
  },

  // Get single issue
  getIssue: async (issueId: string) => {
    const response = await api.get(`/issues/${issueId}`);
    return response.data;
  },

  // Create new issue
  createIssue: async (issueData: {
    title: string;
    description: string;
    category: string;
    imageUrl?: string;
    location: {
      hostel: string;
      floor: number;
      room: string;
    };
  }) => {
    const payload = {
      ...issueData,
      image_url: issueData.imageUrl,
    };
    const response = await api.post('/issues', payload);
    return response.data;
  },

  // Update issue status (admin only)
  updateIssueStatus: async (
    issueId: string,
    status: string,
    reason?: string
  ) => {
    const response = await api.patch(`/issues/${issueId}/status`, {
      status,
      reason,
    });
    return response.data;
  },

  // Set issue priority (admin only)
  setIssuePriority: async (issueId: string, priority: string) => {
    const response = await api.patch(`/issues/${issueId}/priority`, {
      priority,
    });
    return response.data;
  },

  // Reporter: confirm resolution
  confirmResolution: async (issueId: string) => {
    const response = await api.post(`/issues/${issueId}/confirm-resolution`);
    return response.data;
  },

  // Add admin note
  addAdminNote: async (issueId: string, content: string) => {
    const response = await api.post(`/issues/${issueId}/notes`, { content });
    return response.data;
  },

  // Get issue statistics
  getStatistics: async () => {
    const response = await api.get('/issues/stats');
    return response.data;
  },
};

// ==================== EVENTS ====================

export const eventsService = {
  // Get all events
  getEvents: async (params?: {
    page?: number;
    per_page?: number;
    event_type?: string;
    registration_status?: string;
  }) => {
    const response = await api.get('/events', { params });
    return response.data;
  },

  // Get single event
  getEvent: async (eventId: string) => {
    const response = await api.get(`/events/${eventId}`);
    return response.data;
  },

  // Create event (admin only)
  createEvent: async (eventData: any) => {
    const response = await api.post('/events', eventData);
    return response.data;
  },

  // Update event (admin only)
  updateEvent: async (eventId: string, eventData: any) => {
    const response = await api.put(`/events/${eventId}`, eventData);
    return response.data;
  },

  // Delete event (admin only)
  deleteEvent: async (eventId: string) => {
    const response = await api.delete(`/events/${eventId}`);
    return response.data;
  },

  // Register for event
  registerForEvent: async (eventId: string) => {
    const response = await api.post(`/events/${eventId}/register`);
    return response.data;
  },

  // Unregister from event
  unregisterFromEvent: async (eventId: string) => {
    const response = await api.delete(`/events/${eventId}/register`);
    return response.data;
  },
};

// ==================== UPLOADS ====================

export const uploadService = {
  uploadImage: async (file: File, folder?: string) => {
    const formData = new FormData();
    formData.append('image', file);
    if (folder) {
      formData.append('folder', folder);
    }

    const response = await api.post('/uploads/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

// ==================== CHATBOT ====================

export interface ChatbotIssueSummary {
  id: string;
  title: string;
  status: string;
  reportedDate?: string | null;
  updatedDate?: string | null;
}

export interface ChatbotResponse {
  type: 'status' | 'faq' | 'fallback';
  source: string;
  reply: string;
  suggestions?: string[];
  data?: {
    faq_id?: string;
    issues?: ChatbotIssueSummary[];
    stats?: {
      total: number;
      open: number;
      resolved_by_admin: number;
    };
  };
}

export const chatbotService = {
  ask: async (message: string): Promise<ChatbotResponse> => {
    const response = await api.post('/chatbot/ask', { message });
    return response.data;
  },
};

// ==================== ADMIN ====================

export const adminService = {
  // Get all users
  getUsers: async (params?: { role?: string; status?: string }) => {
    const response = await api.get('/auth/admin/users', { params });
    return response.data;
  },

  // Verify user
  verifyUser: async (userId: string) => {
    const response = await api.post(`/auth/admin/users/${userId}/verify`);
    return response.data;
  },

  // Update user role
  updateUserRole: async (userId: string, role: string) => {
    const response = await api.patch(`/auth/admin/users/${userId}/role`, {
      role,
    });
    return response.data;
  },

  // Get dashboard statistics
  getDashboardStats: async () => {
    const response = await api.get('/issues/stats');
    return response.data;
  },
};

export default api;
