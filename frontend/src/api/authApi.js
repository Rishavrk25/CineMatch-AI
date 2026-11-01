import apiClient from './client';

export const authApi = {
  async register(name, email, password) {
    return apiClient.post('/auth/register', { name, email, password });
  },

  async login(email, password) {
    return apiClient.post('/auth/login', { email, password });
  },

  async logout() {
    return apiClient.post('/auth/logout');
  },

  async getMe() {
    return apiClient.get('/auth/me');
  },

  async updatePreferences(preferences) {
    return apiClient.patch('/auth/preferences', preferences);
  }
};

export default authApi;
