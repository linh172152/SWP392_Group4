import { Router } from 'express';
import {
  register,
  login,
  refresh,
  logout,
  getProfile,
  updateProfile,
  changeUserPassword,
  verifyToken
} from '../controllers/auth.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);

// Protected routes
router.get('/me', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);
router.put('/change-password', authenticateToken, changeUserPassword);
router.get('/verify', authenticateToken, verifyToken);

export default router;




