import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2, RefreshCw } from 'lucide-react';
import ChatMessage from './ChatMessage';

const STARTER_PROMPTS = [
  'Recommend mind-bending science-fiction movies involving time travel, space exploration, and emotional storytelling. Avoid horror and movies released before 2010.',
  'Dark psychological thrillers and crime mysteries directed by Christopher Nolan or David Fincher.',
  'Warmhearted animated family adventures with great humor and stunning visuals. No war or violence.',
  'Cyberpunk dystopian futures exploring artificial intelligence and human morality.'
];

export default function ChatInterface({
  messages = [],
  loading = false,
  onSendMessage,
  onReset
}) {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim() || loading) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleSuggestionClick = (text) => {
    if (loading) return;
    onSendMessage(text);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-14rem)] min-h-[550px] max-w-4xl mx-auto glass-panel border border-charcoal-700/60 rounded-2xl overflow-hidden">
      {/* Header Bar */}
      <div className="px-6 py-4 border-b border-charcoal-700/60 flex items-center justify-between bg-charcoal-900/40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cinematic-violet/20 border border-cinematic-violet/30 flex items-center justify-center text-cinematic-violet">
            <Sparkles className="w-4 h-4 text-cinematic-amber" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">CineMatch RAG Assistant</h3>
            <p className="text-[11px] text-gray-400">Gemini 3.5 Flash &bull; Pinecone Vectors &bull; Neo4j Graph</p>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            onClick={onReset}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-charcoal-800 transition-colors disabled:opacity-50"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>New Chat</span>
          </button>
        )}
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col justify-center items-center text-center max-w-lg mx-auto py-8 space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cinematic-violet/20 to-cinematic-amber/20 border border-cinematic-violet/30 flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-cinematic-violet" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">Ask for Any Kind of Cinema</h2>
              <p className="text-xs text-gray-400 leading-relaxed">
                Describe themes, pacing, plot elements, or directors. CineMatch validates all recommendations against TMDB canonical metadata and Neo4j graph relationships.
              </p>
            </div>

            <div className="w-full space-y-2 pt-2">
              <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider block">
                Try a sample prompt:
              </span>
              <div className="grid grid-cols-1 gap-2">
                {STARTER_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestionClick(prompt)}
                    className="p-3 rounded-xl glass-panel border border-charcoal-700/60 hover:border-cinematic-violet/60 text-xs text-left text-gray-300 hover:text-white transition-all group"
                  >
                    <span className="line-clamp-2">&ldquo;{prompt}&rdquo;</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => (
              <ChatMessage
                key={msg.id || idx}
                message={msg}
                onSelectSuggestion={handleSuggestionClick}
              />
            ))}

            {loading && (
              <div className="flex items-center gap-3 text-cinematic-violet text-xs p-4 rounded-xl glass-panel max-w-md animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin text-cinematic-amber" />
                <span>Synthesizing vector search and graph relations with Gemini...</span>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-charcoal-700/60 bg-charcoal-900/60">
        <div className="relative flex items-center">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={loading}
            placeholder="E.g., Recommend mind-bending sci-fi with time travel, avoid horror..."
            className="w-full pl-4 pr-12 py-3.5 rounded-xl bg-charcoal-900 border border-charcoal-700/80 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-cinematic-violet focus:ring-1 focus:ring-cinematic-violet transition-all disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || loading}
            aria-label="Send query"
            className="absolute right-2 p-2 rounded-lg bg-cinematic-violet hover:bg-cinematic-violetHover text-white disabled:opacity-40 disabled:hover:bg-cinematic-violet transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </form>
    </div>
  );
}
