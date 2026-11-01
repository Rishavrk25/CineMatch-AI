import apiClient from './client';

export const recommendationApi = {
  async getRecommendations({ query, limit = 5, negativeGenres = [], minYear = null, maxYear = null }) {
    return apiClient.post('/recommendations', {
      query,
      limit,
      negativeGenres,
      minYear,
      maxYear
    });
  },

  async sendChatMessage({ message, conversationId = null, limit = 5 }) {
    return apiClient.post('/recommendations/chat', {
      message,
      conversationId,
      limit
    });
  }
};

export default recommendationApi;
