import { Router } from 'express';
import { getMovieRecommendations, chatRecommendations } from '../controllers/recommendation.controller.js';
import { optionalAuthenticate } from '../middleware/authenticate.js';
import { recommendationLimiter } from '../middleware/rateLimiter.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { recommendationRequestSchema, chatRequestSchema } from '../validators/recommendation.schema.js';

const router = Router();

router.post(
  '/',
  recommendationLimiter,
  optionalAuthenticate,
  validateRequest(recommendationRequestSchema),
  getMovieRecommendations
);

router.post(
  '/chat',
  recommendationLimiter,
  optionalAuthenticate,
  validateRequest(chatRequestSchema),
  chatRecommendations
);

export default router;

