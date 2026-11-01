import React, { useState } from 'react';
import { Search, X } from 'lucide-react';

export default function SearchBar({
  value = '',
  onChange,
  onSubmit,
  placeholder = 'Search by movie title, director, or keyword...',
  className = ''
}) {
  const [internalVal, setInternalVal] = useState(value);

  const handleChange = (e) => {
    const val = e.target.value;
    setInternalVal(val);
    if (onChange) onChange(val);
  };

  const handleClear = () => {
    setInternalVal('');
    if (onChange) onChange('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) onSubmit(internalVal);
  };

  return (
    <form onSubmit={handleSubmit} className={`relative flex items-center ${className}`}>
      <Search className="absolute left-4 w-4 h-4 text-gray-400 pointer-events-none" />
      <input
        type="text"
        value={internalVal}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full pl-11 pr-10 py-2.5 rounded-xl bg-charcoal-900 border border-charcoal-700/80 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-cinematic-violet focus:ring-1 focus:ring-cinematic-violet transition-all"
      />
      {internalVal && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 p-1 rounded-full text-gray-400 hover:text-white hover:bg-charcoal-700/50 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </form>
  );
}

