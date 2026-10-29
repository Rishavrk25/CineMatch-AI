import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import csv from 'csv-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');

const MOVIES_CSV = path.join(DATA_DIR, 'tmdb_5000_movies.csv');
const CREDITS_CSV = path.join(DATA_DIR, 'tmdb_5000_credits.csv');
const OUTPUT_JSON = path.join(DATA_DIR, 'canonical_movies.json');

function safeJsonParse(str, fallback = []) {
  if (!str || typeof str !== 'string') return fallback;
  try {
    return JSON.parse(str);
  } catch (e) {
    try {
      const fixed = str.replace(/'/g, '"');
      return JSON.parse(fixed);
    } catch {
      return fallback;
    }
  }
}

/**
 * Builds a deterministic, rich text representation for semantic vector embeddings.
 */
export function buildMovieDocument(movie) {
  const parts = [];
  parts.push(`Title: ${movie.title}`);
  if (movie.releaseYear) {
    parts.push(`Release Year: ${movie.releaseYear}`);
  }
  if (movie.genres && movie.genres.length > 0) {
    parts.push(`Genres: ${movie.genres.join(', ')}`);
  }
  if (movie.directors && movie.directors.length > 0) {
    parts.push(`Director: ${movie.directors.join(', ')}`);
  }
  if (movie.topCast && movie.topCast.length > 0) {
    const castNames = movie.topCast.map(c => typeof c === 'string' ? c : c.name).filter(Boolean);
    if (castNames.length > 0) {
      parts.push(`Cast: ${castNames.slice(0, 5).join(', ')}`);
    }
  }
  if (movie.keywords && movie.keywords.length > 0) {
    parts.push(`Keywords: ${movie.keywords.slice(0, 10).join(', ')}`);
  }
  if (movie.overview) {
    parts.push(`Overview: ${movie.overview}`);
  }
  if (movie.tagline) {
    parts.push(`Tagline: ${movie.tagline}`);
  }
  return parts.join('\n');
}

async function ingestAndNormalizeMovies() {
  console.log('====================================================');
  console.log('🎬 CineMatch AI — Ingestion & Normalization Pipeline');
  console.log('====================================================');

  if (!fs.existsSync(MOVIES_CSV) || !fs.existsSync(CREDITS_CSV)) {
    console.error('❌ Required dataset files not found in data/ directory.');
    console.error('Please ensure tmdb_5000_movies.csv and tmdb_5000_credits.csv exist.');
    process.exit(1);
  }

  const moviesMap = new Map();

  console.log('\n[Phase 1/3] Reading movies metadata...');
  await new Promise((resolve, reject) => {
    fs.createReadStream(MOVIES_CSV)
      .pipe(csv())
      .on('data', (row) => {
        const id = String(row.id || '').trim();
        if (!id) return;

        const title = row.title || row.original_title || 'Untitled';
        const genres = safeJsonParse(row.genres).map(g => g.name).filter(Boolean);
        const keywords = safeJsonParse(row.keywords).map(k => k.name).filter(Boolean);
        const releaseDate = row.release_date || '';
        const releaseYear = releaseDate ? parseInt(releaseDate.split('-')[0], 10) : null;
        const voteAverage = parseFloat(row.vote_average || '0');
        const voteCount = parseInt(row.vote_count || '0', 10);
        const popularity = parseFloat(row.popularity || '0');
        const runtime = parseInt(row.runtime || '0', 10);
        const overview = (row.overview || '').trim();
        const tagline = (row.tagline || '').trim();

        moviesMap.set(id, {
          movieId: id,
          title,
          genres,
          keywords,
          releaseYear: isNaN(releaseYear) ? null : releaseYear,
          releaseDate,
          voteAverage: isNaN(voteAverage) ? 0 : voteAverage,
          voteCount: isNaN(voteCount) ? 0 : voteCount,
          popularity: isNaN(popularity) ? 0 : popularity,
          runtime: isNaN(runtime) ? null : runtime,
          overview,
          tagline,
          originalLanguage: row.original_language || 'en',
          directors: [],
          topCast: []
        });
      })
      .on('end', resolve)
      .on('error', reject);
  });

  console.log(`✓ Loaded ${moviesMap.size} unique movies.`);

  console.log('\n[Phase 2/3] Merging cast and crew credits...');
  await new Promise((resolve, reject) => {
    fs.createReadStream(CREDITS_CSV)
      .pipe(csv())
      .on('data', (row) => {
        const movieId = String(row.movie_id || row.id || '').trim();
        const movie = moviesMap.get(movieId);
        if (!movie) return;

        const crew = safeJsonParse(row.crew);
        const cast = safeJsonParse(row.cast);

        movie.directors = crew
          .filter(c => c.job === 'Director')
          .map(c => c.name.trim())
          .filter(Boolean);

        movie.topCast = cast
          .slice(0, 6)
          .map(c => ({
            name: c.name?.trim(),
            character: c.character?.trim(),
            order: typeof c.order === 'number' ? c.order : 0
          }))
          .filter(c => Boolean(c.name));
      })
      .on('end', resolve)
      .on('error', reject);
  });

  console.log('\n[Phase 3/3] Generating deterministic documents & export...');
  const canonicalList = [];
  for (const movie of moviesMap.values()) {
    // Generate deterministic embedding text document
    movie.documentText = buildMovieDocument(movie);
    canonicalList.push(movie);
  }

  // Sort by vote_count / popularity for consistent ordering
  canonicalList.sort((a, b) => (b.voteCount * b.voteAverage) - (a.voteCount * a.voteAverage));

  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(canonicalList, null, 2), 'utf-8');
  console.log(`✓ Exported ${canonicalList.length} canonical movie records to ${OUTPUT_JSON}`);
  console.log(`  File size: ${(fs.statSync(OUTPUT_JSON).size / (1024 * 1024)).toFixed(2)} MB`);

  console.log('\n✨ Ingestion completed successfully! Ready for Vector and Graph indexing.');
}

// Execute when run as CLI script
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  ingestAndNormalizeMovies().catch(err => {
    console.error('Ingestion failed:', err);
    process.exit(1);
  });
}
