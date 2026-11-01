import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Bookmark, Heart, LogOut, Check, Sparkles, Clock, History } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import watchlistApi from '../api/watchlistApi';

const AVAILABLE_GENRES = [
  'Action', 'Adventure', 'Animation', 'Comedy', 'Crime',
  'Drama', 'Family', 'Fantasy', 'Horror', 'Mystery',
  'Romance', 'Science Fiction', 'Thriller', 'War'
];

export default function Profile() {
  const { user, logout, updatePreferences, watchlistIds } = useAuth();
  const navigate = useNavigate();

  const [selectedGenres, setSelectedGenres] = useState(user?.favoriteGenres || []);
  const [interactions, setInteractions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (user?.favoriteGenres) {
      setSelectedGenres(user.favoriteGenres);
    }
  }, [user]);

  useEffect(() => {
    const fetchInteractions = async () => {
      try {
        const res = await watchlistApi.getMyInteractions();
        if (res.success) {
          setInteractions(res.interactions || []);
        }
      } catch (err) {
        console.warn('Could not load interactions:', err);
      }
    };

    fetchInteractions();
  }, []);

  const handleToggleGenre = (genre) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
    setSavedSuccess(false);
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    try {
      await updatePreferences({ favoriteGenres: selectedGenres });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save preferences:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      {/* Header */}
      <div className="glass-panel border border-charcoal-700/70 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cinematic-violet to-cinematic-amber flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-cinematic-violet/20">
            {user?.name ? user.name[0].toUpperCase() : 'U'}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white">{user?.name}</h1>
            <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
              <Mail className="w-3.5 h-3.5 text-gray-500" />
              <span>{user?.email}</span>
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-charcoal-800 hover:bg-red-950/40 text-gray-300 hover:text-red-400 border border-charcoal-700 text-xs font-semibold transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          to="/watchlist"
          className="glass-panel border border-charcoal-700/60 rounded-2xl p-6 hover:border-cinematic-amber/50 transition-all flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-xs text-gray-400 font-medium">Saved to Watchlist</span>
            <div className="text-2xl font-bold text-white">{watchlistIds.size} titles</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-cinematic-amber/20 border border-cinematic-amber/30 flex items-center justify-center text-cinematic-amber">
            <Bookmark className="w-6 h-6 fill-cinematic-amber" />
          </div>
        </Link>

        <div className="glass-panel border border-charcoal-700/60 rounded-2xl p-6 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-gray-400 font-medium">Logged Interactions</span>
            <div className="text-2xl font-bold text-white">{interactions.length} activities</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-cinematic-violet/20 border border-cinematic-violet/30 flex items-center justify-center text-cinematic-violet">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Genre Preferences Setting */}
      <div className="glass-panel border border-charcoal-700/70 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Heart className="w-5 h-5 text-cinematic-violet" />
              <span>Favorite Movie Genres</span>
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Select genres to dynamically weight personalized hybrid recommendations (+10% score boost).
            </p>
          </div>

          <button
            onClick={handleSavePreferences}
            disabled={saving}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-cinematic-violet hover:bg-cinematic-violetHover text-white text-xs font-semibold shadow-md shadow-cinematic-violet/20 disabled:opacity-50 transition-all"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Saved!</span>
              </>
            ) : (
              <span>Save Preferences</span>
            )}
          </button>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {AVAILABLE_GENRES.map((genre) => {
            const isSelected = selectedGenres.includes(genre);
            return (
              <button
                key={genre}
                onClick={() => handleToggleGenre(genre)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-cinematic-violet text-white border border-cinematic-violet shadow-sm shadow-cinematic-violet/30'
                    : 'bg-charcoal-900 text-gray-400 hover:text-white border border-charcoal-700'
                }`}
              >
                {genre}
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Activity Log */}
      <div className="glass-panel border border-charcoal-700/70 rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg font-bold text-white">Recent Activity</h2>
        </div>

        {interactions.length === 0 ? (
          <p className="text-xs text-gray-500 py-4">No recent interactions recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {interactions.slice(0, 5).map((act, i) => (
              <div
                key={act._id || i}
                className="flex items-center justify-between p-3 rounded-xl bg-charcoal-900 border border-charcoal-700/60 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="capitalize px-2 py-0.5 rounded bg-charcoal-800 text-gray-300 font-mono text-[10px]">
                    {act.interactionType}
                  </span>
                  <span className="text-white font-medium">Movie #{act.movieId}</span>
                </div>
                <span className="text-gray-500 text-[11px]">
                  {new Date(act.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
