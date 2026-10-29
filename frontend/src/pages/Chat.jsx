import React from 'react';
import { Sparkles, Bot, MessageSquare } from 'lucide-react';

export default function Chat() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-charcoal-700/60 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cinematic-violet/20 border border-cinematic-violet/30 flex items-center justify-center text-cinematic-violet">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">CineMatch RAG Assistant</h1>
            <p className="text-xs text-gray-400">Powered by Gemini 1.5 Flash + Pinecone + Neo4j</p>
          </div>
        </div>
      </div>

      <div className="glass-panel p-10 rounded-2xl text-center space-y-4">
        <Bot className="w-12 h-12 text-cinematic-violet mx-auto" />
        <h3 className="text-xl font-bold text-white">Intelligent Conversational Recommendations</h3>
        <p className="text-sm text-gray-400 max-w-lg mx-auto">
          Multi-turn conversational RAG engine with prompt grounding will activate once Gemini Embeddings and Pinecone index are configured in Phase 4-6.
        </p>
      </div>
    </div>
  );
}
