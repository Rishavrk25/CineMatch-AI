import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    email: z.string().email('Please provide a valid email'),
    password: z.string().min(6, 'Password must be at least 6 characters')
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Please provide a valid email'),
    password: z.string().min(1, 'Password is required')
  })
});

export const updatePreferencesSchema = z.object({
  body: z.object({
    favoriteGenres: z.array(z.string()).optional(),
    favoriteMovieIds: z.array(z.string()).optional(),
    dislikedMovieIds: z.array(z.string()).optional(),
    preferredLanguages: z.array(z.string()).optional()
  })
});

export const interactionSchema = z.object({
  body: z.object({
    movieId: z.string().min(1, 'Movie ID is required'),
    interactionType: z.enum(['view', 'like', 'dislike', 'watchlist_add', 'rate']),
    rating: z.number().min(1).max(10).optional()
  })
});

