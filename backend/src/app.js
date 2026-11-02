import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import { ApiError } from './utils/ApiError.js';
import { logger } from './utils/logger.js';

// Route imports
import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import movieRoutes from './routes/movie.routes.js';
import recommendationRoutes from './routes/recommendation.routes.js';
import watchlistRoutes from './routes/watchlist.routes.js';
import interactionRoutes from './routes/interaction.routes.js';

const app = express();

// Security headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

// Clean and prepare allowed origins strictly from environment variables (.env)
const configuredOrigins = (env.CLIENT_URL || '')
  .split(',')
  .map(url => url.trim().replace(/\/+$/, ''))
  .filter(Boolean);

const allowedOrigins = new Set(configuredOrigins);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
    if (!origin) {
      return callback(null, true);
    }

    const cleanOrigin = origin.replace(/\/+$/, '');

    // Allow if wildcard is configured or if origin matches configured values in .env
    if (allowedOrigins.has('*') || allowedOrigins.has(cleanOrigin)) {
      return callback(null, true);
    }

    logger.warn(`Blocked CORS request from origin: ${origin}. Configured allowed origins from .env: [${Array.from(allowedOrigins).join(', ')}]`);
    return callback(new ApiError(403, `CORS policy violation: Origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// Request logging (development)
if (env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    logger.debug(`${req.method} ${req.originalUrl}`);
    next();
  });
}

// Global API rate limiting
app.use('/api', apiLimiter);

// Mount API routes
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/interactions', interactionRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to CineMatch AI API',
    health: '/api/health',
    version: '1.0.0'
  });
});

// 404 Handler
app.use((req, res, next) => {
  next(ApiError.notFound(`Endpoint ${req.method} ${req.originalUrl} not found`));
});

// Centralized Error Handler
app.use(errorHandler);

export default app;
