import express from 'express';
import { 
  addSale,
  getSales,
  getSalesSummary,
  getRecentSales
} from '../controllers/salesController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, addSale);
router.get('/', protect, getSales);
router.get('/summary', protect, authorize('director'), getSalesSummary);
router.get('/recent', protect, getRecentSales);

export default router;