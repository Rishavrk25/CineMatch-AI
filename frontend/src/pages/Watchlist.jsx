import React from 'react';
import { Bookmark, Sparkles } from 'lucide-react';

export default function Watchlist() {
  return (
    <div className="space-y-6">
      <div className="border-b border-charcoal-700/60 pb-6">
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
          <Bookmark className="w-8 h-8 text-cinematic-amber" />
          <span>My Watchlist</span>
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Movies you have bookmarked for later viewing and personalized taste matching.
        </p>
      </div>

      <div className="glass-panel p-8 rounded-2xl text-center space-y-3">
        <p className="text-sm text-gray-400">
          User authentication and saved watchlist records will be connected in Phase 7.
        </p>
      </div>
    </div>
  );
}
