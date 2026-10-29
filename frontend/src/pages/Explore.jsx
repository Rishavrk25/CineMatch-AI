import React from 'react';
import { Compass, Sparkles } from 'lucide-react';

export default function Explore() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-charcoal-700/60 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <Compass className="w-8 h-8 text-cinematic-violet" />
            <span>Explore Cinema</span>
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Browse through the verified TMDB catalog by genre, release year, and rating.
          </p>
        </div>
      </div>

      <div className="glass-panel p-8 rounded-2xl text-center space-y-3">
        <Sparkles className="w-8 h-8 text-cinematic-amber mx-auto" />
        <h3 className="text-lg font-semibold text-white">Movie Grid & Filters</h3>
        <p className="text-sm text-gray-400 max-w-md mx-auto">
          Catalog browsing will load dynamically once dataset ingestion is initialized in Phase 3.
        </p>
      </div>
    </div>
  );
}
