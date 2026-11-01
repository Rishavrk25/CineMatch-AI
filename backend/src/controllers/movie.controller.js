import { getMovieById, getMovies } from '../services/movieCatalog.service.js';
import { getGraphConnectedMovies } from '../services/graphSearch.service.js';
import { searchSimilarMovies } from '../services/vectorSearch.service.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listMovies = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page || '1', 10);
  const limit = Math.min(parseInt(req.query.limit || '20', 10), 100);
  const genre = req.query.genre || null;
  const yearMin = req.query.yearMin ? parseInt(req.query.yearMin, 10) : null;
  const yearMax = req.query.yearMax ? parseInt(req.query.yearMax, 10) : null;
  const search = req.query.search || null;
  const sort = req.query.sort || 'popularity';

  const result = getMovies({
    page,
    limit,
    genre,
    yearMin,
    yearMax,
    search,
    sort
  });

  res.status(200).json({
    success: true,
    ...result
  });
});

export const getMovie = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const movie = getMovieById(id);

  if (!movie) {
    throw ApiError.notFound(`Movie with ID ${id} not found`);
  }

  res.status(200).json({
    success: true,
    movie
  });
});

export const searchMovies = asyncHandler(async (req, res) => {
  const query = req.query.q || '';
  if (!query.trim()) {
    throw ApiError.badRequest('Search query "q" is required');
  }

  const result = getMovies({
    search: query,
    limit: 20
  });

  res.status(200).json({
    success: true,
    query,
    count: result.movies.length,
    movies: result.movies
  });
});

export const getSimilarMovies = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const movie = getMovieById(id);

  if (!movie) {
    throw ApiError.notFound(`Movie with ID ${id} not found`);
  }

  // 1. Graph-connected movies (shared director, cast, genre)
  const graphConnections = await getGraphConnectedMovies(id, 6).catch(() => []);

  // 2. Vector-similar movies (Pinecone)
  let vectorSimilar = [];
  try {
    vectorSimilar = await searchSimilarMovies({
      query: movie.documentText || movie.overview,
      topK: 6,
      exclusionIds: [id]
    });
  } catch {
    vectorSimilar = [];
  }

  res.status(200).json({
    success: true,
    movie: {
      movieId: movie.movieId,
      title: movie.title,
      releaseYear: movie.releaseYear
    },
    graphConnections,
    vectorSimilar
  });
});
