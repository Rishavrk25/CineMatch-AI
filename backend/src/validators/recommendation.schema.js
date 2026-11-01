import { z } from 'zod';

// Request schema for /api/recommendations
export const recommendationRequestSchema = z.object({
  body: z.object({
    query: z.string().min(1, 'Query cannot be empty').max(1000, 'Query too long'),
    filters: z.object({
      genres: z.array(z.string()).optional(),
      excludedGenres: z.array(z.string()).optional(),
      minYear: z.number().int().min(1900).max(2030).optional().nullable(),
      maxYear: z.number().int().min(1900).max(2030).optional().nullable(),
      excludeWatched: z.boolean().optional()
    }).optional().nullable(),
    negativeGenres: z.array(z.string()).optional(),
    minYear: z.number().int().min(1900).max(2030).optional().nullable(),
    maxYear: z.number().int().min(1900).max(2030).optional().nullable(),
    limit: z.number().int().min(1).max(20).default(5).optional()
  })
});

// Request schema for /api/recommendations/chat
export const chatRequestSchema = z.object({
  body: z.object({
    conversationId: z.string().nullable().optional(),
    message: z.string().min(1, 'Message cannot be empty').max(1000, 'Message too long'),
    limit: z.number().int().min(1).max(20).optional().default(5),
    filters: z.object({
      genres: z.array(z.string()).optional(),
      excludedGenres: z.array(z.string()).optional(),
      minYear: z.number().int().optional().nullable(),
      maxYear: z.number().int().optional().nullable()
    }).optional().nullable()
  })
});

// Zod schema for validating Gemini LLM structured output
export const geminiRecommendationOutputSchema = z.object({
  summary: z.string().min(1),
  recommendations: z.array(
    z.object({
      movieId: z.string().min(1),
      reason: z.string().min(1),
      matchedThemes: z.array(z.string()).default([]),
      graphEvidence: z.array(z.string()).default([]),
      confidence: z.enum(['high', 'medium', 'low']).default('high')
    })
  ).min(1)
});
