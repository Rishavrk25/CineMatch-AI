import React from 'react';

const GENRES = [
  'All',
  'Action',
  'Adventure',
  'Animation',
  'Comedy',
  'Crime',
  'Drama',
  'Family',
  'Fantasy',
  'Horror',
  'Mystery',
  'Romance',
  'Science Fiction',
  'Thriller',
  'War'
];

export default function GenreFilter({ selectedGenre = 'All', onSelectGenre }) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none no-scrollbar">
      {GENRES.map((genre) => {
        const isSelected = (selectedGenre === 'All' && genre === 'All') || selectedGenre === genre;
        return (
          <button
            key={genre}
            onClick={() => onSelectGenre(genre === 'All' ? null : genre)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
              isSelected
                ? 'bg-cinematic-violet text-white shadow-md shadow-cinematic-violet/30 border border-cinematic-violet'
                : 'glass-panel text-gray-400 hover:text-white border border-charcoal-700/60 hover:border-charcoal-600'
            }`}
          >
            {genre}
          </button>
        );
      })}
    </div>
  );
}
