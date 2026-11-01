# CineMatch AI — System Architecture

## High-Level Architecture Diagram

```text
+-----------------------------------------------------------------------------------+
|                              React Frontend (Vite)                                |
|    - Discover & Explore Movies               - Dynamic AI Chat & Recommendations   |
|    - User Authentication & Watchlist         - Filter by Genre, Mood, Themes       |
+-----------------------------------------------------------------------------------+
                                         |
                                         | HTTP / REST API (JSON)
                                         v
+-----------------------------------------------------------------------------------+
|                          Express.js / Node.js Backend API                         |
|  - Rate Limiter & Helmet Security            - Auth & JWT Middleware              |
|  - Request Validation (Zod)                  - Controllers & API Routing          |
+-----------------------------------------------------------------------------------+
         |                                |                               |
         v                                v                               v
+------------------+            +-------------------+           +-------------------+
|  MongoDB Atlas   |            |  LangChain.js RAG |           |   Deterministic   |
|  - Users         |            |     Pipeline      |           |  Ranking Engine   |
|  - Preferences   |            |  - Query Parsing  |           |  - Semantic (60%) |
|  - Watchlist     |            |  - Gemini 3.5/3.1 |           |  - Graph (20%)    |
|  - Interactions  |            |  - Output Zod Val |           |  - Rating (10%)   |
|  - Conversations |            +-------------------+           |  - Prefs (10%)    |
+------------------+                      |                     +-------------------+
                                          |                               |
                     +--------------------+-------------------+           |
                     |                                        |           |
                     v                                        v           |
          +----------------------+                 +--------------------+ |
          | Pinecone Vector DB   |                 | Neo4j AuraDB Graph |<+
          | - Gemini Embeddings  |                 | - Actors, Directors|
          | - 1024-dim Cosine    |                 | - Genres, Keywords |
          | - Metadata Filtering |                 | - Multi-hop Graph  |
          +----------------------+                 +--------------------+
```

## Core Subsystems

### 1. Vector Search Subsystem (Pinecone + Gemini Embeddings)
- **Model**: `gemini-embedding-2` with `outputDimensionality: 1024`
- **Dimension**: 1024 dimensions (matching Pinecone serverless index `cinematch-movies`)
- **Metric**: Cosine similarity
- **Role**: Captures complex semantic themes, emotional nuances, plots, and open-ended queries.

### 2. Knowledge Graph Subsystem (Neo4j AuraDB)
- **Labels**: `Movie`, `Actor`, `Director`, `Genre`, `Keyword`
- **Edges**: `(:Actor)-[:ACTED_IN]->(:Movie)`, `(:Director)-[:DIRECTED]->(:Movie)`, `(:Movie)-[:IN_GENRE]->(:Genre)`, `(:Movie)-[:HAS_KEYWORD]->(:Keyword)`
- **Scale**: 4,803 Movies, 11,291 Actors, 2,576 Directors, 20 Genres, 8,300 Keywords
- **Role**: Provides relational factual grounding, shared filmography, and traversal-based connections.

### 3. Hybrid Ranking Subsystem
- Deterministic formula: `0.60 * semanticScore + 0.20 * graphScore + 0.10 * ratingScore + 0.10 * preferenceBonus`
- Normalizes signals from Pinecone semantic similarity and Neo4j relational graph density.
- Applies user constraints (negative filtering, minimum release year, excluded genres, watched films).
- Merges candidate sets into a diverse, prioritized Top-K candidate list.

### 4. Generative Explanation & RAG (Gemini + LangChain.js)
- Passes verified candidate metadata and explicit user context into a structured prompt.
- Primary Model: `gemini-3.5-flash` with failover to `gemini-3.1-flash-lite`.
- Generates grounded, hallucination-free rationale explaining *why* each movie matches the user's taste.
- Output validated against Zod schema and verified against retrieved candidate database records.
