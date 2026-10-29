# CineMatch AI — Database Schema Specification

## 1. MongoDB Document Models (Mongoose)

### `User`
Stores user profile, authentication credentials, and core taste preferences.
- `_id`: ObjectId
- `name`: String (required, trimmed)
- `email`: String (required, unique, lowercased, indexed)
- `passwordHash`: String (required, bcrypt hashed)
- `favoriteGenres`: [String] (array of genre names, e.g., ["Sci-Fi", "Drama"])
- `favoriteMovieIds`: [String] (array of canonical TMDB movie IDs)
- `preferredLanguages`: [String] (e.g., ["en", "es", "hi"])
- `createdAt`: Date
- `updatedAt`: Date

### `MovieInteraction`
Tracks implicit and explicit interactions for personalized ranking.
- `_id`: ObjectId
- `userId`: ObjectId (ref: 'User', indexed)
- `movieId`: String (canonical TMDB movie ID, indexed)
- `interactionType`: String (enum: `view`, `like`, `dislike`, `watchlist_add`, `rate`)
- `rating`: Number (optional, 1-10 scale)
- `createdAt`: Date

### `Conversation`
Saves conversational RAG context for multi-turn chats.
- `_id`: ObjectId
- `userId`: ObjectId (ref: 'User', indexed)
- `conversationId`: String (UUIDv4, unique, indexed)
- `title`: String
- `messages`: Array of:
  - `role`: String (`user` | `assistant` | `system`)
  - `content`: String
  - `timestamp`: Date
  - `recommendedMovieIds`: [String]
  - `metadata`: Mixed
- `createdAt`: Date
- `updatedAt`: Date

---

## 2. Neo4j Knowledge Graph Model

### Nodes:
- `(:Movie {id: String, title: String, releaseYear: Integer, rating: Float, voteCount: Integer})`
- `(:Actor {id: String, name: String})`
- `(:Director {id: String, name: String})`
- `(:Genre {name: String})`
- `(:Keyword {id: String, name: String})`

### Constraints & Indexes:
- `CREATE CONSTRAINT FOR (m:Movie) REQUIRE m.id IS UNIQUE;`
- `CREATE CONSTRAINT FOR (a:Actor) REQUIRE a.name IS UNIQUE;`
- `CREATE CONSTRAINT FOR (d:Director) REQUIRE d.name IS UNIQUE;`
- `CREATE CONSTRAINT FOR (g:Genre) REQUIRE g.name IS UNIQUE;`
- `CREATE CONSTRAINT FOR (k:Keyword) REQUIRE k.name IS UNIQUE;`

### Relationships:
- `(:Actor)-[:ACTED_IN {character: String, order: Integer}]->(:Movie)`
- `(:Director)-[:DIRECTED]->(:Movie)`
- `(:Movie)-[:IN_GENRE]->(:Genre)`
- `(:Movie)-[:HAS_KEYWORD]->(:Keyword)`

---

## 3. Pinecone Vector Schema

- **Index Name**: `cinematch-movies` (or custom name from `PINECONE_INDEX_NAME`)
- **Dimension**: 768 (`text-embedding-004`)
- **Metric**: `cosine`
- **Vector ID**: Canonical TMDB Movie ID (string, e.g., `"157336"`)
- **Metadata**:
  - `title`: String
  - `releaseYear`: Integer
  - `genres`: Array of Strings (filter-compatible)
  - `voteAverage`: Float
  - `originalLanguage`: String
