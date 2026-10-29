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
|     MongoDB      |            |  LangChain.js RAG |           |   Deterministic   |
|  - Users         |            |     Pipeline      |           |  Ranking Engine   |
|  - Preferences   |            |  - Query Parsing  |           |  - Semantic (60%) |
|  - Watchlist     |            |  - Gemini 1.5/2.0 |           |  - Graph (20%)    |
|  - Interactions  |            |  - Output Zod Val |           |  - Rating (10%)   |
|  - Conversations |            +-------------------+           |  - Prefs (10%)    |
+------------------+                      |                     +-------------------+
                                          |                               |
                     +--------------------+-------------------+           |
                     |                                        |           |
                     v                                        v           |
          +----------------------+                 +--------------------+ |
          | Pinecone Vector DB   |                 | Neo4j Graph DB     |<+
          | - Gemini Embeddings  |                 | - Actors, Directors|
          | - Semantic Search    |                 | - Genres, Keywords |
          | - Metadata Filtering |                 | - Multi-hop Graph  |
          +----------------------+                 +--------------------+
```

## Core Subsystems

### 1. Vector Search Subsystem (Pinecone + Gemini Embeddings)
- **Model**: `text-embedding-004` (Google GenAI)
- **Dimension**: 768 (standard output for text-embedding-004)
- **Metric**: Cosine similarity
- **Role**: Captures complex semantic themes, feelings, plots, and contextual subtleties.

### 2. Knowledge Graph Subsystem (Neo4j)
- **Labels**: `Movie`, `Actor`, `Director`, `Genre`, `Keyword`
- **Edges**: `(:Actor)-[:ACTED_IN]->(:Movie)`, `(:Director)-[:DIRECTED]->(:Movie)`, `(:Movie)-[:IN_GENRE]->(:Genre)`, `(:Movie)-[:HAS_KEYWORD]->(:Keyword)`
- **Role**: Provides relational factual grounding, shared filmography, and traversal-based connections.

### 3. Hybrid Ranking Subsystem
- Normalizes signals from Pinecone semantic similarity and Neo4j relational graph density.
- Applies user constraints (negative filtering, minimum release year, excluded genres, watched films).
- Merges candidate sets into a diverse, prioritized Top-K candidate list.

### 4. Generative Explanation & RAG (Gemini + LangChain.js)
- Passes verified candidate metadata and explicit user context into a structured prompt.
- Instructs Gemini to explain recommendations strictly using provided movie metadata.
- Validates LLM output with Zod against retrieved candidate IDs to prevent hallucination.
