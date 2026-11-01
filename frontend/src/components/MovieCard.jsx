import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star, Bookmark, Film, Calendar, Sparkles } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { formatScore, formatYear } from '../utils/formatters';
import { API_BASE_URL } from '../api/client';

export default function MovieCard({ movie, score, reason }) {
  const { isAuthenticated, isMovieInWatchlist, toggleWatchlist } = useAuth();
  const navigate = useNavigate();

  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const movieId = movie.movieId || movie.id;
  const isBookmarked = isMovieInWatchlist(movieId);
  const voteAverage = movie.voteAverage || movie.rating || 0;
  const releaseYear = movie.releaseYear || formatYear(movie.releaseDate);
  const genres = Array.isArray(movie.genres) ? movie.genres : [];
  const posterSrc = movie.posterUrl?.startsWith('http') ? movie.posterUrl : `${API_BASE_URL}/movies/${movieId}/poster`;

  const handleBookmarkClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      await toggleWatchlist(movieId);
    } catch (err) {
      console.error('Failed to update watchlist:', err);
    }
  };

  return (
    <div className="group relative flex flex-col rounded-2xl glass-panel border border-charcoal-700/60 overflow-hidden hover:border-cinematic-violet/50 hover:shadow-xl hover:shadow-cinematic-violet/10 transition-all duration-300">
      {/* Poster Image Container */}
      <div className="relative aspect-[2/3] bg-gradient-to-br from-charcoal-800 via-charcoal-900 to-black overflow-hidden flex items-center justify-center">
        {/* Real Poster Image */}
        {!imgError && posterSrc && (
          <img
            src={posterSrc}
            alt={movie.title}
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
            className={`absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-all duration-500 ${
              imgLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}

        {/* Fallback Icon when loading or image failed */}
        {(!imgLoaded || imgError) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-charcoal-800 via-charcoal-900 to-black">
            <Film className="w-12 h-12 text-charcoal-700 group-hover:scale-110 group-hover:text-cinematic-violet/50 transition-all duration-500 mb-2" />
            <span className="text-xs font-semibold text-gray-400 line-clamp-1">{movie.title}</span>
          </div>
        )}

        {/* Cinematic Gradient Vignette Overlay for Readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/90 via-transparent to-black/50 pointer-events-none" />

        {/* Rating Badge */}
        {voteAverage > 0 && (
          <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-xs font-semibold text-cinematic-amber z-10">
            <Star className="w-3.5 h-3.5 fill-cinematic-amber text-cinematic-amber" />
            <span>{voteAverage.toFixed(1)}</span>
          </div>
        )}

        {/* RAG Match Score Pill */}
        {score !== undefined && score !== null && (
          <div className="absolute top-3 right-12 flex items-center gap-1 px-2.5 py-1 rounded-full bg-cinematic-violet/80 backdrop-blur-md border border-cinematic-violet text-xs font-bold text-white shadow-lg shadow-cinematic-violet/20 z-10">
            <Sparkles className="w-3 h-3 text-cinematic-amber" />
            <span>{formatScore(score)}</span>
          </div>
        )}

        {/* Watchlist Toggle Button */}
        <button
          onClick={handleBookmarkClick}
          aria-label={isBookmarked ? 'Remove from Watchlist' : 'Add to Watchlist'}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md border transition-all z-10 ${
            isBookmarked
              ? 'bg-cinematic-amber text-charcoal-950 border-cinematic-amber'
              : 'bg-black/60 text-gray-300 hover:text-white border-white/10 hover:border-cinematic-violet'
          }`}
        >
          <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
        </button>

        {/* Release Year Pill */}
        {releaseYear && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-sm text-[11px] font-medium text-gray-200 z-10">
            <Calendar className="w-3 h-3 text-gray-400" />
            <span>{releaseYear}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <Link
            to={`/movies/${movieId}`}
            className="text-base font-bold text-white group-hover:text-cinematic-violet transition-colors line-clamp-1"
          >
            {movie.title}
          </Link>

          {/* Genres */}
          {genres.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {genres.slice(0, 3).map((g) => (
                <span
                  key={g}
                  className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-charcoal-800 text-gray-300 border border-charcoal-700"
                >
                  {g}
                </span>
              ))}
            </div>
          )}

          {/* Director & Cast snippet if present */}
          {(movie.director || (movie.cast && movie.cast.length > 0) || (movie.directors && movie.directors.length > 0)) && (
            <div className="text-xs text-gray-400 mt-2 space-y-0.5">
              {(movie.director || (movie.directors && movie.directors[0])) && (
                <p className="line-clamp-1">
                  <span className="text-gray-500 font-medium">Dir:</span> {movie.director || movie.directors[0]}
                </p>
              )}
              {movie.cast && movie.cast.length > 0 && (
                <p className="line-clamp-1">
                  <span className="text-gray-500 font-medium">Cast:</span> {movie.cast.slice(0, 2).join(', ')}
                </p>
              )}
            </div>
          )}

          {/* Overview Snippet */}
          {movie.overview && (
            <p className="text-xs text-gray-400 line-clamp-2 mt-2 leading-relaxed">
              {movie.overview}
            </p>
          )}

          {/* Grounded RAG explanation if provided */}
          {reason && (
            <div className="mt-3 p-2.5 rounded-xl bg-cinematic-violet/10 border border-cinematic-violet/20 text-xs text-gray-200">
              <span className="text-cinematic-violet font-semibold block mb-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cinematic-amber" /> Why it matches:
              </span>
              <p className="line-clamp-3 text-gray-300 leading-snug">{reason}</p>
            </div>
          )}
        </div>

        <Link
          to={`/movies/${movieId}`}
          className="text-xs font-semibold text-cinematic-violet hover:text-cinematic-violetHover pt-2 inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
        >
          View Full Graph Details &rarr;
        </Link>
      </div>
    </div>
  );
}
