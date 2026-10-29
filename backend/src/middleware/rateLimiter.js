import rateLimit from 'express-rate-limit';

// Standard API rate limiter (100 requests per 15 minutes)
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  }
});

// Stricter rate limiter for LLM / Recommendation endpoints to safeguard free tier
export const recommendationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 15, // matches Gemini free tier ~15 RPM limit
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: 'Recommendation request rate limit reached. Please wait a moment before asking again.'
  }
});

// Stricter limiter for authentication routes (login / register)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many authentication attempts, please try again after 15 minutes.'
  }
});
