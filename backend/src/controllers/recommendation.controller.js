import crypto from 'crypto';
import { getRecommendations } from '../services/rag.service.js';
import { Conversation } from '../models/Conversation.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getMovieRecommendations = asyncHandler(async (req, res) => {
  const { query, filters, limit } = req.body;
  const userId = req.user ? req.user._id : null;

  const result = await getRecommendations({
    query,
    userId,
    filters: filters || {},
    limit: limit || 5
  });

  res.status(200).json(result);
});

export const chatRecommendations = asyncHandler(async (req, res) => {
  const { conversationId, message, filters } = req.body;
  const userId = req.user ? req.user._id : null;

  let conversation = null;
  const convId = conversationId || crypto.randomUUID();

  if (userId) {
    conversation = await Conversation.findOne({ conversationId: convId, userId });
    if (!conversation) {
      conversation = await Conversation.create({
        userId,
        conversationId: convId,
        title: message.slice(0, 50),
        messages: [],
        activeFilters: filters || {}
      });
    }
  }

  // Build conversational query taking into account recent history
  let combinedQuery = message;
  const previousMovieIds = [];

  if (conversation && conversation.messages.length > 0) {
    const recentMessages = conversation.messages.slice(-4);
    for (const msg of recentMessages) {
      if (msg.recommendedMovieIds && msg.recommendedMovieIds.length > 0) {
        previousMovieIds.push(...msg.recommendedMovieIds);
      }
    }

    // Merge recent context for follow-up questions
    const lastUserMsg = [...recentMessages].reverse().find(m => m.role === 'user');
    if (lastUserMsg && (message.toLowerCase().includes('more') || message.toLowerCase().includes('them') || message.toLowerCase().includes('instead') || message.toLowerCase().includes('different'))) {
      combinedQuery = `${lastUserMsg.content}. Follow-up constraint: ${message}`;
    }
  }

  // Run RAG recommendation pipeline
  const result = await getRecommendations({
    query: combinedQuery,
    userId,
    filters: {
      ...(conversation?.activeFilters || {}),
      ...(filters || {}),
      // Optional: avoid re-recommending movies from immediately preceding turns if asked for "different"
      excludedIds: message.toLowerCase().includes('different') ? previousMovieIds : []
    },
    limit: 5
  });

  // Save turn into conversation history
  if (conversation) {
    conversation.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date()
    });

    conversation.messages.push({
      role: 'assistant',
      content: result.summary,
      recommendedMovieIds: result.recommendations.map(r => r.movieId),
      timestamp: new Date()
    });

    if (filters) {
      conversation.activeFilters = { ...conversation.activeFilters, ...filters };
    }

    await conversation.save();
  }

  res.status(200).json({
    ...result,
    conversationId: convId
  });
});
