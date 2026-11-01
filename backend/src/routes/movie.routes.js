import { Router } from 'express';
import { listMovies, getMovie, searchMovies, getSimilarMovies } from '../controllers/movie.controller.js';

const router = Router();

router.get('/', listMovies);
router.get('/search', searchMovies);
router.get('/:id', getMovie);
router.get('/:id/similar', getSimilarMovies);

export default router;

