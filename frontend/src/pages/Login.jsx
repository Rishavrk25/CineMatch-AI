import React from 'react';
import { Link } from 'react-router-dom';
import { LogIn, Film } from 'lucide-react';

export default function Login() {
  return (
    <div className="max-w-md mx-auto py-12">
      <div className="glass-panel p-8 rounded-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-cinematic-violet/20 text-cinematic-violet flex items-center justify-center mx-auto">
            <Film className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
          <p className="text-xs text-gray-400">Sign in to sync your watchlists and personalized tastes</p>
        </div>

        <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Email Address</label>
            <input
              type="email"
              placeholder="user@example.com"
              className="w-full px-4 py-2.5 rounded-xl bg-charcoal-800 border border-charcoal-700 text-white placeholder-gray-500 focus:outline-none focus:border-cinematic-violet text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-xl bg-charcoal-800 border border-charcoal-700 text-white placeholder-gray-500 focus:outline-none focus:border-cinematic-violet text-sm"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cinematic-violet to-cinematic-violetHover text-white font-semibold text-sm shadow-lg shadow-cinematic-violet/25 hover:opacity-95 transition-all flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In</span>
          </button>
        </form>

        <p className="text-center text-xs text-gray-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-cinematic-violet hover:underline font-medium">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
