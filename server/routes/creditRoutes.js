import express from 'express';
import { 
  addCreditSale,
  getCreditSales,
  updateCreditPayment,
  getOverdueCreditSales,
  deleteCreditSale
} from '../controllers/creditController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, addCreditSale);
router.get('/', protect, getCreditSales);
router.get('/overdue', protect, getOverdueCreditSales);
router.put('/:id/payment', protect, updateCreditPayment);
router.delete('/:id', protect, authorize('director'), deleteCreditSale);

export default router;