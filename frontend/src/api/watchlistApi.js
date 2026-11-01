import apiClient from './client';

export const watchlistApi = {
  async getWatchlist() {
    return apiClient.get('/watchlist');
  },

  async addToWatchlist(movieId) {
    return apiClient.post(`/watchlist/${movieId}`);
  },

  async removeFromWatchlist(movieId) {
    return apiClient.delete(`/watchlist/${movieId}`);
  },

  async recordInteraction({ movieId, type, rating = null }) {
    return apiClient.post('/interactions', { movieId, type, rating });
  },

  async getMyInteractions() {
    return apiClient.get('/interactions/me');
  }
};

export default watchlistApi;

