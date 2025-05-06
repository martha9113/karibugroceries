import express from 'express';
import { 
  addProduce, 
  getAllProduce, 
  getProduceById,
  updateProduceStock,
  updateProducePrice,
  getLowStockAlerts,
  deleteProduce
} from '../controllers/produceController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, authorize('manager', 'director'), addProduce);
router.get('/', protect, getAllProduce);
router.get('/alerts/low-stock', protect, authorize('manager', 'director'), getLowStockAlerts);
router.get('/:id', protect, getProduceById);
router.put('/:id/stock', protect, authorize('manager', 'director'), updateProduceStock);
router.put('/:id/price', protect, authorize('manager', 'director'), updateProducePrice);
router.delete('/:id', protect, authorize('director'), deleteProduce);

export default router;