import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Extracts and verifies JWT from HTTP-only cookie or Authorization header.
 * Required authentication guard.
 */
export const authenticate = asyncHandler(async (req, res, next) => {
  let token = null;

  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw ApiError.unauthorized('Authentication required. Please sign in.');
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-passwordHash');

    if (!user) {
      throw ApiError.unauthorized('User session invalid or user no longer exists');
    }

    req.user = user;
    next();
  } catch (err) {
    throw ApiError.unauthorized('Invalid or expired authentication token');
  }
});

/**
 * Optional authentication middleware for guest requests (identifies user if token is present).
 */
export const optionalAuthenticate = asyncHandler(async (req, res, next) => {
  let token = null;

  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-passwordHash');
      if (user) {
        req.user = user;
      }
    } catch {
      // Ignore invalid token for optional auth
    }
  }

  next();
});

/**
 * Generates JWT token and signs cookie.
 */
export function sendTokenResponse(user, statusCode, res) {
  const token = jwt.sign({ id: user._id, email: user.email }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN || '7d'
  });

  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: env.isProduction,
    sameSite: env.isProduction ? 'strict' : 'lax'
  };

  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        favoriteGenres: user.favoriteGenres || [],
        favoriteMovieIds: user.favoriteMovieIds || [],
        preferredLanguages: user.preferredLanguages || ['en']
      }
    });
}
