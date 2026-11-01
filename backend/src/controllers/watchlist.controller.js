import { User } from '../models/User.js';
import { MovieInteraction } from '../models/MovieInteraction.js';
import { getMovieById } from '../services/movieCatalog.service.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getWatchlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const movieIds = user.favoriteMovieIds || [];

  const movies = movieIds
    .map(id => getMovieById(id))
    .filter(Boolean);

  res.status(200).json({
    success: true,
    count: movies.length,
    watchlist: movies
  });
});

export const addToWatchlist = asyncHandler(async (req, res) => {
  const { movieId } = req.params;
  const movie = getMovieById(movieId);

  if (!movie) {
    throw ApiError.notFound(`Movie with ID ${movieId} not found in catalog`);
  }

  // Update user's favoriteMovieIds array
  await User.findByIdAndUpdate(req.user._id, {
    $addToSet: { favoriteMovieIds: String(movieId) }
  });

  // Record interaction
  await MovieInteraction.create({
    userId: req.user._id,
    movieId: String(movieId),
    interactionType: 'watchlist_add'
  });

  res.status(200).json({
    success: true,
    message: `"${movie.title}" added to watchlist`,
    movieId: String(movieId)
  });
});

export const removeFromWatchlist = asyncHandler(async (req, res) => {
  const { movieId } = req.params;

  await User.findByIdAndUpdate(req.user._id, {
    $pull: { favoriteMovieIds: String(movieId) }
  });

  res.status(200).json({
    success: true,
    message: 'Removed from watchlist',
    movieId: String(movieId)
  });
});

