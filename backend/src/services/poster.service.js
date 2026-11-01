import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CACHE_FILE = path.resolve(__dirname, '../../../data/poster_cache.json');

// In-memory poster map: { [movieIdOrTitle]: string }
const posterCache = new Map();

// Load existing cache from disk if available
try {
  if (fs.existsSync(CACHE_FILE)) {
    const raw = fs.readFileSync(CACHE_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    for (const [key, val] of Object.entries(parsed)) {
      posterCache.set(key, val);
    }
    logger.info(`Loaded ${posterCache.size} movie posters from disk cache.`);
  }
} catch (err) {
  logger.warn('Could not read poster cache file:', err.message);
}

// Debounced save to disk
let saveTimeout = null;
function persistCache() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    try {
      const obj = Object.fromEntries(posterCache);
      fs.writeFileSync(CACHE_FILE, JSON.stringify(obj, null, 2), 'utf8');
    } catch (e) {
      logger.warn('Failed to persist poster cache:', e.message);
    }
  }, 3000);
}

function fetchWikipediaSummary(slug) {
  return new Promise((resolve) => {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(slug)}`;
    const req = https.get(
      url,
      {
        headers: {
          'User-Agent': 'CineMatchAI/1.0 (https://github.com/cinematch; contact@cinematch.ai)'
        },
        timeout: 5000
      },
      (res) => {
        if (res.statusCode !== 200) {
          res.resume();
          return resolve(null);
        }
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve(null);
          }
        });
      }
    );
    req.on('error', () => resolve(null));
    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });
  });
}

/**
 * Resolves a movie poster URL using Wikipedia REST API with fallbacks and disk caching.
 * 
 * @param {string} movieId
 * @param {string} title
 * @param {number|string} [year]
 * @returns {Promise<string|null>} Poster URL or null
 */
export async function getPosterForMovie(movieId, title, year) {
  if (!title) return null;

  const cacheKey = String(movieId || title);
  if (posterCache.has(cacheKey)) {
    return posterCache.get(cacheKey);
  }

  const cleanTitle = title.replace(/\s+/g, '_');
  const releaseYear = year ? String(year).split('-')[0] : null;

  // Ordered candidate slugs for Wikipedia lookup
  const candidates = [];
  if (releaseYear) {
    candidates.push(`${cleanTitle}_(${releaseYear}_film)`);
  }
  candidates.push(`${cleanTitle}_(film)`);
  candidates.push(cleanTitle);
  if (releaseYear) {
    candidates.push(`${cleanTitle}_(${releaseYear})`);
  }

  for (const slug of candidates) {
    try {
      const summary = await fetchWikipediaSummary(slug);
      if (summary && summary.thumbnail && summary.thumbnail.source) {
        const posterUrl = summary.thumbnail.source;
        posterCache.set(cacheKey, posterUrl);
        // Also cache under movie title
        posterCache.set(title.toLowerCase(), posterUrl);
        persistCache();
        return posterUrl;
      }
    } catch {
      // Continue to next candidate
    }
  }

  // If not found, cache null to avoid re-querying repeatedly
  posterCache.set(cacheKey, null);
  persistCache();
  return null;
}

/**
 * Returns poster synchronously from cache if present.
 */
export function getCachedPoster(movieId, title) {
  if (movieId && posterCache.has(String(movieId))) {
    return posterCache.get(String(movieId));
  }
  if (title && posterCache.has(title.toLowerCase())) {
    return posterCache.get(title.toLowerCase());
  }
  return null;
}

export default {
  getPosterForMovie,
  getCachedPoster
};
