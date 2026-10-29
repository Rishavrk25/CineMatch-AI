import React from 'react';
import { Film, Github, ExternalLink, Heart, Layers, Network, Database, Cpu } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-charcoal-700/60 bg-charcoal-900/95 text-gray-400 text-sm mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Mission */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cinematic-violet to-cinematic-amber flex items-center justify-center">
                <Film className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white">
                CineMatch<span className="text-cinematic-amber">.AI</span>
              </span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Intelligent multi-modal movie recommendation platform uniting Pinecone vector search, Neo4j knowledge graphs, and Gemini grounded RAG explanations.
            </p>
          </div>

          {/* RAG & Search Architecture */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-200 mb-3 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cinematic-violet" />
              Architecture
            </h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-2">
                <Database className="w-3 h-3 text-emerald-400" />
                <span>Pinecone (Vector Similarity)</span>
              </li>
              <li className="flex items-center gap-2">
                <Network className="w-3 h-3 text-cyan-400" />
                <span>Neo4j (Knowledge Graph)</span>
              </li>
              <li className="flex items-center gap-2">
                <Cpu className="w-3 h-3 text-cinematic-amber" />
                <span>Gemini 1.5 Flash (RAG Synth)</span>
              </li>
              <li className="flex items-center gap-2">
                <Layers className="w-3 h-3 text-cinematic-violet" />
                <span>LangChain.js Orchestration</span>
              </li>
            </ul>
          </div>

          {/* Dataset Attribution */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-200 mb-3">
              Data & Attribution
            </h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              This product uses the TMDB 5000 movie dataset and credits API but is not endorsed or certified by TMDB.
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-cinematic-amber">
              <span>Verified TMDB Metadata</span>
            </div>
          </div>

          {/* Project Links & Budget */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-200 mb-3">
              Zero-Cost Architecture
            </h4>
            <p className="text-xs text-gray-400 leading-relaxed mb-3">
              100% Free-tier compliant: MongoDB Atlas, Neo4j AuraDB Free, Pinecone Starter, Google AI Studio Free.
            </p>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-charcoal-800 border border-charcoal-700 text-gray-300">
                ₹0 / month target
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-charcoal-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} CineMatch AI. Built by Rishav.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-gray-300 transition-colors">Privacy Policy</span>
            <span>•</span>
            <span className="hover:text-gray-300 transition-colors">Terms of Use</span>
            <span>•</span>
            <span className="hover:text-gray-300 transition-colors">Documentation</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
