import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Film,
  ArrowLeft,
  Calendar,
  Clock,
  Star,
  Bookmark,
  DollarSign,
  Network,
  Cpu,
  User,
  Tag
} from 'lucide-react';
import movieApi from '../api/movieApi';
import { useAuth } from '../hooks/useAuth';
import { formatRuntime, formatCurrency, formatYear, formatScore } from '../utils/formatters';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ErrorMessage from '../components/ErrorMessage';
import MovieCard from '../components/MovieCard';

export default function MovieDetails() {
  const { id } = useParams();
  const { isMovieInWatchlist, toggleWatchlist } = useAuth();

  const [movie, setMovie] = useState(null);
  const [similar, setSimilar] = useState({ graphConnections: [], vectorSimilar: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isSaved = isMovieInWatchlist(id);

  const fetchMovieDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const [movieRes, similarRes] = await Promise.all([
        movieApi.getMovieById(id),
        movieApi.getSimilarMovies(id).catch(() => ({ graphConnections: [], vectorSimilar: [] }))
      ]);

      if (movieRes.success) {
        setMovie(movieRes.movie);
      }
      if (similarRes) {
        setSimilar({
          graphConnections: similarRes.graphConnections || [],
          vectorSimilar: similarRes.vectorSimilar || []
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to load movie details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovieDetails();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto py-6">
        <LoadingSkeleton type="card" count={1} />
        <LoadingSkeleton type="grid" count={4} />
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <ErrorMessage
          title="Movie Not Found"
          message={error || `Could not find movie with ID ${id}`}
          onRetry={fetchMovieDetails}
        />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10 py-4">
      {/* Back button */}
      <Link
        to="/explore"
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to catalog</span>
      </Link>

      {/* Main Movie Hero Banner */}
      <div className="glass-panel border border-charcoal-700/70 rounded-3xl p-6 sm:p-10 relative overflow-hidden">
        {/* Ambient subtle glow background */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-cinematic-violet/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
          {/* Poster Card */}
          <div className="w-full md:w-64 aspect-[2/3] rounded-2xl bg-gradient-to-br from-charcoal-800 to-black border border-charcoal-700 overflow-hidden relative shrink-0 shadow-2xl flex items-center justify-center">
            {movie.posterUrl ? (
              <img
                src={movie.posterUrl}
                alt={movie.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : null}
            <div className="absolute inset-0 -z-0 flex flex-col items-center justify-center p-6 text-center">
              <Film className="w-16 h-16 text-cinematic-violet/40 mb-3" />
              <span className="text-sm font-bold text-gray-300">{movie.title}</span>
              <span className="text-xs text-gray-500 mt-1">{movie.releaseYear}</span>
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 space-y-6">
            <div>
              <div className="flex items-center justify-between gap-4">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  {movie.title}
                </h1>
                <button
                  onClick={() => toggleWatchlist(id)}
                  aria-label="Toggle Watchlist"
                  className={`p-3 rounded-2xl border transition-all shrink-0 ${
                    isSaved
                      ? 'bg-cinematic-amber text-charcoal-950 border-cinematic-amber shadow-lg shadow-cinematic-amber/20'
                      : 'glass-panel text-gray-300 hover:text-white border-charcoal-700 hover:border-cinematic-violet'
                  }`}
                >
                  <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
                </button>
              </div>

              {movie.tagline && (
                <p className="text-sm italic text-cinematic-amber/90 mt-2 font-normal">
                  &ldquo;{movie.tagline}&rdquo;
                </p>
              )}
            </div>

            {/* Quick stats badges */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
              {movie.voteAverage > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-charcoal-800 border border-charcoal-700 text-cinematic-amber font-semibold">
                  <Star className="w-4 h-4 fill-cinematic-amber text-cinematic-amber" />
                  <span>{movie.voteAverage.toFixed(1)} / 10</span>
                  <span className="text-gray-400 font-normal">({movie.voteCount} votes)</span>
                </div>
              )}

              {movie.releaseYear && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-charcoal-800 border border-charcoal-700 text-gray-300">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  <span>{movie.releaseYear}</span>
                </div>
              )}

              {movie.runtime > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-charcoal-800 border border-charcoal-700 text-gray-300">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <span>{formatRuntime(movie.runtime)}</span>
                </div>
              )}
            </div>

            {/* Genres */}
            {movie.genres && movie.genres.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {movie.genres.map((g) => (
                  <span
                    key={g}
                    className="px-3 py-1 rounded-full text-xs font-semibold bg-cinematic-violet/15 border border-cinematic-violet/30 text-cinematic-violet"
                  >
                    {g}
                  </span>
                ))}
              </div>
            )}

            {/* Overview */}
            {movie.overview && (
              <div className="space-y-1.5">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Synopsis</h3>
                <p className="text-sm text-gray-200 leading-relaxed">{movie.overview}</p>
              </div>
            )}

            {/* Crew & Cast Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-charcoal-700/60 text-xs">
              <div>
                <span className="text-gray-500 font-semibold block mb-1">Director</span>
                <span className="text-white font-medium text-sm flex items-center gap-1.5">
                  <User className="w-4 h-4 text-cinematic-violet" />
                  {movie.director || 'Unknown'}
                </span>
              </div>

              <div>
                <span className="text-gray-500 font-semibold block mb-1">Starring Cast</span>
                <span className="text-white font-medium text-sm">
                  {movie.cast && movie.cast.length > 0 ? movie.cast.slice(0, 4).join(', ') : 'Not Listed'}
                </span>
              </div>
            </div>

            {/* Financial stats if available */}
            {(movie.budget > 0 || movie.revenue > 0) && (
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-charcoal-700/60 text-xs">
                <div>
                  <span className="text-gray-500 block">Production Budget</span>
                  <span className="text-white font-mono">{formatCurrency(movie.budget)}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Box Office Revenue</span>
                  <span className="text-white font-mono">{formatCurrency(movie.revenue)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Graph-Connected Movies (Neo4j) */}
      {similar.graphConnections && similar.graphConnections.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2.5">
            <Network className="w-5 h-5 text-cinematic-cyan" />
            <h2 className="text-xl font-bold text-white">Neo4j Graph-Connected Films</h2>
            <span className="text-xs text-gray-400">
              (Shared directors, actors, and genre pathways)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {similar.graphConnections.map((conn) => (
              <div
                key={conn.movieId}
                className="glass-panel border border-charcoal-700/60 rounded-xl p-4 hover:border-cinematic-cyan/50 transition-all space-y-2"
              >
                <div className="flex items-center justify-between">
                  <Link
                    to={`/movies/${conn.movieId}`}
                    className="font-bold text-sm text-white hover:text-cinematic-cyan transition-colors line-clamp-1"
                  >
                    {conn.title}
                  </Link>
                  {conn.releaseYear && (
                    <span className="text-xs text-gray-500">{conn.releaseYear}</span>
                  )}
                </div>

                <div className="text-[11px] text-cinematic-cyan/90 font-medium bg-charcoal-900/80 p-2 rounded-lg border border-charcoal-700/50">
                  {conn.relationshipSummary || 'Connected via shared cast and genre'}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Vector-Similar Movies (Pinecone) */}
      {similar.vectorSimilar && similar.vectorSimilar.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-cinematic-violet" />
            <h2 className="text-xl font-bold text-white">Semantically Similar Films</h2>
            <span className="text-xs text-gray-400">
              (High cosine similarity via Gemini Embeddings)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {similar.vectorSimilar.map((vec) => (
              <div
                key={vec.movieId}
                className="glass-panel border border-charcoal-700/60 rounded-xl p-4 hover:border-cinematic-violet/50 transition-all space-y-2"
              >
                <div className="flex items-center justify-between">
                  <Link
                    to={`/movies/${vec.movieId}`}
                    className="font-bold text-sm text-white hover:text-cinematic-violet transition-colors line-clamp-1"
                  >
                    {vec.metadata?.title || vec.movieId}
                  </Link>
                  <span className="text-xs text-cinematic-violet font-bold">
                    {formatScore(vec.score)}
                  </span>
                </div>
                {vec.metadata?.genres && (
                  <div className="flex flex-wrap gap-1">
                    {vec.metadata.genres.slice(0, 3).map((g) => (
                      <span
                        key={g}
                        className="text-[10px] px-2 py-0.5 rounded bg-charcoal-800 text-gray-300"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
