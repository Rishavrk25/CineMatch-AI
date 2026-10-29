import React from 'react';
import { Film, Search } from 'lucide-react';

export default function EmptyState({
  icon: Icon = Film,
  title = 'No movies found',
  description = 'Try adjusting your search query, filters, or prompt.',
  action
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center max-w-md mx-auto my-12 glass-panel rounded-2xl">
      <div className="w-16 h-16 rounded-2xl bg-charcoal-800 border border-charcoal-700 flex items-center justify-center text-cinematic-violet mb-4">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-400 mb-6">{description}</p>
      {action && action}
    </div>
  );
}
