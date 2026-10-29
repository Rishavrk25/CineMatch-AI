import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Film, ArrowLeft } from 'lucide-react';

export default function MovieDetails() {
  const { id } = useParams();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link to="/explore" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to catalog</span>
      </Link>

      <div className="glass-panel p-8 rounded-2xl space-y-4">
        <div className="flex items-center gap-3">
          <Film className="w-8 h-8 text-cinematic-amber" />
          <h1 className="text-2xl font-bold text-white">Movie Details ({id})</h1>
        </div>
        <p className="text-sm text-gray-400">
          Individual movie metadata, cast, director, and graph-connected recommendations will be displayed here.
        </p>
      </div>
    </div>
  );
}
