import mongoose from 'mongoose';

const movieInteractionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    movieId: {
      type: String,
      required: true,
      index: true
    },
    interactionType: {
      type: String,
      enum: ['view', 'like', 'dislike', 'watchlist_add', 'rate'],
      required: true
    },
    rating: {
      type: Number,
      min: 1,
      max: 10,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Compound index for fast user movie interaction lookups
movieInteractionSchema.index({ userId: 1, movieId: 1, interactionType: 1 });
movieInteractionSchema.index({ userId: 1, createdAt: -1 });

export const MovieInteraction = mongoose.model('MovieInteraction', movieInteractionSchema);

