import { MovieInteraction } from '../models/MovieInteraction.js';
import { User } from '../models/User.js';
import { getMovieById } from '../services/movieCatalog.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const recordInteraction = asyncHandler(async (req, res) => {
  const { movieId, interactionType, rating } = req.body;
  const userId = req.user._id;

  const interaction = await MovieInteraction.create({
    userId,
    movieId: String(movieId),
    interactionType,
    rating: rating || null
  });

  // If interaction is like/dislike, sync with user profile preferences
  if (interactionType === 'like') {
    await User.findByIdAndUpdate(userId, {
      $addToSet: { favoriteMovieIds: String(movieId) },
      $pull: { dislikedMovieIds: String(movieId) }
    });
  } else if (interactionType === 'dislike') {
    await User.findByIdAndUpdate(userId, {
      $addToSet: { dislikedMovieIds: String(movieId) },
      $pull: { favoriteMovieIds: String(movieId) }
    });
  }

  res.status(201).json({
    success: true,
    message: 'Interaction recorded',
    interaction
  });
});

export const getUserInteractions = asyncHandler(async (req, res) => {
  const interactions = await MovieInteraction.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  const populated = interactions.map(item => {
    const movie = getMovieById(item.movieId);
    return {
      ...item,
      movie: movie ? { title: movie.title, releaseYear: movie.releaseYear, genres: movie.genres } : null
    };
  });

  res.status(200).json({
    success: true,
    count: populated.length,
    interactions: populated
  });
});

