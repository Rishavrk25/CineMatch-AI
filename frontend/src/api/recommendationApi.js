import apiClient from './client';

export const recommendationApi = {
  async getRecommendations({ query, limit = 5, negativeGenres = [], minYear = null, maxYear = null }) {
    return apiClient.post('/recommendations', {
      query,
      limit,
      filters: {
        excludedGenres: negativeGenres,
        minYear,
        maxYear
      }
    });
  },

  async sendChatMessage({ message, conversationId = null, limit = 5 }) {
    const payload = {
      message,
      limit
    };
    if (conversationId) {
      payload.conversationId = conversationId;
    }
    return apiClient.post('/recommendations/chat', payload);
  }
};

export default recommendationApi;
