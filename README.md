# CineMatch AI — Intelligent Movie Recommendation System Using RAG, Vector Search, and Knowledge Graphs

A full-stack cinematic movie discovery and recommendation platform combining **Vector Similarity Search (Pinecone + Gemini Embeddings)** and **Relational Knowledge Graphs (Neo4j)**, orchestrated with **LangChain.js** and **Gemini Generative AI**.

![CineMatch AI Banner](https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80)

---

## 🌟 Key Features

- **Natural Language Thematic Search**: Express complex movie tastes (e.g., *"Mind-bending sci-fi with time travel, space exploration, and emotional storytelling. Avoid horror and movies before 2010"*).
- **Dual Retrieval Engine (Hybrid RAG)**:
  - **Pinecone Vector Database**: Semantic vector search using Google's `text-embedding-004` (768 dimensions).
  - **Neo4j Knowledge Graph**: Deep graph traversals across actors, directors, genres, and keywords.
- **Deterministic Multi-Signal Ranking**:
  - `0.60 * semanticScore + 0.20 * graphScore + 0.10 * ratingScore + 0.10 * preferenceScore`
  - Strict negative constraints and exclusion filtering.
- **Grounded AI Explanations**:
  - Powered by Gemini (`gemini-1.5-flash`), with structured output validated via **Zod**.
  - Strict anti-hallucination guardrails: Only recommends verified database candidates and verifies IDs.
- **Conversational Follow-ups**: Multi-turn recommendation chat maintaining conversational context.
- **Personalized Watchlists & Taste Profiles**: Track favorite genres, watchlists, and like/dislike interactions stored in **MongoDB**.
- **Cinematic UI/UX**: Built with React, Tailwind CSS, Lucide icons, responsive movie cards, and glassmorphic dark theme.
- **Zero-Cost Target (₹0)**: Designed to run entirely on free tiers (MongoDB Atlas, Neo4j AuraDB Free, Pinecone Starter, Google AI Studio free tier).

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, React Router, Axios, Lucide React
- **Backend**: Node.js, Express.js (ES Modules), Mongoose, Neo4j JavaScript Driver, Pinecone SDK, LangChain.js, Google GenAI SDK, Zod, Helmet, CORS, Rate Limiter
- **Databases**:
  - **MongoDB**: Users, profiles, watchlists, interactions, conversation history
  - **Neo4j**: Movie nodes, actor/director filmography, genre graphs, keyword relationships
  - **Pinecone**: 768-dimensional movie semantic embeddings with filterable metadata
- **AI & Models**:
  - Gemini `text-embedding-004` for vector embeddings
  - Gemini `gemini-1.5-flash` for grounded recommendation synthesis

---

## 📂 Project Structure

```text
cinematch-ai/
  backend/           # Express.js REST API & RAG Pipeline
    src/
      config/        # Database & Environment configs (MongoDB, Neo4j, Pinecone, Env)
      controllers/   # Request handlers (Auth, Movies, Recommendations, Watchlist)
      middleware/    # Auth, Error Handling, Rate Limiting, Validation
      models/        # Mongoose Schemas (User, MovieInteraction, Conversation)
      prompts/       # LangChain recommendation prompts
      routes/        # Express route modules
      services/      # Embeddings, Vector Search, Graph, Ranking, RAG Orchestration
      utils/         # Logger, Async Handler, ApiError
      validators/    # Zod schemas for request & response validation
      app.js         # Express app configuration
      server.js      # Server bootstrapper
    scripts/         # Dataset validation, ingestion, graph builder, indexer, evaluator
    tests/           # Automated test suite
  frontend/          # React + Vite + Tailwind CSS Client
    src/
      api/           # Axios API client modules
      components/    # Reusable UI components (Navbar, MovieCard, Chat, Filters, etc.)
      context/       # Auth and state contexts
      hooks/         # Custom hooks
      layouts/       # Main app layout
      pages/         # Home, Explore, MovieDetails, Chat, Login, Watchlist, Profile
    index.html
    vite.config.js
  data/              # Dataset documentation and CSV location
  docs/              # Architectural, Database, RAG, API, Evaluation, and Deployment docs
  package.json       # Workspace root package configuration
  .gitignore
  README.md
```

---

## 🚀 Quick Start (Phase 1 Setup)

### 1. Install Dependencies
```bash
# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Environment Variables
Copy `.env.example` in both `backend` and `frontend`:
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 3. Run Development Servers
```bash
# In the project root:
npm run dev
```
- Backend runs on: `http://localhost:5000`
- Frontend runs on: `http://localhost:5173`
- Backend health check: `http://localhost:5000/api/health`
