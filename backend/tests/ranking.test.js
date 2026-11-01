import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { rankCandidates, DEFAULT_WEIGHTS } from '../src/services/ranking.service.js';
import { parseQueryConstraints } from '../src/services/rag.service.js';

describe('Deterministic Hybrid Ranking & Filtering Tests', () => {
  const sampleVectorCandidates = [
    {
      movieId: '100',
      semanticScore: 0.90,
      metadata: { title: 'Movie A', releaseYear: 2015, genres: ['Action', 'Sci-Fi'], voteAverage: 8.5 }
    },
    {
      movieId: '200',
      semanticScore: 0.85,
      metadata: { title: 'Movie B', releaseYear: 2005, genres: ['Horror', 'Thriller'], voteAverage: 7.0 }
    },
    {
      movieId: '300',
      semanticScore: 0.70,
      metadata: { title: 'Movie C', releaseYear: 2018, genres: ['Drama'], voteAverage: 8.0 }
    }
  ];

  const sampleGraphCandidates = [
    {
      movieId: '100',
      graphScore: 0.80,
      evidence: ['Shares director Christopher Nolan'],
      metadata: { title: 'Movie A', releaseYear: 2015, voteAverage: 8.5 }
    },
    {
      movieId: '400',
      graphScore: 0.75,
      evidence: ['Shares cast member Matthew McConaughey'],
      metadata: { title: 'Movie D', releaseYear: 2016, genres: ['Sci-Fi'], voteAverage: 7.5 }
    }
  ];

  test('Merges vector and graph candidates without duplicates', () => {
    const ranked = rankCandidates({
      vectorCandidates: sampleVectorCandidates,
      graphCandidates: sampleGraphCandidates,
      topK: 10
    });

    const ids = ranked.map(r => r.movieId);
    const uniqueIds = new Set(ids);
    assert.equal(ids.length, uniqueIds.size, 'No duplicates should exist');

    // Movie 100 was in both and should have both sources
    const movie100 = ranked.find(r => r.movieId === '100');
    assert.ok(movie100, 'Movie 100 must be present');
    assert.ok(movie100.sources.includes('vector') && movie100.sources.includes('graph'));
  });

  test('Enforces negative genre exclusions override score', () => {
    const ranked = rankCandidates({
      vectorCandidates: sampleVectorCandidates,
      graphCandidates: sampleGraphCandidates,
      constraints: { excludedGenres: ['Horror'] },
      topK: 10
    });

    const horrorMovie = ranked.find(r => r.movieId === '200');
    assert.equal(horrorMovie, undefined, 'Horror movie must be strictly excluded');
  });

  test('Enforces release year constraints (minYear / maxYear)', () => {
    const ranked = rankCandidates({
      vectorCandidates: sampleVectorCandidates,
      graphCandidates: sampleGraphCandidates,
      constraints: { minYear: 2010 },
      topK: 10
    });

    for (const r of ranked) {
      assert.ok(r.releaseYear >= 2010, `Movie ${r.title} year ${r.releaseYear} must be >= 2010`);
    }
  });

  test('Applies user disliked movies exclusion', () => {
    const ranked = rankCandidates({
      vectorCandidates: sampleVectorCandidates,
      graphCandidates: sampleGraphCandidates,
      preferences: { dislikedMovieIds: ['100'] },
      topK: 10
    });

    const disliked = ranked.find(r => r.movieId === '100');
    assert.equal(disliked, undefined, 'Disliked movie must be excluded');
  });

  test('Parses natural language constraints from query string', () => {
    const query = 'Recommend emotional sci-fi movies about space exploration. Avoid horror and movies released before 2012.';
    const parsed = parseQueryConstraints(query);

    assert.ok(parsed.excludedGenres.includes('Horror'), 'Should detect Horror exclusion');
    assert.equal(parsed.minYear, 2012, 'Should detect minYear 2012');
    assert.ok(parsed.genres.includes('Science Fiction'), 'Should detect Science Fiction genre');
  });
});

