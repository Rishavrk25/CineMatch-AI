import React from 'react';

export default function LoadingSkeleton({ count = 4, type = 'card' }) {
  if (type === 'chat') {
    return (
      <div className="space-y-4 w-full">
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-charcoal-700 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-charcoal-700 rounded w-1/3 animate-pulse" />
            <div className="h-16 bg-charcoal-800 rounded-xl animate-shimmer" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl overflow-hidden bg-charcoal-800 border border-charcoal-700/60 shadow-lg animate-shimmer"
        >
          <div className="aspect-[2/3] w-full bg-charcoal-700" />
          <div className="p-4 space-y-3">
            <div className="h-5 bg-charcoal-700 rounded w-4/5" />
            <div className="h-3 bg-charcoal-700/60 rounded w-1/2" />
            <div className="flex gap-2 pt-2">
              <div className="h-4 bg-charcoal-700/40 rounded w-12" />
              <div className="h-4 bg-charcoal-700/40 rounded w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
