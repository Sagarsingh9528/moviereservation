import express from "express";

import {
  getSeatsByShowId,
  holdSeats,
  bookSeats,
} from "../controllers/seatController.js";

const router = express.Router();

router.get(
  "/show/:showId",
  getSeatsByShowId
);

router.post(
  "/show/:showId/hold",
  holdSeats
);

router.post(
  "/show/:showId/book",
  bookSeats
);

export default router;