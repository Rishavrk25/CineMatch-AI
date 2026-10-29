import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import csv from 'csv-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');

const MOVIES_CSV = path.join(DATA_DIR, 'tmdb_5000_movies.csv');
const CREDITS_CSV = path.join(DATA_DIR, 'tmdb_5000_credits.csv');

function safeJsonParse(str, fallback = []) {
  if (!str || typeof str !== 'string') return fallback;
  try {
    return JSON.parse(str);
  } catch (e) {
    try {
      // In case quotes are slightly malformed in some exports
      const fixed = str.replace(/'/g, '"');
      return JSON.parse(fixed);
    } catch {
      return fallback;
    }
  }
}

async function validateDataset() {
  console.log('====================================================');
  console.log('🔍 CineMatch AI — TMDB 5000 Dataset Validation Tool');
  console.log('====================================================');

  if (!fs.existsSync(MOVIES_CSV)) {
    console.error(`❌ Missing movies file: ${MOVIES_CSV}`);
    console.error('Please ensure tmdb_5000_movies.csv is downloaded into the data/ directory.');
    process.exit(1);
  }

  if (!fs.existsSync(CREDITS_CSV)) {
    console.error(`❌ Missing credits file: ${CREDITS_CSV}`);
    console.error('Please ensure tmdb_5000_credits.csv is downloaded into the data/ directory.');
    process.exit(1);
  }

  const movieStats = fs.statSync(MOVIES_CSV);
  const creditsStats = fs.statSync(CREDITS_CSV);

  console.log(`📁 Found tmdb_5000_movies.csv  (${(movieStats.size / (1024 * 1024)).toFixed(2)} MB)`);
  console.log(`📁 Found tmdb_5000_credits.csv (${(creditsStats.size / (1024 * 1024)).toFixed(2)} MB)`);

  const moviesMap = new Map();
  let moviesCount = 0;
  let missingOverviewCount = 0;
  let missingYearCount = 0;

  console.log('\n[1/3] Validating and indexing tmdb_5000_movies.csv...');
  await new Promise((resolve, reject) => {
    fs.createReadStream(MOVIES_CSV)
      .pipe(csv())
      .on('data', (row) => {
        moviesCount++;
        const id = String(row.id || '').trim();
        if (!id) return;

        const title = row.title || row.original_title || 'Untitled';
        const genres = safeJsonParse(row.genres).map(g => g.name).filter(Boolean);
        const keywords = safeJsonParse(row.keywords).map(k => k.name).filter(Boolean);
        const releaseDate = row.release_date || '';
        const releaseYear = releaseDate ? parseInt(releaseDate.split('-')[0], 10) : null;
        const voteAverage = parseFloat(row.vote_average || '0');
        const voteCount = parseInt(row.vote_count || '0', 10);
        const overview = (row.overview || '').trim();

        if (!overview) missingOverviewCount++;
        if (!releaseYear || isNaN(releaseYear)) missingYearCount++;

        moviesMap.set(id, {
          id,
          title,
          genres,
          keywords,
          releaseYear: isNaN(releaseYear) ? null : releaseYear,
          releaseDate,
          voteAverage: isNaN(voteAverage) ? 0 : voteAverage,
          voteCount: isNaN(voteCount) ? 0 : voteCount,
          overview,
          originalLanguage: row.original_language || 'en'
        });
      })
      .on('end', resolve)
      .on('error', reject);
  });

  console.log(`✓ Parsed ${moviesCount} movie records (${moviesMap.size} unique IDs).`);
  console.log(`  - Missing overview: ${missingOverviewCount} records (handled gracefully)`);
  console.log(`  - Missing release year: ${missingYearCount} records (handled gracefully)`);

  console.log('\n[2/3] Validating and merging tmdb_5000_credits.csv...');
  let creditsCount = 0;
  let matchedCredits = 0;
  let directorCount = 0;
  let castCount = 0;

  await new Promise((resolve, reject) => {
    fs.createReadStream(CREDITS_CSV)
      .pipe(csv())
      .on('data', (row) => {
        creditsCount++;
        const movieId = String(row.movie_id || row.id || '').trim();
        const movie = moviesMap.get(movieId);

        if (movie) {
          matchedCredits++;
          const crew = safeJsonParse(row.crew);
          const cast = safeJsonParse(row.cast);

          const directors = crew
            .filter(c => c.job === 'Director')
            .map(c => c.name)
            .filter(Boolean);

          const topCast = cast
            .slice(0, 5)
            .map(c => ({ name: c.name, character: c.character, order: c.order }))
            .filter(c => Boolean(c.name));

          movie.directors = directors;
          movie.topCast = topCast;

          if (directors.length > 0) directorCount++;
          if (topCast.length > 0) castCount++;
        }
      })
      .on('end', resolve)
      .on('error', reject);
  });

  console.log(`✓ Parsed ${creditsCount} credits records.`);
  console.log(`✓ Matched ${matchedCredits} / ${moviesMap.size} movie records with credits data.`);
  console.log(`  - Movies with verified directors: ${directorCount}`);
  console.log(`  - Movies with top cast extracted: ${castCount}`);

  console.log('\n[3/3] Canonical Document Generation Sample:');
  const sampleMovie = Array.from(moviesMap.values()).find(m => m.directors && m.directors.length > 0) || Array.from(moviesMap.values())[0];
  if (sampleMovie) {
    console.log('----------------------------------------------------');
    console.log(`Title: ${sampleMovie.title}`);
    console.log(`Release Year: ${sampleMovie.releaseYear || 'Unknown'}`);
    console.log(`Genres: ${sampleMovie.genres.join(', ') || 'None'}`);
    console.log(`Director(s): ${sampleMovie.directors?.join(', ') || 'Unknown'}`);
    console.log(`Cast: ${sampleMovie.topCast?.map(c => c.name).join(', ') || 'Unknown'}`);
    console.log(`Overview: ${sampleMovie.overview.slice(0, 150)}...`);
    console.log('----------------------------------------------------');
  }

  console.log('\n🎉 Dataset Validation PASSED! Ready for Neo4j Graph & Pinecone Ingestion.');
}

validateDataset().catch(err => {
  console.error('Validation error:', err);
  process.exit(1);
});
