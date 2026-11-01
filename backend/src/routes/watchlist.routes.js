import { Router } from 'express';
import { getWatchlist, addToWatchlist, removeFromWatchlist } from '../controllers/watchlist.controller.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

router.use(authenticate); // Protected routes

router.get('/', getWatchlist);
router.post('/:movieId', addToWatchlist);
router.delete('/:movieId', removeFromWatchlist);

export default router;
