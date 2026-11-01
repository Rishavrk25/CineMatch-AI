import { Router } from 'express';
import { recordInteraction, getUserInteractions } from '../controllers/interaction.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { interactionSchema } from '../validators/auth.schema.js';

const router = Router();

router.use(authenticate); // Protected routes

router.post('/', validateRequest(interactionSchema), recordInteraction);
router.get('/me', getUserInteractions);

export default router;

