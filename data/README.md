# CineMatch AI — Movie Dataset Directory

This directory stores movie metadata used for ingestion into Neo4j (Knowledge Graph) and Pinecone (Vector Database).

## Dataset Status: ✅ Acquired & Validated

- `tmdb_5000_movies.csv` (5.43 MB): 4,803 movie records with overview, budget, revenue, genres, and ratings.
- `tmdb_5000_credits.csv` (38.19 MB): 4,803 credits records with complete cast, directors, and crew.
- `canonical_movies.json` (10.09 MB): Normalized canonical movie documents ready for vector embeddings and graph relations.

## Attribution
This product uses the TMDB API and dataset but is not endorsed or certified by TMDB.
Movie metadata and credits are provided courtesy of The Movie Database (TMDB).

## Ingestion Pipeline Commands
```bash
# 1. Validate dataset integrity
npm run validate:data --workspace=backend

# 2. Normalize and generate canonical movie records
npm run ingest:movies --workspace=backend

# 3. Ingest nodes & relationships into Neo4j Knowledge Graph
npm run build:graph --workspace=backend

# 4. Generate Gemini embeddings & upsert into Pinecone
npm run index:vectors --workspace=backend
```
