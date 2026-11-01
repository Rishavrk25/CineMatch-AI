import apiClient from './client';

export const movieApi = {
  async getMovies(params = {}) {
    return apiClient.get('/movies', { params });
  },

  async getMovieById(id) {
    return apiClient.get(`/movies/${id}`);
  },

  async searchMovies(q) {
    return apiClient.get('/movies/search', { params: { q } });
  },

  async getSimilarMovies(id) {
    return apiClient.get(`/movies/${id}/similar`);
  }
};

export default movieApi;

