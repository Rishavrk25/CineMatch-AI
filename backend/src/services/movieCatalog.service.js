import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CANONICAL_MOVIES_PATH = path.resolve(__dirname, '../../../data/canonical_movies.json');

let moviesMap = null;
let moviesList = null;

function loadCatalog() {
  if (moviesMap) return { moviesMap, moviesList };

  try {
    if (fs.existsSync(CANONICAL_MOVIES_PATH)) {
      const raw = fs.readFileSync(CANONICAL_MOVIES_PATH, 'utf-8');
      moviesList = JSON.parse(raw);
      moviesMap = new Map();
      for (const m of moviesList) {
        moviesMap.set(String(m.movieId), m);
      }
      logger.info(`Movie catalog loaded into memory (${moviesList.length} movies).`);
    } else {
      logger.warn(`Movie catalog not found at ${CANONICAL_MOVIES_PATH}`);
      moviesList = [];
      moviesMap = new Map();
    }
  } catch (err) {
    logger.error('Failed to load canonical movies catalog:', err.message);
    moviesList = [];
    moviesMap = new Map();
  }

  return { moviesMap, moviesList };
}

/**
 * Gets a movie by its canonical TMDB ID.
 */
export function getMovieById(id) {
  const { moviesMap } = loadCatalog();
  return moviesMap.get(String(id)) || null;
}

/**
 * Gets paginated movie list with filters.
 */
export function getMovies({
  page = 1,
  limit = 20,
  genre = null,
  yearMin = null,
  yearMax = null,
  search = null,
  sort = 'popularity'
}) {
  const { moviesList } = loadCatalog();
  let filtered = [...moviesList];

  if (genre) {
    const genreLower = genre.toLowerCase();
    filtered = filtered.filter(m => (m.genres || []).some(g => g.toLowerCase() === genreLower));
  }

  if (yearMin !== null) {
    filtered = filtered.filter(m => m.releaseYear && m.releaseYear >= yearMin);
  }

  if (yearMax !== null) {
    filtered = filtered.filter(m => m.releaseYear && m.releaseYear <= yearMax);
  }

  if (search && search.trim()) {
    const query = search.toLowerCase().trim();
    filtered = filtered.filter(m =>
      (m.title && m.title.toLowerCase().includes(query)) ||
      (m.directors && m.directors.some(d => d.toLowerCase().includes(query))) ||
      (m.topCast && m.topCast.some(c => (c.name || c).toLowerCase().includes(query))) ||
      (m.overview && m.overview.toLowerCase().includes(query))
    );
  }

  // Sorting
  if (sort === 'rating') {
    filtered.sort((a, b) => (b.voteAverage || 0) - (a.voteAverage || 0));
  } else if (sort === 'year_desc') {
    filtered.sort((a, b) => (b.releaseYear || 0) - (a.releaseYear || 0));
  } else if (sort === 'year_asc') {
    filtered.sort((a, b) => (a.releaseYear || 0) - (b.releaseYear || 0));
  } else {
    // Default popularity
    filtered.sort((a, b) => ((b.popularity || 0) * (b.voteCount || 0)) - ((a.popularity || 0) * (a.voteCount || 0)));
  }

  const total = filtered.length;
  const startIndex = (page - 1) * limit;
  const items = filtered.slice(startIndex, startIndex + limit);

  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    movies: items
  };
}

