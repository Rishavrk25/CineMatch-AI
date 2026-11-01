import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendTokenResponse } from '../middleware/authenticate.js';

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    throw ApiError.badRequest('An account with this email address already exists');
  }

  const passwordHash = await User.hashPassword(password);
  const user = await User.create({
    name,
    email,
    passwordHash
  });

  sendTokenResponse(user, 201, res);
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  sendTokenResponse(user, 200, res);
});

export const logout = asyncHandler(async (req, res) => {
  res
    .cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    })
    .status(200)
    .json({
      success: true,
      message: 'Logged out successfully'
    });
});

export const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      favoriteGenres: req.user.favoriteGenres || [],
      favoriteMovieIds: req.user.favoriteMovieIds || [],
      dislikedMovieIds: req.user.dislikedMovieIds || [],
      preferredLanguages: req.user.preferredLanguages || ['en']
    }
  });
});

export const updatePreferences = asyncHandler(async (req, res) => {
  const { favoriteGenres, favoriteMovieIds, dislikedMovieIds, preferredLanguages } = req.body;

  const updateFields = {};
  if (favoriteGenres !== undefined) updateFields.favoriteGenres = favoriteGenres;
  if (favoriteMovieIds !== undefined) updateFields.favoriteMovieIds = favoriteMovieIds;
  if (dislikedMovieIds !== undefined) updateFields.dislikedMovieIds = dislikedMovieIds;
  if (preferredLanguages !== undefined) updateFields.preferredLanguages = preferredLanguages;

  const updatedUser = await User.findByIdAndUpdate(req.user._id, updateFields, {
    new: true,
    runValidators: true
  }).select('-passwordHash');

  res.status(200).json({
    success: true,
    user: updatedUser
  });
});
