import { searchSimilarMovies } from '../src/services/vectorSearch.service.js';
import { searchGraphMovies } from '../src/services/graphSearch.service.js';
import { rankCandidates } from '../src/services/ranking.service.js';
import { getRecommendations, parseQueryConstraints } from '../src/services/rag.service.js';
import { closeMongoDB } from '../src/config/mongodb.js';
import { closeNeo4j } from '../src/config/neo4j.js';

// Manually curated benchmark test cases
const BENCHMARK_QUERIES = [
  {
    query: 'Mind-bending science-fiction movies involving time travel, space exploration, and emotional storytelling. Avoid horror and movies released before 2010.',
    expectedThemes: ['Science Fiction', 'Adventure', 'Drama'],
    prohibitedGenres: ['Horror'],
    minYear: 2010,
    benchmarkRelevantTitles: ['Interstellar', 'Inception', 'Edge of Tomorrow']
  },
  {
    query: 'Dark psychological thrillers and crime mysteries directed by Christopher Nolan or David Fincher.',
    expectedThemes: ['Drama', 'Thriller', 'Crime', 'Mystery'],
    prohibitedGenres: [],
    minYear: null,
    benchmarkRelevantTitles: ['Fight Club', 'Seven', 'Zodiac', 'Inception', 'Memento', 'The Prestige']
  },
  {
    query: 'Warmhearted animated family adventures with stunning animation and humor. No war or violence.',
    expectedThemes: ['Animation', 'Family', 'Adventure', 'Comedy'],
    prohibitedGenres: ['War'],
    minYear: null,
    benchmarkRelevantTitles: ['Up', 'Toy Story 3', 'Inside Out', 'Finding Nemo', 'WALL·E']
  }
];

function calculateMetrics(recommendations, benchmark) {
  if (!recommendations || recommendations.length === 0) {
    return { precision: 0, recall: 0, constraintViolations: 0, duplicateCount: 0 };
  }

  const k = recommendations.length;
  let relevantCount = 0;
  let violationCount = 0;
  const seenIds = new Set();
  let duplicateCount = 0;

  for (const movie of recommendations) {
    if (seenIds.has(movie.movieId)) {
      duplicateCount++;
    }
    seenIds.add(movie.movieId);

    // Check prohibited genre violation
    if (movie.genres && benchmark.prohibitedGenres.length > 0) {
      const violated = movie.genres.some(g =>
        benchmark.prohibitedGenres.some(pg => pg.toLowerCase() === g.toLowerCase())
      );
      if (violated) violationCount++;
    }

    // Check year violation
    if (benchmark.minYear && movie.releaseYear && movie.releaseYear < benchmark.minYear) {
      violationCount++;
    }

    // Check relevance (matches benchmark relevant titles or expected themes)
    const matchesTitle = benchmark.benchmarkRelevantTitles.some(t =>
      movie.title.toLowerCase().includes(t.toLowerCase())
    );
    const matchesThemes = movie.genres && movie.genres.some(g =>
      benchmark.expectedThemes.some(et => et.toLowerCase() === g.toLowerCase())
    );

    if (matchesTitle || matchesThemes) {
      relevantCount++;
    }
  }

  return {
    precision: relevantCount / k,
    recall: relevantCount / Math.max(1, benchmark.benchmarkRelevantTitles.length),
    constraintViolations: violationCount,
    duplicateCount
  };
}

