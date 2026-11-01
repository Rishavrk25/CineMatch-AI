import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Film, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim() || !email.trim() || !password) {
      setFormError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await register(name.trim(), email.trim(), password);
      navigate('/profile');
    } catch (err) {
      setFormError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-10">
      <div className="glass-panel p-8 rounded-3xl border border-charcoal-700/80 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-cinematic-violet/20 border border-cinematic-violet/30 text-cinematic-violet flex items-center justify-center mx-auto">
            <Film className="w-6 h-6 text-cinematic-amber" />
          </div>
          <h2 className="text-2xl font-bold text-white">Join CineMatch AI</h2>
          <p className="text-xs text-gray-400">Personalize your cinema recommendations with Neo4j and Gemini</p>
        </div>

        {formError && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-950/60 border border-red-800/60 text-red-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Alex Walker"
              className="w-full px-4 py-3 rounded-xl bg-charcoal-900 border border-charcoal-700 text-white placeholder-gray-500 focus:outline-none focus:border-cinematic-violet focus:ring-1 focus:ring-cinematic-violet text-sm transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="user@example.com"
              className="w-full px-4 py-3 rounded-xl bg-charcoal-900 border border-charcoal-700 text-white placeholder-gray-500 focus:outline-none focus:border-cinematic-violet focus:ring-1 focus:ring-cinematic-violet text-sm transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">Password (Min. 6 chars)</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl bg-charcoal-900 border border-charcoal-700 text-white placeholder-gray-500 focus:outline-none focus:border-cinematic-violet focus:ring-1 focus:ring-cinematic-violet text-sm transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl bg-charcoal-900 border border-charcoal-700 text-white placeholder-gray-500 focus:outline-none focus:border-cinematic-violet focus:ring-1 focus:ring-cinematic-violet text-sm transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cinematic-violet to-cinematic-violetHover text-white font-semibold text-sm shadow-lg shadow-cinematic-violet/25 hover:opacity-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Create Account</span>
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="text-cinematic-violet hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
