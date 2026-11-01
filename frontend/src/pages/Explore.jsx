import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Compass, Filter, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import movieApi from '../api/movieApi';
import MovieGrid from '../components/MovieGrid';
import GenreFilter from '../components/GenreFilter';
import SearchBar from '../components/SearchBar';

export default function Explore() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [movies, setMovies] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalMovies: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const currentGenre = searchParams.get('genre') || 'All';
  const currentSearch = searchParams.get('q') || '';
  const currentSort = searchParams.get('sort') || 'popularity';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  const fetchMovies = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await movieApi.getMovies({
        page: currentPage,
        limit: 16,
        genre: currentGenre === 'All' ? null : currentGenre,
        search: currentSearch || null,
        sort: currentSort
      });

      if (res.success) {
        setMovies(res.movies || []);
        setPagination(res.pagination || { page: 1, totalPages: 1, totalMovies: 0 });
      }
    } catch (err) {
      setError(err.message || 'Failed to load movie catalog');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, [currentGenre, currentSearch, currentSort, currentPage]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    // Reset to page 1 on filter/search change
    if (key !== 'page') {
      next.set('page', '1');
    }
    setSearchParams(next);
  };

  const handleSelectGenre = (genre) => {
    updateParam('genre', genre);
  };

  const handleSearchSubmit = (query) => {
    updateParam('q', query.trim());
  };

  const handleSortChange = (e) => {
    updateParam('sort', e.target.value);
  };

  const handlePageChange = (newPage) => {
    updateParam('page', String(newPage));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-charcoal-700/60 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <Compass className="w-8 h-8 text-cinematic-violet" />
            <span>Explore Catalog</span>
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Browse through 4,800+ canonical TMDB movies indexed with rich metadata and Neo4j relations.
          </p>
        </div>

        {/* Total count badge */}
        <div className="text-xs text-gray-400 font-mono bg-charcoal-800/80 px-3.5 py-1.5 rounded-full border border-charcoal-700 w-fit">
          <span>{pagination.totalMovies ? `${pagination.totalMovies.toLocaleString()} verified titles` : 'Loading...'}</span>
        </div>
      </div>

      {/* Controls Bar: Search & Sort */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <SearchBar
          value={currentSearch}
          onSubmit={handleSearchSubmit}
          placeholder="Filter by title or overview..."
          className="w-full md:max-w-md"
        />

        {/* Sort Selector */}
        <div className="flex items-center gap-2 self-end md:self-auto w-full sm:w-auto justify-end">
          <ArrowUpDown className="w-4 h-4 text-gray-400" />
          <span className="text-xs text-gray-400 font-medium">Sort by:</span>
          <select
            value={currentSort}
            onChange={handleSortChange}
            className="px-3 py-2 rounded-xl bg-charcoal-900 border border-charcoal-700 text-xs text-white focus:outline-none focus:border-cinematic-violet transition-colors"
          >
            <option value="popularity">Most Popular</option>
            <option value="rating">Highest Rated</option>
            <option value="year_desc">Newest Release</option>
            <option value="year_asc">Oldest Release</option>
            <option value="title">Alphabetical (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Genre Filter Pills */}
      <div>
        <GenreFilter selectedGenre={currentGenre} onSelectGenre={handleSelectGenre} />
      </div>

      {/* Movie Grid */}
      <MovieGrid
        movies={movies}
        loading={loading}
        error={error}
        emptyTitle="No Movies Match Your Query"
        emptyMessage="Try adjusting your genre filter or search query to find more titles."
        onRetry={fetchMovies}
      />

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && !loading && (
        <div className="flex items-center justify-center gap-4 pt-6 border-t border-charcoal-700/60">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="flex items-center gap-1 px-4 py-2 rounded-xl glass-panel border border-charcoal-700 text-xs font-semibold text-white hover:border-cinematic-violet disabled:opacity-40 disabled:hover:border-charcoal-700 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <span className="text-xs text-gray-400 font-medium">
            Page <span className="text-white font-bold">{currentPage}</span> of{' '}
            <span className="text-white font-bold">{pagination.totalPages}</span>
          </span>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= pagination.totalPages}
            className="flex items-center gap-1 px-4 py-2 rounded-xl glass-panel border border-charcoal-700 text-xs font-semibold text-white hover:border-cinematic-violet disabled:opacity-40 disabled:hover:border-charcoal-700 transition-all"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
