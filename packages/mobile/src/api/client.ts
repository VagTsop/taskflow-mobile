import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const BASE_URL = Platform.OS === 'web'
  ? 'http://localhost:3004/api'
  : Platform.OS === 'android'
    ? 'http://10.0.2.2:3004/api'
    : 'http://localhost:3004/api';

async function request(path: string, options: RequestInit = {}) {
  const token = await AsyncStorage.getItem('token');
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (res.status === 401) {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    throw new Error('Session expired');
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  // Auth
  login: (email: string, password: string) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (name: string, email: string, password: string) => request('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }),
  getMe: () => request('/auth/me'),
  updateMe: (data: any) => request('/auth/me', { method: 'PUT', body: JSON.stringify(data) }),

  // Projects
  getProjects: () => request('/projects'),
  createProject: (data: any) => request('/projects', { method: 'POST', body: JSON.stringify(data) }),
  updateProject: (id: string, data: any) => request(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProject: (id: string) => request(`/projects/${id}`, { method: 'DELETE' }),

  // Tasks
  getTasks: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request(`/tasks${qs}`);
  },
  getKanban: (projectId?: string) => {
    const qs = projectId ? `?project_id=${projectId}` : '';
    return request(`/tasks/kanban${qs}`);
  },
  getCalendar: (month: number, year: number) => request(`/tasks/calendar?month=${month}&year=${year}`),
  getTask: (id: string) => request(`/tasks/${id}`),
  createTask: (data: any) => request('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  updateTask: (id: string, data: any) => request(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  moveTask: (id: string, status: string, position?: number) => request(`/tasks/${id}/move`, { method: 'PUT', body: JSON.stringify({ status, position }) }),
  deleteTask: (id: string) => request(`/tasks/${id}`, { method: 'DELETE' }),

  // Labels
  getLabels: () => request('/labels'),
  createLabel: (data: any) => request('/labels', { method: 'POST', body: JSON.stringify(data) }),
  updateLabel: (id: string, data: any) => request(`/labels/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteLabel: (id: string) => request(`/labels/${id}`, { method: 'DELETE' }),

  // Dashboard
  getDashboard: () => request('/dashboard'),
};
