# CineMatch AI — RAG & Recommendation Pipeline

## Pipeline Execution Steps

```text
[User Prompt / Query]
         |
         v
1. [Intent Extraction & Filter Detection]
   - Parse keywords, excluded genres, release year constraints, mentioned actors/directors.
         |
         v
2. [Dual Retrieval Execution]
   +------------------------------------+------------------------------------+
   |                                    |                                    |
   v                                    v                                    v
[Gemini text-embedding-004]    [Neo4j Cypher Traversal]             [User Preferences]
   |                                    |                                    |
[Pinecone Vector Search]       [Graph Neighbors & Co-occurrence]    [Favorites, Watched]
   |                                    |                                    |
(Semantic Candidates Top-30)   (Graph Candidates Top-30)            (Excluded / Boosted)
   +------------------------------------+------------------------------------+
                                        |
                                        v
3. [Deduplication, Filtering, and Normalization]
   - Merge candidates by canonical `movieId`.
   - Discard movies violating explicit exclusions (e.g. before 2010, horror).
   - Normalize semantic score: [0, 1]
   - Normalize graph score: [0, 1]
         |
         v
4. [Hybrid Ranking Engine]
   finalScore = 0.60 * semanticScore + 0.20 * graphScore + 0.10 * ratingScore + 0.10 * preferenceScore
   - Select Top-K (default: 5 to 10 candidates).
         |
         v
5. [LangChain Prompt Construction]
   - Inject verified movie candidate metadata (Title, Year, Director, Cast, Overview, Graph connection reason).
   - Inject conversational history (if chat mode).
   - Strictly prohibit hallucination or recommending unlisted movies.
         |
         v
6. [Gemini Generative Model]
   - Model: `gemini-1.5-flash` (or configured generation model).
   - Generates structured JSON output with recommendation rationale and matched themes.
         |
         v
7. [Zod Response Validation & Post-Processing]
   - Validate structure with Zod schema.
   - Verify all returned movie IDs against retrieved candidate set.
   - Inject canonical posters, ratings, and database facts.
         |
         v
[Final API Response to Frontend]
```

## Anti-Hallucination Guardrails
1. **Candidate Boundary**: The LLM prompt explicitly constrains recommendations only to candidates provided in the retrieval context.
2. **Post-Validation**: The backend verifies each returned `movieId` belongs to the candidate list.
3. **Canonical Data Replacement**: Titles, release years, directors, and ratings are injected from the canonical database record, ignoring any modified metadata produced by the LLM.
4. **Fallback Mechanism**: If the generative model fails or outputs invalid JSON, the system gracefully falls back to deterministic ranked candidate cards with template-based evidence descriptions.
