import express from "express";
import {
  createPaymentController,
  createRazorpayOrderController,
  verifyRazorpayPaymentController,
} from "../controllers/paymentController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createPaymentController);
router.post("/razorpay/order", protect, createRazorpayOrderController);
router.post("/razorpay/verify", protect, verifyRazorpayPaymentController);

export default router;
