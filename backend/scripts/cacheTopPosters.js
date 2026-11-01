import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getPosterForMovie } from '../src/services/poster.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CANONICAL_FILE = path.resolve(__dirname, '../../data/canonical_movies.json');
const CACHE_FILE = path.resolve(__dirname, '../../data/poster_cache.json');

async function main() {
  console.log('🖼️  Pre-fetching official movie posters for top popular movies...');
  const raw = fs.readFileSync(CANONICAL_FILE, 'utf8');
  const movies = JSON.parse(raw);

  // Sort by popularity descending
  movies.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

  const topMovies = movies.slice(0, 150);
  console.log(`Processing top ${topMovies.length} movies...`);

  let fetched = 0;
  for (let i = 0; i < topMovies.length; i++) {
    const m = topMovies[i];
    const poster = await getPosterForMovie(m.movieId, m.title, m.releaseYear);
    if (poster) {
      fetched++;
      console.log(`[${i + 1}/${topMovies.length}] ✓ ${m.title} (${m.releaseYear})`);
    } else {
      console.log(`[${i + 1}/${topMovies.length}] ✗ ${m.title} (${m.releaseYear})`);
    }
  }

  console.log(`\n🎉 Successfully cached ${fetched} / ${topMovies.length} movie posters into ${CACHE_FILE}`);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

