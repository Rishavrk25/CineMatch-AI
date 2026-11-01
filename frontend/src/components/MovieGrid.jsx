import React from 'react';
import MovieCard from './MovieCard';
import LoadingSkeleton from './LoadingSkeleton';
import EmptyState from './EmptyState';
import ErrorMessage from './ErrorMessage';

export default function MovieGrid({
  movies = [],
  loading = false,
  error = null,
  emptyTitle = 'No Movies Found',
  emptyMessage = 'No movies matched your current filters or query.',
  onRetry = null
}) {
  if (loading) {
    return <LoadingSkeleton type="grid" count={8} />;
  }

  if (error) {
    return (
      <ErrorMessage
        title="Failed to Load Movies"
        message={error}
        onRetry={onRetry}
      />
    );
  }

  if (!movies || movies.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyMessage}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {movies.map((movie) => (
        <MovieCard
          key={movie.movieId || movie.id}
          movie={movie}
          score={movie.score || movie.finalScore}
          reason={movie.reason}
        />
      ))}
    </div>
  );
}
