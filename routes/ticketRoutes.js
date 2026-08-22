import express from "express";

import {
  createTicketController,
  getTicketController,
  cancelTicketController,
} from "../controllers/ticketController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post(
  "/",
  protect,
  createTicketController
);

router.get(
  "/:ticketId",
  protect,
  getTicketController
);

router.post(
  "/:ticketId/cancel",
  protect,
  cancelTicketController
);


export default router;