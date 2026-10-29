import { ApiError } from '../utils/ApiError.js';

export const validateRequest = (schema) => (req, res, next) => {
  try {
    const validated = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params
    });
    
    // Assign validated values back
    if (validated.body) req.body = validated.body;
    if (validated.query) req.query = validated.query;
    if (validated.params) req.params = validated.params;
    
    next();
  } catch (err) {
    if (err.errors) {
      const details = err.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message
      }));
      return next(ApiError.badRequest('Request validation failed', details));
    }
    next(err);
  }
};
