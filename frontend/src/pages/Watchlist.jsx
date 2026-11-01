import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Trash2, Film, Sparkles, Compass } from 'lucide-react';
import watchlistApi from '../api/watchlistApi';
import { useAuth } from '../hooks/useAuth';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import ErrorMessage from '../components/ErrorMessage';
import MovieCard from '../components/MovieCard';

export default function Watchlist() {
  const { watchlistIds, toggleWatchlist } = useAuth();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWatchlist = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await watchlistApi.getWatchlist();
      if (res.success) {
        setMovies(res.watchlist || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch watchlist');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWatchlist();
  }, [watchlistIds]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-charcoal-700/60 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <Bookmark className="w-8 h-8 text-cinematic-amber" />
            <span>My Watchlist</span>
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Bookmarked films synced to your MongoDB profile and utilized for personalized graph matching.
          </p>
        </div>

        <div className="text-xs text-gray-300 font-mono bg-charcoal-800 px-3.5 py-1.5 rounded-full border border-charcoal-700 w-fit">
          <span>{movies.length} {movies.length === 1 ? 'title' : 'titles'} saved</span>
        </div>
      </div>

      {/* Loading state */}
      {loading && <LoadingSkeleton type="grid" count={4} />}

      {/* Error state */}
      {error && !loading && (
        <ErrorMessage
          title="Watchlist Error"
          message={error}
          onRetry={fetchWatchlist}
        />
      )}

      {/* Empty State */}
      {!loading && !error && movies.length === 0 && (
        <div className="py-12">
          <EmptyState
            title="Your Watchlist is Empty"
            description="Explore our cinema catalog or chat with the CineMatch RAG assistant to discover and save films."
            actionText="Explore Cinema Catalog"
            actionLink="/explore"
          />
        </div>
      )}

      {/* Movies Grid */}
      {!loading && !error && movies.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {movies.map((movie) => (
            <MovieCard
              key={movie.movieId || movie.id}
              movie={movie}
            />
          ))}
        </div>
      )}
    </div>
  );
}
