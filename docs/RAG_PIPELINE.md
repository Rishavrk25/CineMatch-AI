# CineMatch AI — RAG & Recommendation Pipeline Architecture

## 1. Pipeline Execution Flow

```text
[User Natural Language Prompt]
              |
              v
1. [Intent Extraction & Constraint Parsing]
   - Parse themes, keywords, excluded negative genres, release year bounds (minYear, maxYear).
              |
              v
2. [Dual Asynchronous Retrieval]
   +------------------------------------+------------------------------------+
   |                                    |                                    |
   v                                    v                                    v
[Gemini Embedding-2 (1024-dim)]  [Neo4j Cypher Traversal]             [User Preferences]
   |                                    |                                    |
[Pinecone Vector Search]         [Graph Relationships & Co-occurrence] [Favorite Genres & Likes]
   | (Top-25 Cosine Similar)            | (Top-25 Graph Connected)           | (+10% Boost)
   +------------------------------------+------------------------------------+
                                        |
                                        v
3. [Deduplication, Filtering, and Normalization]
   - Candidate union deduplicated by canonical `movieId`.
   - Strict negative constraint enforcement (discard excluded genres, enforce minYear/maxYear).
   - Min-Max score normalization:
     - `semanticScore` in [0, 1]
     - `graphScore` in [0, 1]
              |
              v
4. [Hybrid Deterministic Ranking Engine]
   finalScore = 0.60 * semanticScore 
              + 0.20 * graphScore 
              + 0.10 * ratingScore 
              + 0.10 * preferenceBonus
   - Top-K selected candidates (default: 5).
              |
              v
5. [LangChain / Structured Prompt Construction]
   - Inject verified candidate facts: Title, Year, Director, Cast, Overview, Graph Connections.
   - Inject conversational history for multi-turn chat sessions.
   - Enforce anti-hallucination instructions and prompt injection defenses.
              |
              v
6. [Gemini Generative Synthesis]
   - Primary: `gemini-3.5-flash`
   - Secondary Failover: `gemini-3.1-flash-lite`
   - Tertiary: Deterministic template synthesizer
              |
              v
7. [Zod Validation & Canonical Fact Injection]
   - Validate JSON output against `StructuredRecommendationOutputSchema`.
   - Filter out any non-candidate movie IDs.
   - Overwrite all canonical attributes (title, year, director, rating) from database ground truth.
              |
              v
[Final Structured API Response to Frontend]
```

---

## 2. Mathematical Scoring Formulation

For each candidate movie $m$, the final composite score is calculated deterministically:

$$S(m) = w_v \cdot S_{\text{semantic}}(m) + w_g \cdot S_{\text{graph}}(m) + w_r \cdot S_{\text{rating}}(m) + w_p \cdot S_{\text{preference}}(m)$$

Where:
- $w_v = 0.60$: Pinecone cosine similarity score using Gemini Embeddings.
- $w_g = 0.20$: Neo4j graph connectivity score based on shared directors, shared actors, and genre pathways.
- $w_r = 0.10$: Normalized TMDB vote average ($\frac{\text{voteAverage}}{10}$).
- $w_p = 0.10$: User preference bonus if the movie belongs to the user's favorite genres (+1.0) or shares nodes with liked movies (+0.5).

Hard constraints (e.g., $m.\text{genres} \cap \text{negativeGenres} \neq \emptyset$ or $m.\text{year} < \text{minYear}$) result in immediate rejection ($S(m) = -\infty$).

---

## 3. Anti-Hallucination & Security Guardrails

1. **Candidate Boundary Restriction**: The prompt instructs the model that it is strictly forbidden from recommending any movie not provided in the candidate list.
2. **Deterministic Post-Validation**: Every recommendation returned by the LLM is checked against the set of candidate IDs. Any unrecognized ID is rejected.
3. **Database Ground Truth Injection**: Titles, release dates, ratings, and crew are injected directly from the database, preventing fabricated metadata.
4. **Prompt Injection Defense**: User queries are sanitized and delimited as raw user text, with strict system prompt hierarchy.
