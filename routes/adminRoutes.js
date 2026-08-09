import express from 'express';

import {
  getAllUsers,
  deleteUser,
  changeUserRole,
} from '../controllers/adminController.js';

import { protect } from '../middleware/authMiddleware.js';
import { adminOnly } from '../middleware/adminMiddleware.js';

const router = express.Router();

router.get(
  '/users',
  protect,
  adminOnly,
  getAllUsers
);

router.delete(
  '/users/:id',
  protect,
  adminOnly,
  deleteUser
);

router.put(
  '/users/:id/role',
  protect,
  adminOnly,
  changeUserRole
);

export default router;