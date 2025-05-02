import express from 'express';
import { 
  addCreditSale,
  getCreditSales,
  updateCreditPayment,
  getOverdueCreditSales
} from '../controllers/creditController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, addCreditSale);
router.get('/', protect, getCreditSales);
router.get('/overdue', protect, getOverdueCreditSales);
router.put('/:id/payment', protect, updateCreditPayment);

export default router;