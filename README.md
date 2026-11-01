# CineMatch AI — Intelligent Movie Recommendation System Using RAG, Vector Search, and Knowledge Graphs

A full-stack cinematic movie discovery and recommendation platform combining **Vector Similarity Search (Pinecone + Gemini Embeddings)** and **Relational Knowledge Graphs (Neo4j)**, orchestrated with **LangChain.js** and **Gemini Generative AI**.

---

## 🌟 Key Features

- **Natural Language Thematic Search**: Express complex movie tastes (e.g., *"Mind-bending sci-fi with time travel, space exploration, and emotional storytelling. Avoid horror and movies before 2010"*).
- **Dual Retrieval Engine (Hybrid RAG)**:
  - **Pinecone Vector Database**: Semantic vector search using Google's `gemini-embedding-2` (1024 dimensions, cosine metric).
  - **Neo4j Knowledge Graph**: Multi-hop graph traversals across 4,803 movies, 11,291 actors, 2,576 directors, 20 genres, and 8,300 keywords.
- **Deterministic Multi-Signal Ranking**:
  - `0.60 * semanticScore + 0.20 * graphScore + 0.10 * ratingScore + 0.10 * preferenceScore`
  - Strict negative constraints and exclusion filtering (hard genre exclusions and release year boundaries).
- **Grounded AI Explanations & Zero Hallucination**:
  - Powered by Gemini (`gemini-3.5-flash` with failover to `gemini-3.1-flash-lite`), validated via **Zod**.
  - Strict anti-hallucination guardrails: Non-candidate movie IDs are intercepted and rejected, with canonical facts injected from the database.
- **Conversational Follow-ups**: Multi-turn recommendation chat maintaining conversational context in MongoDB.
- **Personalized Watchlists & Taste Profiles**: Track favorite genres, watchlists, and interaction history.
- **Cinematic UI/UX**: Built with React 18, Vite, Tailwind CSS, Lucide icons, responsive movie cards, and glassmorphic dark theme.
- **Zero-Cost Target (₹0)**: Designed to run entirely on verified free tiers (MongoDB Atlas M0, Neo4j AuraDB Free, Pinecone Starter, Google AI Studio free tier).

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, React Router v6, Axios, Lucide React
- **Backend**: Node.js 22, Express.js (ES Modules), Mongoose, Neo4j JavaScript Driver, Pinecone SDK, LangChain.js, Google GenAI SDK, Zod, Helmet, CORS, Rate Limiter
- **Databases**:
  - **MongoDB Atlas**: Users, profiles, watchlists, interactions, conversation history
  - **Neo4j AuraDB**: Knowledge graph connecting movies, actors, directors, genres, and keywords
  - **Pinecone**: 1024-dimensional movie semantic embeddings with filterable metadata
- **AI & Models**:
  - Gemini `gemini-embedding-2` (`outputDimensionality: 1024`) for vector embeddings
  - Gemini `gemini-3.5-flash` / `gemini-3.1-flash-lite` for grounded recommendation synthesis

---

## 📂 Project Structure

```text
cinematch-ai/
  backend/           # Express.js REST API & RAG Pipeline
    src/
      config/        # Database & Environment configs (MongoDB, Neo4j, Pinecone, Env)
      controllers/   # Request handlers (Auth, Movies, Recommendations, Watchlist, Interactions)
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
    tests/           # Automated test suite (health, auth, movie, ranking)
  frontend/          # React + Vite application
    src/
      api/           # Axios API modules (authApi, movieApi, recommendationApi, watchlistApi)
      components/    # UI Components (MovieCard, MovieGrid, SearchBar, ChatInterface, etc.)
      context/       # AuthContext for shared authentication state
      hooks/         # useAuth, useRecommendations
      layouts/       # MainLayout with dynamic Navbar & Footer
      pages/         # Home, Explore, MovieDetails, Chat, Watchlist, Profile, Login, Register
      utils/         # Formatting helpers
  data/              # Dataset directory (TMDB 5000 movies & credits CSVs)
  docs/              # Architectural, Database, API, and Evaluation documentation
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js >= 20 (Tested on Node.js v22)
- npm >= 10
- Free tier accounts for MongoDB Atlas, Neo4j AuraDB, Pinecone, and Google AI Studio

### 2. Environment Variables Configuration
Create a `.env` file in `backend/` with the following variables:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# MongoDB Atlas
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/cinematch?retryWrites=true&w=majority

# Neo4j AuraDB
NEO4J_URI=neo4j+s://<dbid>.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=<password>

# Pinecone
PINECONE_API_KEY=<pinecone_api_key>
PINECONE_INDEX=cinematch-movies

# Gemini API
GEMINI_API_KEY=<google_ai_studio_api_key>
GEMINI_GENERATION_MODEL=gemini-3.5-flash
GEMINI_EMBEDDING_MODEL=gemini-embedding-2

# JWT Security
JWT_SECRET=super_secret_jwt_key_at_least_32_characters_long
JWT_EXPIRES_IN=7d
```

### 3. Installation & Database Setup

```bash
# Install all dependencies (root, backend, and frontend)
npm install

# 1. Download & Validate TMDB 5000 dataset
node backend/scripts/validateDataset.js

# 2. Ingest movies into normalized canonical JSON
node backend/scripts/ingestMovies.js

# 3. Build Neo4j Knowledge Graph (4,803 movies, cast, crew, genres)
node backend/scripts/buildGraph.js

# 4. Generate Gemini Embeddings and index into Pinecone
node backend/scripts/indexVectors.js
```

### 4. Running the Development Servers

```bash
# Run both backend and frontend concurrently
npm run dev

# Or run separately:
npm run dev:backend    # Express API on http://localhost:5000
npm run dev:frontend   # React Vite App on http://localhost:5173
```

---

## 🧪 Automated Testing & Evaluation

### Run Test Suite
```bash
npm test --workspace=backend
```
Executes unit tests verifying:
- Multi-service health check endpoint (`GET /api/health`)
- User registration, login, JWT authentication, and preference updates
- Movie catalog pagination, search, and details retrieval
- Deterministic ranking engine, weights, hard constraint filtering, and score bounds

### Run Benchmark Evaluation
```bash
node backend/scripts/evaluateRecommendations.js
```
Benchmarks Vector-Only vs. Graph-Only vs. Hybrid RAG across benchmark queries measuring Precision@5, latency, and constraint violations.

---

## 📊 Evaluation Results Summary

| Strategy | Avg Precision@5 | Avg Latency | Constraint Violations |
| :--- | :---: | :---: | :---: |
| **Vector-Only** | 100.0% | 2,968 ms | 0 |
| **Graph-Only** | 20.0% | 1,272 ms | 0 |
| **Hybrid RAG (CineMatch)** | **100.0%** | **12,313 ms** | **0** |

---

## 📄 License
MIT License. TMDB 5000 dataset is provided for educational and research purposes under TMDB terms.
