import api from './client';

export const authApi = {
  register: (data) => api.post('/auth/register', data).then(r => r.data),
  login: (data) => api.post('/auth/login', data).then(r => r.data),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }).then(r => r.data),
};

export const tasksApi = {
  getAll: (params) => api.get('/tasks', { params }).then(r => r.data),
  getById: (id) => api.get(`/tasks/${id}`).then(r => r.data),
  getStats: () => api.get('/tasks/stats').then(r => r.data),
  create: (data) => api.post('/tasks', data).then(r => r.data),
  update: (id, data) => api.put(`/tasks/${id}`, data).then(r => r.data),
  complete: (id) => api.patch(`/tasks/${id}/complete`).then(r => r.data),
  delete: (id) => api.delete(`/tasks/${id}`).then(r => r.data),
  createItem: (taskId, data) => api.post(`/tasks/${taskId}/items`, data).then(r => r.data),
  toggleItem: (taskId, itemId) => api.patch(`/tasks/${taskId}/items/${itemId}`).then(r => r.data),
  deleteItem: (taskId, itemId) => api.delete(`/tasks/${taskId}/items/${itemId}`).then(r => r.data),
};

export const categoriesApi = {
  getAll: () => api.get('/categories').then(r => r.data),
  create: (data) => api.post('/categories', data).then(r => r.data),
  update: (id, data) => api.put(`/categories/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/categories/${id}`).then(r => r.data),
};

export const tagsApi = {
  getAll: () => api.get('/tags').then(r => r.data),
  create: (data) => api.post('/tags', data).then(r => r.data),
  update: (id, data) => api.put(`/tags/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/tags/${id}`).then(r => r.data),
};
