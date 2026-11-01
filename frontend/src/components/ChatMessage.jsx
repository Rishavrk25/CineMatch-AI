import React from 'react';
import { User, Sparkles, Filter, Bookmark, Film, Star, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import RecommendationReason from './RecommendationReason';
import { formatScore, formatYear } from '../utils/formatters';
import { useAuth } from '../hooks/useAuth';

export default function ChatMessage({ message, onSelectSuggestion }) {
  const { isMovieInWatchlist, toggleWatchlist, isAuthenticated } = useAuth();
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 sm:gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {/* Assistant Avatar */}
      {!isUser && (
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-cinematic-violet/20 border border-cinematic-violet/30 flex items-center justify-center text-cinematic-violet shrink-0 mt-1">
          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-cinematic-amber" />
        </div>
      )}

      {/* Message Content Container */}
      <div className={`space-y-4 max-w-3xl ${isUser ? 'w-auto' : 'w-full'}`}>
        {/* Main Text Bubble */}
        <div
          className={`p-4 sm:p-5 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? 'bg-cinematic-violet text-white rounded-br-none shadow-lg shadow-cinematic-violet/20 font-medium'
              : 'glass-panel border border-charcoal-700/60 text-gray-200 rounded-bl-none'
          }`}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>

        {/* Applied Constraints Tag Bar (for assistant messages) */}
        {!isUser && message.appliedConstraints && (
          <div className="flex flex-wrap items-center gap-2 px-1">
            <span className="text-[11px] text-gray-400 font-medium flex items-center gap-1">
              <Filter className="w-3 h-3 text-cinematic-violet" /> Constraints Applied:
            </span>
            {message.appliedConstraints.negativeGenres?.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-red-950/60 border border-red-800/50 text-[10px] text-red-300 font-medium">
                Exclude: {message.appliedConstraints.negativeGenres.join(', ')}
              </span>
            )}
            {message.appliedConstraints.minYear && (
              <span className="px-2 py-0.5 rounded-full bg-charcoal-800 border border-charcoal-700 text-[10px] text-gray-300 font-medium">
                Year &ge; {message.appliedConstraints.minYear}
              </span>
            )}
            {message.appliedConstraints.maxYear && (
              <span className="px-2 py-0.5 rounded-full bg-charcoal-800 border border-charcoal-700 text-[10px] text-gray-300 font-medium">
                Year &le; {message.appliedConstraints.maxYear}
              </span>
            )}
          </div>
        )}

        {/* Recommended Movies Cards */}
        {!isUser && message.recommendations && message.recommendations.length > 0 && (
          <div className="space-y-3 pt-1">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">
              Top Ranked Grounded Matches ({message.recommendations.length})
            </h4>

            <div className="space-y-3">
              {message.recommendations.map((rec) => {
                const movieId = rec.movieId;
                const isSaved = isMovieInWatchlist(movieId);

                return (
                  <div
                    key={movieId}
                    className="glass-panel border border-charcoal-700/70 hover:border-cinematic-violet/50 rounded-2xl p-4 sm:p-5 transition-all space-y-3"
                  >
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            to={`/movies/${movieId}`}
                            className="text-base sm:text-lg font-bold text-white hover:text-cinematic-violet transition-colors"
                          >
                            {rec.title}
                          </Link>
                          {rec.releaseYear && (
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-gray-500" />
                              ({rec.releaseYear})
                            </span>
                          )}
                        </div>

                        {/* Genres */}
                        {rec.genres && rec.genres.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-0.5">
                            {rec.genres.map((g) => (
                              <span
                                key={g}
                                className="px-2 py-0.5 rounded-md bg-charcoal-800 border border-charcoal-700 text-[10px] text-gray-300 font-medium"
                              >
                                {g}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Right actions: Match Score + Bookmark */}
                      <div className="flex items-center gap-2 shrink-0">
                        {rec.score !== undefined && (
                          <div className="px-2.5 py-1 rounded-full bg-cinematic-violet/20 border border-cinematic-violet/40 text-cinematic-violet text-xs font-bold flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-cinematic-amber" />
                            <span>{formatScore(rec.score)}</span>
                          </div>
                        )}

                        <button
                          onClick={() => toggleWatchlist(movieId)}
                          aria-label="Save to Watchlist"
                          className={`p-2 rounded-xl border transition-all ${
                            isSaved
                              ? 'bg-cinematic-amber text-charcoal-950 border-cinematic-amber'
                              : 'bg-charcoal-800/80 text-gray-400 hover:text-white border-charcoal-700 hover:border-cinematic-violet'
                          }`}
                        >
                          <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {/* Grounded Explanation + Graph Evidence component */}
                    <RecommendationReason
                      reason={rec.reason}
                      matchedThemes={rec.matchedThemes}
                      graphEvidence={rec.graphEvidence}
                      scoreBreakdown={rec.scoreBreakdown}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Suggestion Chips */}
        {!isUser && message.suggestions && message.suggestions.length > 0 && (
          <div className="space-y-1.5 pt-1 px-1">
            <span className="text-[11px] text-gray-400 font-medium">Suggested follow-ups:</span>
            <div className="flex flex-wrap gap-2">
              {message.suggestions.map((sug, i) => (
                <button
                  key={i}
                  onClick={() => onSelectSuggestion && onSelectSuggestion(sug)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-charcoal-800/80 hover:bg-cinematic-violet/20 text-gray-300 hover:text-white border border-charcoal-700 hover:border-cinematic-violet/50 transition-all text-left"
                >
                  &ldquo;{sug}&rdquo;
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-charcoal-800 border border-charcoal-700 flex items-center justify-center text-gray-300 shrink-0 mt-1">
          <User className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
      )}
    </div>
  );
}
