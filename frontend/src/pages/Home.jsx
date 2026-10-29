import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Search, Compass, Database, Network, Cpu, ArrowRight, Film, ShieldCheck } from 'lucide-react';

const SUGGESTED_QUERIES = [
  "Mind-bending sci-fi with time travel and emotional storytelling, avoid horror",
  "Dark psychological thrillers directed by Christopher Nolan or David Fincher",
  "Feel-good animated adventure movies with great humor and stunning visuals",
  "Cyberpunk dystopian futures exploring artificial intelligence and morality"
];

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/chat?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleSampleClick = (query) => {
    navigate(`/chat?q=${encodeURIComponent(query)}`);
  };

  return (
    <div className="space-y-16 py-4">
      {/* Hero Section */}
      <section className="relative text-center max-w-4xl mx-auto pt-8 pb-4">
        {/* Glow badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cinematic-violet/10 border border-cinematic-violet/30 text-cinematic-violet text-xs font-semibold uppercase tracking-wider mb-6 animate-pulse">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Next-Gen Hybrid RAG Architecture</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
          Discover Cinema Through <br />
          <span className="bg-gradient-to-r from-cinematic-violet via-pink-400 to-cinematic-amber bg-clip-text text-transparent">
            Vectors & Knowledge Graphs
          </span>
        </h1>

        <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
          Ask for movies the way you think about them. CineMatch AI merges semantic vector similarity from Pinecone with relational graph evidence from Neo4j to deliver grounded, hallucination-free recommendations.
        </p>

        {/* Natural Language Search Bar */}
        <form onSubmit={handleSearchSubmit} className="max-w-3xl mx-auto relative group">
          <div className="relative flex items-center shadow-2xl shadow-cinematic-violet/15 rounded-2xl overflow-hidden glass-panel border border-charcoal-700/80 focus-within:border-cinematic-violet transition-all">
            <div className="pl-5 text-gray-400 group-focus-within:text-cinematic-violet transition-colors">
              <Search className="w-6 h-6" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. 'Mind-bending sci-fi movies about time travel and emotional stakes...'"
              className="w-full py-4 pl-4 pr-32 bg-transparent text-white placeholder-gray-500 focus:outline-none text-base"
            />
            <button
              type="submit"
              className="absolute right-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cinematic-violet to-cinematic-violetHover hover:opacity-95 text-white font-medium text-sm flex items-center gap-2 shadow-lg transition-all"
            >
              <span>Ask AI</span>
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Suggested Queries */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className="text-gray-400 font-medium">Try asking:</span>
          {SUGGESTED_QUERIES.map((query, idx) => (
            <button
              key={idx}
              onClick={() => handleSampleClick(query)}
              className="px-3 py-1.5 rounded-lg bg-charcoal-800/80 hover:bg-charcoal-700 text-gray-300 hover:text-white border border-charcoal-700/50 transition-all text-left"
            >
              "{query.slice(0, 42)}..."
            </button>
          ))}
        </div>
      </section>

      {/* Triple Pillar Architecture Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pillar 1: Vector Search */}
        <div className="glass-panel glass-panel-hover p-6 rounded-2xl space-y-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Database className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">Pinecone Vector Search</h3>
          <p className="text-sm text-gray-400 leading-relaxed">
            Every movie overview and thematic metadata is encoded into 768-dimensional embeddings using Gemini <code className="text-emerald-300 text-xs">text-embedding-004</code>, matching plot subtleties and mood.
          </p>
          <div className="text-xs text-emerald-400 font-mono">Weight: 60% of Candidate Score</div>
        </div>

        {/* Pillar 2: Knowledge Graph */}
        <div className="glass-panel glass-panel-hover p-6 rounded-2xl space-y-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Network className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">Neo4j Knowledge Graph</h3>
          <p className="text-sm text-gray-400 leading-relaxed">
            Traverses deep multi-hop graph relationships across shared directors, cast members, recurring genres, and thematic keywords with Cypher queries.
          </p>
          <div className="text-xs text-cyan-400 font-mono">Weight: 20% of Candidate Score</div>
        </div>

        {/* Pillar 3: Grounded Gemini RAG */}
        <div className="glass-panel glass-panel-hover p-6 rounded-2xl space-y-4">
          <div className="w-12 h-12 rounded-xl bg-cinematic-violet/10 border border-cinematic-violet/20 flex items-center justify-center text-cinematic-violet">
            <Cpu className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">Grounded Gemini Synthesis</h3>
          <p className="text-sm text-gray-400 leading-relaxed">
            LangChain.js constructs strict structured prompts for Gemini 1.5 Flash. The engine validates outputs against canonical database IDs to guarantee zero hallucinated movies.
          </p>
          <div className="text-xs text-cinematic-violet font-mono">Zod Schema Validated</div>
        </div>
      </section>

      {/* Explore CTA Banner */}
      <section className="relative overflow-hidden rounded-2xl border border-charcoal-700 bg-gradient-to-r from-charcoal-800 via-charcoal-900 to-charcoal-800 p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Explore 5,000+ Curated TMDB Movies
          </h2>
          <p className="text-gray-400 text-sm max-w-xl">
            Filter by verified release dates, vote averages, directors, and genres. Save your favorites to your personalized watchlist.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/explore')}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-charcoal-700 hover:bg-charcoal-600 text-white font-semibold text-sm transition-all border border-charcoal-600"
          >
            <Compass className="w-4 h-4" />
            <span>Browse Library</span>
          </button>
          <button
            onClick={() => navigate('/chat')}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cinematic-violet to-cinematic-violetHover text-white font-semibold text-sm shadow-lg shadow-cinematic-violet/25 hover:opacity-95 transition-all"
          >
            <span>Start Chat</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
}
