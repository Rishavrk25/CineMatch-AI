import { useState, useCallback } from 'react';
import recommendationApi from '../api/recommendationApi';

export function useRecommendations() {
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendMessage = useCallback(async (text) => {
    if (!text || !text.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    setError(null);

    try {
      const response = await recommendationApi.sendChatMessage({
        message: text.trim(),
        conversationId,
        limit: 5
      });

      if (response.conversationId) {
        setConversationId(response.conversationId);
      }

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.summary || 'Here are the movies matching your request:',
        recommendations: response.recommendations || [],
        appliedConstraints: response.appliedConstraints || {},
        suggestions: response.followUpSuggestions || [],
        timestamp: new Date().toISOString()
      };

      setMessages((prev) => [...prev, assistantMessage]);
      return response;
    } catch (err) {
      const errorMsg = err.message || 'Failed to generate recommendations';
      setError(errorMsg);

      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${errorMsg}. Please try rephrasing your query.`,
        recommendations: [],
        timestamp: new Date().toISOString()
      };
      setMessages((prev) => [...prev, errorMessage]);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  const resetChat = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setError(null);
  }, []);

  return {
    messages,
    loading,
    error,
    conversationId,
    sendMessage,
    resetChat
  };
}

export default useRecommendations;
