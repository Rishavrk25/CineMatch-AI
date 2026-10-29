# CineMatch AI — Movie Dataset Directory

This directory stores movie metadata used for ingestion into Neo4j (Knowledge Graph) and Pinecone (Vector Database).

## Expected Dataset: TMDB 5000 Movie Dataset

Source: [Kaggle - TMDB 5000 Movie Dataset](https://www.kaggle.com/datasets/tmdb/tmdb-movie-metadata) or official TMDB export.

Expected files:
- `tmdb_5000_movies.csv`: Contains `budget`, `genres`, `homepage`, `id`, `keywords`, `original_language`, `original_title`, `overview`, `popularity`, `production_companies`, `production_countries`, `release_date`, `revenue`, `runtime`, `spoken_languages`, `status`, `tagline`, `title`, `vote_average`, `vote_count`.
- `tmdb_5000_credits.csv`: Contains `movie_id`, `title`, `cast`, `crew`.

## Attribution
This product uses the TMDB API and dataset but is not endorsed or certified by TMDB.
Movie metadata and credits are provided courtesy of The Movie Database (TMDB).

## Ingestion Pipeline
Once the CSV files are downloaded into this folder:
```bash
npm run validate:data --workspace=backend
npm run ingest:movies --workspace=backend
npm run build:graph --workspace=backend
npm run index:vectors --workspace=backend
```
