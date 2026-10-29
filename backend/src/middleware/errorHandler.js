import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';

export function errorHandler(err, req, res, next) {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, error.errors || [], false);
  }

  const response = {
    success: false,
    statusCode: error.statusCode,
    message: error.message,
    errors: error.errors || [],
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  };

  logger.error(`[${req.method}] ${req.originalUrl} - ${error.statusCode}: ${error.message}`);

  res.status(error.statusCode).json(response);
}
