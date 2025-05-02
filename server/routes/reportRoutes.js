import express from 'express';
import { 
  getDashboardData,
  getBranchReport,
  getSalesReport
} from '../controllers/reportController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/dashboard', protect, authorize('director'), getDashboardData);
router.get('/branch', protect, authorize('manager'), getBranchReport);
router.get('/sales', protect, getSalesReport);

export default router;