import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getPineconeIndex } from '../src/config/pinecone.js';
import { generateMovieEmbedding } from '../src/services/geminiEmbedding.service.js';
import { env } from '../src/config/env.js';
import { logger } from '../src/utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CANONICAL_MOVIES_PATH = path.resolve(__dirname, '../../data/canonical_movies.json');
const PROGRESS_FILE = path.resolve(__dirname, '../../data/.indexing_progress.json');

const UPSERT_BATCH_SIZE = 50; // Pinecone upsert batch limit
const EMBED_DELAY_MS = 60;    // Rate limiting pacing between Gemini API calls

function loadProgress() {
  if (fs.existsSync(PROGRESS_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
      return new Set(data.indexedIds || []);
    } catch {
      return new Set();
    }
  }
  return new Set();
}

function saveProgress(indexedSet) {
  const data = {
    lastUpdated: new Date().toISOString(),
    totalIndexed: indexedSet.size,
    indexedIds: Array.from(indexedSet)
  };
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

async function indexVectors() {
  console.log('====================================================');
  console.log('🌲 CineMatch AI — Pinecone Vector Indexing Pipeline');
  console.log('====================================================\n');

  if (!fs.existsSync(CANONICAL_MOVIES_PATH)) {
    console.error(`❌ Canonical movies file not found at: ${CANONICAL_MOVIES_PATH}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(CANONICAL_MOVIES_PATH, 'utf-8');
  const allMovies = JSON.parse(raw);

  // Check optional CLI limit (e.g., node scripts/indexVectors.js --limit 500)
  const limitArgIndex = process.argv.indexOf('--limit');
  const limit = limitArgIndex !== -1 ? parseInt(process.argv[limitArgIndex + 1], 10) : allMovies.length;
  const targetMovies = allMovies.slice(0, limit);

  console.log(`Loaded ${allMovies.length} total movies from disk.`);
  console.log(`Targeting ${targetMovies.length} movies for vector indexing.`);

  const index = getPineconeIndex();
  if (!index) {
    console.error('❌ Pinecone index connection failed. Check PINECONE_API_KEY in backend/.env');
    process.exit(1);
  }

  const targetNamespace = env.PINECONE_NAMESPACE ? index.namespace(env.PINECONE_NAMESPACE) : index;

  const indexedSet = loadProgress();
  console.log(`Resuming indexing. Previously indexed: ${indexedSet.size} movies.`);

  const unindexedMovies = targetMovies.filter(m => !indexedSet.has(String(m.movieId)));
  console.log(`Remaining movies to embed & upsert: ${unindexedMovies.length}\n`);

  if (unindexedMovies.length === 0) {
    console.log('✨ All targeted movies are already indexed in Pinecone! Nothing to do.');
    return;
  }

  let batch = [];
  let embeddedCount = 0;
  let failedCount = 0;
  const startTime = Date.now();

  for (let i = 0; i < unindexedMovies.length; i++) {
    const movie = unindexedMovies[i];
    const movieId = String(movie.movieId);

    let vector = null;
    let retries = 0;

    while (!vector && retries < 3) {
      try {
        vector = await generateMovieEmbedding(movie.documentText || movie.overview);
      } catch (err) {
        retries++;
        logger.warn(`Embedding failed for movie ${movieId} "${movie.title}" (attempt ${retries}): ${err.message}`);
        await new Promise(r => setTimeout(r, retries * 2000));
      }
    }

    if (!vector) {
      logger.error(`Skipping movie ${movieId} after 3 failed embedding attempts.`);
      failedCount++;
      continue;
    }

    batch.push({
      id: movieId,
      values: vector,
      metadata: {
        movieId,
        title: movie.title || 'Untitled',
        releaseYear: typeof movie.releaseYear === 'number' ? movie.releaseYear : 0,
        genres: Array.isArray(movie.genres) ? movie.genres : [],
        voteAverage: typeof movie.voteAverage === 'number' ? movie.voteAverage : 0,
        originalLanguage: movie.originalLanguage || 'en'
      }
    });

    embeddedCount++;
    const percent = (((i + 1) / unindexedMovies.length) * 100).toFixed(1);
    process.stdout.write(`\r   Progress: [${i + 1}/${unindexedMovies.length}] embedded (${percent}%) - Batch queue: ${batch.length}`);

    // When batch is full or at the end, upsert to Pinecone
    if (batch.length >= UPSERT_BATCH_SIZE || i === unindexedMovies.length - 1) {
      try {
        await targetNamespace.upsert(batch);
        for (const item of batch) {
          indexedSet.add(item.id);
        }
        saveProgress(indexedSet);
        batch = [];
      } catch (err) {
        logger.error(`Failed to upsert batch to Pinecone: ${err.message}`);
      }
    }

    await new Promise(r => setTimeout(r, EMBED_DELAY_MS));
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('\n\n====================================================');
  console.log(`🎉 Pinecone Vector Indexing Finished in ${durationSec}s`);
  console.log(`   Successfully Embedded & Upserted: ${embeddedCount}`);
  console.log(`   Failed / Skipped: ${failedCount}`);
  console.log(`   Total in Index Record: ${indexedSet.size}`);
  console.log('====================================================');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  indexVectors().catch(err => {
    console.error('Fatal indexing error:', err);
    process.exit(1);
  });
}

export { indexVectors };

