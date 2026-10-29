# CineMatch AI — Recommendation Evaluation Methodology

## Objectives
Evaluate the effectiveness of:
1. **Vector-Only Retrieval** (Pinecone + Gemini Embeddings)
2. **Graph-Only Retrieval** (Neo4j multi-hop traversals)
3. **Hybrid RAG Retrieval & Ranking** (Vector + Graph + User Preferences)

## Metrics
- **Precision@K** ($K=5, 10$): Proportion of recommended movies that satisfy the user prompt's thematic and genre constraints.
- **Recall@K**: Proportion of known relevant benchmark movies retrieved in the top-K.
- **Constraint Violation Rate**: Percentage of recommendations that violate negative filters (e.g. recommending a horror movie when user asked to "Avoid horror").
- **Duplicate Rate**: Percentage of identical or near-duplicate movies in results.
- **Latency**:
  - Vector retrieval latency (ms)
  - Graph traversal latency (ms)
  - LLM generation latency (ms)
  - Total end-to-end response time (ms)

## Benchmark Queries
A standard evaluation test suite (`scripts/evaluateRecommendations.js`) includes diverse test cases:
1. *Multi-genre constrained*: "Mind-bending sci-fi with time travel and emotional depth. Avoid horror and pre-2010."
2. *Actor/Director centric*: "Dark psychological thrillers directed by David Fincher or Christopher Nolan."
3. *Vague mood-based*: "Cozy animated movies for a rainy Sunday afternoon."
4. *Negative exclusion heavy*: "Action movies with high ratings but without superheroes or Marvel."
