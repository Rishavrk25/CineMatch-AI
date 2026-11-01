import React, { useState } from 'react';
import { Sparkles, Network, Cpu, Star, ChevronDown, ChevronUp, Layers } from 'lucide-react';
import { formatScore } from '../utils/formatters';

export default function RecommendationReason({
  reason,
  matchedThemes = [],
  graphEvidence = null,
  scoreBreakdown = null
}) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="rounded-xl glass-panel border border-charcoal-700/60 p-4 space-y-3">
      {/* Grounded Explanation */}
      <div className="flex items-start gap-2.5">
        <Sparkles className="w-4 h-4 text-cinematic-amber shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-xs font-semibold text-cinematic-violet uppercase tracking-wider">
            Recommendation Rationale
          </h4>
          <p className="text-sm text-gray-200 leading-relaxed font-normal">{reason}</p>
        </div>
      </div>

      {/* Matched Themes */}
      {matchedThemes && matchedThemes.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] text-gray-400 font-medium mr-1">Matched Themes:</span>
          {matchedThemes.map((theme) => (
            <span
              key={theme}
              className="px-2 py-0.5 rounded-md bg-cinematic-violet/10 border border-cinematic-violet/30 text-cinematic-violet text-[11px] font-medium"
            >
              {theme}
            </span>
          ))}
        </div>
      )}

      {/* Graph Evidence */}
      {graphEvidence && (
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-charcoal-900/60 border border-charcoal-700/50 text-xs text-gray-300">
          <Network className="w-3.5 h-3.5 text-cinematic-cyan shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="text-cinematic-cyan font-medium block text-[11px]">
              Neo4j Graph Relationship:
            </span>
            <p className="text-gray-300 text-[11px] leading-snug">{graphEvidence}</p>
          </div>
        </div>
      )}

      {/* Score Breakdown Toggle */}
      {scoreBreakdown && (
        <div className="border-t border-charcoal-700/40 pt-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center justify-between w-full text-[11px] text-gray-400 hover:text-white transition-colors"
          >
            <span className="flex items-center gap-1.5 font-medium">
              <Layers className="w-3 h-3 text-cinematic-violet" />
              <span>Hybrid Deterministic Score Breakdown</span>
            </span>
            {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showDetails && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2.5">
              <div className="p-2 rounded-lg bg-charcoal-900 border border-charcoal-700/50 text-center">
                <span className="text-[10px] text-gray-400 block">Vector (60%)</span>
                <span className="text-xs font-bold text-white">
                  {formatScore(scoreBreakdown.semanticScore)}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-charcoal-900 border border-charcoal-700/50 text-center">
                <span className="text-[10px] text-gray-400 block">Graph (20%)</span>
                <span className="text-xs font-bold text-cinematic-cyan">
                  {formatScore(scoreBreakdown.graphScore)}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-charcoal-900 border border-charcoal-700/50 text-center">
                <span className="text-[10px] text-gray-400 block">Rating (10%)</span>
                <span className="text-xs font-bold text-cinematic-amber">
                  {formatScore(scoreBreakdown.ratingScore)}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-charcoal-900 border border-charcoal-700/50 text-center">
                <span className="text-[10px] text-gray-400 block">Pref (10%)</span>
                <span className="text-xs font-bold text-cinematic-violet">
                  {formatScore(scoreBreakdown.preferenceBonus)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