async function runEvaluation() {
  console.log('====================================================');
  console.log('📊 CineMatch AI — Recommendation Evaluation Suite');
  console.log('====================================================\n');

  console.log('Evaluating 3 Retrieval Strategies across benchmark queries:');
  console.log('1. Pinecone Vector-Only Retrieval');
  console.log('2. Neo4j Knowledge Graph-Only Retrieval');
  console.log('3. Hybrid RAG (Pinecone + Neo4j + Deterministic Ranking)\n');

  const strategyResults = {
    vectorOnly: { precisions: [], latencies: [], violations: 0 },
    graphOnly: { precisions: [], latencies: [], violations: 0 },
    hybrid: { precisions: [], latencies: [], violations: 0 }
  };

  for (let i = 0; i < BENCHMARK_QUERIES.length; i++) {
    const bench = BENCHMARK_QUERIES[i];
    console.log(`[Test Query ${i + 1}/${BENCHMARK_QUERIES.length}]: "${bench.query.slice(0, 70)}..."`);
    const constraints = parseQueryConstraints(bench.query);

    // Strategy 1: Vector Only
    const vStart = Date.now();
    const vectorCand = await searchSimilarMovies({ query: bench.query, topK: 5 }).catch(() => []);
    const vElapsed = Date.now() - vStart;
    const vMetrics = calculateMetrics(vectorCand.map(v => ({ movieId: v.movieId, title: v.metadata.title, genres: v.metadata.genres, releaseYear: v.metadata.releaseYear })), bench);
    strategyResults.vectorOnly.precisions.push(vMetrics.precision);
    strategyResults.vectorOnly.latencies.push(vElapsed);
    strategyResults.vectorOnly.violations += vMetrics.constraintViolations;

    // Strategy 2: Graph Only
    const gStart = Date.now();
    const graphCand = await searchGraphMovies({
      genres: constraints.genres,
      minYear: constraints.minYear,
      maxYear: constraints.maxYear,
      limit: 5
    }).catch(() => []);
    const gElapsed = Date.now() - gStart;
    const gMetrics = calculateMetrics(graphCand.map(g => ({ movieId: g.movieId, title: g.metadata.title, genres: g.metadata.genres || [], releaseYear: g.metadata.releaseYear })), bench);
    strategyResults.graphOnly.precisions.push(gMetrics.precision);
    strategyResults.graphOnly.latencies.push(gElapsed);
    strategyResults.graphOnly.violations += gMetrics.constraintViolations;

    // Strategy 3: Full Hybrid RAG
    const hStart = Date.now();
    const hybridRes = await getRecommendations({ query: bench.query, limit: 5 });
    const hElapsed = Date.now() - hStart;
    const hMetrics = calculateMetrics(hybridRes.recommendations, bench);
    strategyResults.hybrid.precisions.push(hMetrics.precision);
    strategyResults.hybrid.latencies.push(hElapsed);
    strategyResults.hybrid.violations += hMetrics.constraintViolations;

    console.log(`   - Vector Only: P@5 = ${(vMetrics.precision * 100).toFixed(0)}%, Latency = ${vElapsed}ms, Violations = ${vMetrics.constraintViolations}`);
    console.log(`   - Graph Only:  P@5 = ${(gMetrics.precision * 100).toFixed(0)}%, Latency = ${gElapsed}ms, Violations = ${gMetrics.constraintViolations}`);
    console.log(`   - Hybrid RAG:  P@5 = ${(hMetrics.precision * 100).toFixed(0)}%, Latency = ${hElapsed}ms, Violations = ${hMetrics.constraintViolations}\n`);
  }

  // Summary Table
  const avg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

  console.log('====================================================');
  console.log('🏆 BENCHMARK EVALUATION COMPARISON');
  console.log('====================================================');
  console.log(`Strategy          | Avg Precision@5 | Avg Latency | Total Violations`);
  console.log(`-------------------------------------------------------------------`);
  console.log(`Vector-Only       | ${(avg(strategyResults.vectorOnly.precisions) * 100).toFixed(1)}%          | ${avg(strategyResults.vectorOnly.latencies).toFixed(0)}ms       | ${strategyResults.vectorOnly.violations}`);
  console.log(`Graph-Only        | ${(avg(strategyResults.graphOnly.precisions) * 100).toFixed(1)}%          | ${avg(strategyResults.graphOnly.latencies).toFixed(0)}ms       | ${strategyResults.graphOnly.violations}`);
  console.log(`Hybrid RAG (Ours) | ${(avg(strategyResults.hybrid.precisions) * 100).toFixed(1)}%          | ${avg(strategyResults.hybrid.latencies).toFixed(0)}ms      | ${strategyResults.hybrid.violations}`);
  console.log('====================================================\n');

  await closeMongoDB();
  await closeNeo4j();
}

runEvaluation().catch(err => {
  console.error('Evaluation run failed:', err);
  process.exit(1);
});
