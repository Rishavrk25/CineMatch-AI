import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getNeo4jDriver, closeNeo4j } from '../src/config/neo4j.js';
import { logger } from '../src/utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CANONICAL_MOVIES_PATH = path.resolve(__dirname, '../../data/canonical_movies.json');

const BATCH_SIZE = 100; // Safe batch size for Neo4j AuraDB Free transaction limits

async function setupConstraints(session) {
  logger.info('Setting up Neo4j uniqueness constraints and indexes...');
  const constraints = [
    'CREATE CONSTRAINT movie_id_unique IF NOT EXISTS FOR (m:Movie) REQUIRE m.id IS UNIQUE',
    'CREATE CONSTRAINT actor_name_unique IF NOT EXISTS FOR (a:Actor) REQUIRE a.name IS UNIQUE',
    'CREATE CONSTRAINT director_name_unique IF NOT EXISTS FOR (d:Director) REQUIRE d.name IS UNIQUE',
    'CREATE CONSTRAINT genre_name_unique IF NOT EXISTS FOR (g:Genre) REQUIRE g.name IS UNIQUE',
    'CREATE CONSTRAINT keyword_name_unique IF NOT EXISTS FOR (k:Keyword) REQUIRE k.name IS UNIQUE'
  ];

  for (const c of constraints) {
    try {
      await session.run(c);
    } catch (err) {
      logger.warn(`Constraint setup notice (${c.split(' ')[2]}): ${err.message}`);
    }
  }
  logger.info('Constraints setup completed.');
}

async function ingestBatch(session, movies) {
  const cypher = `
    UNWIND $batch AS movie
    MERGE (m:Movie { id: movie.movieId })
    SET m.title = movie.title,
        m.releaseYear = movie.releaseYear,
        m.voteAverage = movie.voteAverage,
        m.voteCount = movie.voteCount,
        m.popularity = movie.popularity,
        m.overview = movie.overview

    // Genres
    FOREACH (genreName IN movie.genres |
      MERGE (g:Genre { name: genreName })
      MERGE (m)-[:IN_GENRE]->(g)
    )

    // Directors
    FOREACH (directorName IN movie.directors |
      MERGE (d:Director { name: directorName })
      MERGE (d)-[:DIRECTED]->(m)
    )

    // Actors / Cast
    FOREACH (actor IN movie.topCast |
      MERGE (a:Actor { name: actor.name })
      MERGE (a)-[r:ACTED_IN]->(m)
      SET r.character = actor.character,
          r.order = actor.order
    )

    // Keywords
    FOREACH (keywordName IN movie.keywords |
      MERGE (k:Keyword { name: keywordName })
      MERGE (m)-[:HAS_KEYWORD]->(k)
    )
  `;

  await session.run(cypher, { batch: movies });
}

async function buildKnowledgeGraph() {
  console.log('====================================================');
  console.log('🌐 CineMatch AI — Neo4j Knowledge Graph Ingestion');
  console.log('====================================================\n');

  if (!fs.existsSync(CANONICAL_MOVIES_PATH)) {
    console.error(`❌ Canonical movies file not found at: ${CANONICAL_MOVIES_PATH}`);
    console.error('Please run "npm run ingest:movies" first.');
    process.exit(1);
  }

  const driver = getNeo4jDriver();
  if (!driver) {
    console.error('❌ Could not initialize Neo4j driver. Check NEO4J_* in backend/.env');
    process.exit(1);
  }

  const raw = fs.readFileSync(CANONICAL_MOVIES_PATH, 'utf-8');
  const allMovies = JSON.parse(raw);
  console.log(`Loaded ${allMovies.length} canonical movie records from disk.`);

  const session = driver.session();
  try {
    // 1. Setup Constraints
    await setupConstraints(session);

    // 2. Ingest in Batches
    console.log(`Starting batched graph ingestion (${BATCH_SIZE} movies per batch)...`);
    const totalBatches = Math.ceil(allMovies.length / BATCH_SIZE);
    const startTime = Date.now();

    for (let i = 0; i < allMovies.length; i += BATCH_SIZE) {
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      const batch = allMovies.slice(i, i + BATCH_SIZE).map(m => ({
        movieId: String(m.movieId),
        title: m.title || 'Untitled',
        releaseYear: typeof m.releaseYear === 'number' ? m.releaseYear : null,
        voteAverage: typeof m.voteAverage === 'number' ? m.voteAverage : 0,
        voteCount: typeof m.voteCount === 'number' ? m.voteCount : 0,
        popularity: typeof m.popularity === 'number' ? m.popularity : 0,
        overview: (m.overview || '').slice(0, 1000), // bounded overview length
        genres: (m.genres || []).filter(Boolean),
        directors: (m.directors || []).filter(Boolean),
        topCast: (m.topCast || []).map(c => ({
          name: typeof c === 'string' ? c : c.name,
          character: c.character || '',
          order: typeof c.order === 'number' ? c.order : 0
        })).filter(c => Boolean(c.name)),
        keywords: (m.keywords || []).slice(0, 12).filter(Boolean) // top 12 keywords per movie
      }));

      let retries = 0;
      let success = false;
      while (!success && retries < 3) {
        try {
          await ingestBatch(session, batch);
          success = true;
        } catch (err) {
          retries++;
          logger.warn(`Batch ${batchNumber} failed on attempt ${retries}: ${err.message}. Retrying in ${retries * 2}s...`);
          await new Promise(r => setTimeout(r, retries * 2000));
        }
      }

      if (!success) {
        throw new Error(`Failed to ingest batch ${batchNumber} after 3 attempts.`);
      }

      const percent = ((batchNumber / totalBatches) * 100).toFixed(1);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      process.stdout.write(`\r   Progress: [${batchNumber}/${totalBatches}] batches (${percent}%) in ${elapsed}s`);
    }

    console.log('\n\nIngestion complete! Verifying graph statistics...');

    // 3. Graph Counts Verification
    const statsQuery = `
      MATCH (m:Movie) WITH count(m) AS movieCount
      MATCH (a:Actor) WITH movieCount, count(a) AS actorCount
      MATCH (d:Director) WITH movieCount, actorCount, count(d) AS directorCount
      MATCH (g:Genre) WITH movieCount, actorCount, directorCount, count(g) AS genreCount
      MATCH (k:Keyword) WITH movieCount, actorCount, directorCount, genreCount, count(k) AS keywordCount
      RETURN movieCount, actorCount, directorCount, genreCount, keywordCount
    `;

    const statsRes = await session.run(statsQuery);
    if (statsRes.records.length > 0) {
      const rec = statsRes.records[0];
      console.log('----------------------------------------------------');
      console.log(`🎬 Movie Nodes:    ${rec.get('movieCount')}`);
      console.log(`🎭 Actor Nodes:    ${rec.get('actorCount')}`);
      console.log(`🎬 Director Nodes: ${rec.get('directorCount')}`);
      console.log(`🏷️ Genre Nodes:    ${rec.get('genreCount')}`);
      console.log(`🔑 Keyword Nodes:  ${rec.get('keywordCount')}`);
      console.log('----------------------------------------------------');
    }

    console.log('🎉 Neo4j Knowledge Graph successfully built and verified!');
  } finally {
    await session.close();
    await closeNeo4j();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  buildKnowledgeGraph().catch(err => {
    console.error('Fatal error during graph build:', err);
    process.exit(1);
  });
}

export { buildKnowledgeGraph };

