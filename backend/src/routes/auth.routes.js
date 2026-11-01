import { Router } from 'express';
import { register, login, logout, getMe, updatePreferences } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { registerSchema, loginSchema, updatePreferencesSchema } from '../validators/auth.schema.js';

const router = Router();

router.post('/register', authLimiter, validateRequest(registerSchema), register);
router.post('/login', authLimiter, validateRequest(loginSchema), login);
router.post('/logout', logout);
router.get('/me', authenticate, getMe);
router.patch('/preferences', authenticate, validateRequest(updatePreferencesSchema), updatePreferences);

export default router;
