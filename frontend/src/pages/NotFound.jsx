import React from 'react';
import { Link } from 'react-router-dom';
import { Film, Home as HomeIcon } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 rounded-2xl bg-charcoal-800 border border-charcoal-700 flex items-center justify-center text-cinematic-violet mb-6">
        <Film className="w-10 h-10" />
      </div>
      <h1 className="text-4xl font-extrabold text-white mb-2">404</h1>
      <h2 className="text-xl font-semibold text-gray-300 mb-4">Scene Not Found</h2>
      <p className="text-sm text-gray-400 max-w-md mb-8">
        The cinematic reel you're looking for seems to have been cut from the final screening.
      </p>
      <Link
        to="/"
        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-cinematic-violet hover:bg-cinematic-violetHover text-white font-medium text-sm transition-all"
      >
        <HomeIcon className="w-4 h-4" />
        <span>Return to Home</span>
      </Link>
    </div>
  );
}
