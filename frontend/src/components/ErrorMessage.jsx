import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function ErrorMessage({ title = 'Error', message, onRetry }) {
  return (
    <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-200 flex flex-col items-center text-center max-w-lg mx-auto my-8">
      <div className="w-12 h-12 rounded-full bg-rose-500/20 flex items-center justify-center mb-3 text-rose-400">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-semibold text-rose-100">{title}</h3>
      <p className="text-sm text-rose-300/80 mt-1 mb-4">{message || 'Something went wrong. Please try again.'}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-sm font-medium transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Try Again</span>
        </button>
      )}
    </div>
  );
}
