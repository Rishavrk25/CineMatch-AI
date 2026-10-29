import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Film, Sparkles, Compass, Bookmark, MessageSquare, LogIn, User, Menu, X, Activity } from 'lucide-react';
import apiClient from '../api/client';

export default function Navbar() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [healthStatus, setHealthStatus] = useState({ status: 'checking', message: 'Checking...' });

  // Periodically check backend health
  useEffect(() => {
    let isMounted = true;
    const checkHealth = async () => {
      try {
        const res = await apiClient.get('/health');
        if (isMounted) {
          setHealthStatus({ status: 'healthy', data: res });
        }
      } catch (err) {
        if (isMounted) {
          setHealthStatus({ status: 'offline', error: err.message });
        }
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const navLinks = [
    { name: 'Home', path: '/', icon: Film },
    { name: 'Explore', path: '/explore', icon: Compass },
    { name: 'AI Assistant', path: '/chat', icon: Sparkles, badge: 'RAG' },
    { name: 'Watchlist', path: '/watchlist', icon: Bookmark },
  ];

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-charcoal-700/60 bg-charcoal-900/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cinematic-violet to-cinematic-amber flex items-center justify-center shadow-lg shadow-cinematic-violet/20 group-hover:scale-105 transition-transform">
              <Film className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-gray-200 to-cinematic-violet bg-clip-text text-transparent">
                CineMatch<span className="text-cinematic-amber">.AI</span>
              </span>
              <span className="block text-[10px] text-gray-400 font-mono tracking-widest uppercase -mt-1">
                Hybrid RAG Engine
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-cinematic-violet/15 text-cinematic-violet border border-cinematic-violet/30'
                      : 'text-gray-300 hover:text-white hover:bg-charcoal-800'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cinematic-violet' : 'text-gray-400'}`} />
                  <span>{link.name}</span>
                  {link.badge && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-cinematic-violet text-white">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Section: Health Badge & Profile/Login */}
          <div className="hidden md:flex items-center gap-4">
            {/* System Status Indicator */}
            <div
              title={`API Status: ${healthStatus.status}`}
              className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-charcoal-800/80 border border-charcoal-700 text-xs font-mono"
            >
              <span
                className={`w-2 h-2 rounded-full animate-pulse ${
                  healthStatus.status === 'healthy'
                    ? 'bg-emerald-400'
                    : healthStatus.status === 'checking'
                    ? 'bg-amber-400'
                    : 'bg-rose-500'
                }`}
              />
              <span className="text-gray-400 capitalize">{healthStatus.status}</span>
            </div>

            <Link
              to="/login"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-cinematic-violet to-cinematic-violetHover hover:opacity-90 shadow-md shadow-cinematic-violet/20 transition-all"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-charcoal-800 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-charcoal-700 bg-charcoal-900/95 px-4 pt-3 pb-5 space-y-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-base font-medium ${
                  isActive
                    ? 'bg-cinematic-violet/15 text-cinematic-violet border border-cinematic-violet/30'
                    : 'text-gray-300 hover:bg-charcoal-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-gray-400" />
                  <span>{link.name}</span>
                </div>
                {link.badge && (
                  <span className="text-xs uppercase font-bold px-2 py-0.5 rounded-full bg-cinematic-violet text-white">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
          <div className="pt-2 border-t border-charcoal-700/60 flex flex-col gap-2">
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-white bg-cinematic-violet hover:bg-cinematic-violetHover"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
