import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';

describe('Movie Catalog & Discovery Endpoints', () => {
  test('GET /api/movies returns paginated movies with metadata', async () => {
    const res = await request(app).get('/api/movies?page=1&limit=5');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.movies.length, 5);
    assert.ok(res.body.total > 0, 'Total movies count should be greater than 0');
    assert.ok(res.body.totalPages > 0);

    const first = res.body.movies[0];
    assert.ok(first.movieId, 'Movie must have canonical movieId');
    assert.ok(first.title, 'Movie must have title');
  });

  test('GET /api/movies?genre=Drama filters by genre', async () => {
    const res = await request(app).get('/api/movies?genre=Drama&limit=10');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    for (const m of res.body.movies) {
      assert.ok(m.genres.includes('Drama'), `Movie ${m.title} must include Drama genre`);
    }
  });

  test('GET /api/movies/search?q=Inception finds relevant title', async () => {
    const res = await request(app).get('/api/movies/search?q=Inception');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.movies.length > 0);
    const found = res.body.movies.some(m => m.title.toLowerCase().includes('inception'));
    assert.ok(found, 'Should find Inception');
  });

  test('GET /api/movies/:id returns single movie details', async () => {
    const res = await request(app).get('/api/movies/27205'); // Inception TMDB ID
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.movie.title, 'Inception');
    assert.ok(res.body.movie.directors.includes('Christopher Nolan'));
  });

  test('GET /api/movies/99999999 returns 404 for nonexistent movie', async () => {
    const res = await request(app).get('/api/movies/99999999');
    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
  });
});
