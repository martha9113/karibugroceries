import express from 'express';
import { 
  registerUser, 
  loginUser, 
  getUserProfile,
  getUsers
} from '../controllers/authController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', protect, getUserProfile);
router.get('/users', protect, authorize('director'), getUsers);

export default router;