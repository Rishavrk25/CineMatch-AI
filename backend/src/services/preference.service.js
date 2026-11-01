import { User } from '../models/User.js';
import { MovieInteraction } from '../models/MovieInteraction.js';
import { logger } from '../utils/logger.js';

/**
 * Retrieves the taste profile and interaction history for a user.
 * @param {string|null} userId 
 * @returns {Promise<Object>}
 */
export async function getUserPreferences(userId) {
  if (!userId) {
    return {
      favoriteGenres: [],
      favoriteMovieIds: [],
      dislikedMovieIds: [],
      watchedIds: [],
      preferredLanguages: ['en']
    };
  }

  try {
    const user = await User.findById(userId).lean();
    if (!user) {
      return {
        favoriteGenres: [],
        favoriteMovieIds: [],
        dislikedMovieIds: [],
        watchedIds: [],
        preferredLanguages: ['en']
      };
    }

    // Retrieve interactions (likes, dislikes, views)
    const interactions = await MovieInteraction.find({ userId }).lean();
    const likedIds = new Set(user.favoriteMovieIds || []);
    const dislikedIds = new Set(user.dislikedMovieIds || []);
    const watchedIds = new Set();

    for (const inter of interactions) {
      if (inter.interactionType === 'like' || (inter.rating && inter.rating >= 7)) {
        likedIds.add(String(inter.movieId));
      } else if (inter.interactionType === 'dislike' || (inter.rating && inter.rating <= 4)) {
        dislikedIds.add(String(inter.movieId));
      }
      watchedIds.add(String(inter.movieId));
    }

    return {
      favoriteGenres: user.favoriteGenres || [],
      favoriteMovieIds: Array.from(likedIds),
      dislikedMovieIds: Array.from(dislikedIds),
      watchedIds: Array.from(watchedIds),
      preferredLanguages: user.preferredLanguages || ['en']
    };
  } catch (error) {
    logger.error(`Failed to fetch user preferences for ${userId}:`, error.message);
    return {
      favoriteGenres: [],
      favoriteMovieIds: [],
      dislikedMovieIds: [],
      watchedIds: [],
      preferredLanguages: ['en']
    };
  }
}
