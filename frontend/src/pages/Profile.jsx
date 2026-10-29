import React from 'react';
import { User, Settings, Heart } from 'lucide-react';

export default function Profile() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="border-b border-charcoal-700/60 pb-6">
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
          <User className="w-8 h-8 text-cinematic-violet" />
          <span>My Profile & Preferences</span>
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Manage your favorite genres, preferred languages, and recommendation tuning.
        </p>
      </div>

      <div className="glass-panel p-8 rounded-2xl text-center space-y-3">
        <Heart className="w-8 h-8 text-rose-400 mx-auto" />
        <h3 className="text-lg font-semibold text-white">Taste Profile Engine</h3>
        <p className="text-sm text-gray-400 max-w-md mx-auto">
          User profile preferences will be activated during Authentication & Personalization in Phase 7.
        </p>
      </div>
    </div>
  );
}
