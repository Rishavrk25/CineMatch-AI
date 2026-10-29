# CineMatch AI — REST API Documentation

Base URL: `http://localhost:5000/api`

## Health Check
- `GET /api/health`
  - Returns overall server status and connection health for MongoDB, Neo4j, Pinecone, and Gemini.

## Authentication
- `POST /api/auth/register`
  - Body: `{ name, email, password }`
  - Returns: `{ user: { id, name, email }, token }`
- `POST /api/auth/login`
  - Body: `{ email, password }`
  - Returns: `{ user: { id, name, email }, token }`
- `POST /api/auth/logout`
  - Clears auth cookies / invalidates session.
- `GET /api/auth/me`
  - Headers: `Authorization: Bearer <token>`
  - Returns: Current user profile and preferences.

## Movies
- `GET /api/movies`
  - Query parameters: `page`, `limit`, `genre`, `yearMin`, `yearMax`, `sort`
  - Returns paginated canonical movie records.
- `GET /api/movies/:id`
  - Returns single movie details with cast, crew, genres, and keywords.
- `GET /api/movies/search?q=query`
  - Performs keyword search across movie titles and descriptions.
- `GET /api/movies/:id/similar`
  - Returns graph-connected and semantically similar movies.

## Recommendations & AI Chat
- `POST /api/recommendations`
  - Body: `{ query, filters: { genres, excludedGenres, minYear, maxYear }, limit }`
  - Returns: Ranked movie recommendations with Gemini grounded explanations.
- `POST /api/recommendations/chat`
  - Body: `{ conversationId, message, filters }`
  - Returns: Multi-turn conversational recommendation response.

## Interactions & Preferences
- `POST /api/interactions`
  - Body: `{ movieId, interactionType, rating }`
  - Interaction types: `view`, `like`, `dislike`, `rate`
- `GET /api/interactions/me`
  - Returns user's interaction history and taste profile.

## Watchlist
- `GET /api/watchlist`
  - Returns all movies saved in the authenticated user's watchlist.
- `POST /api/watchlist/:movieId`
  - Adds a movie to the user's watchlist.
- `DELETE /api/watchlist/:movieId`
  - Removes a movie from the user's watchlist.
