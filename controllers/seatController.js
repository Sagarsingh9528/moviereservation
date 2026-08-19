import {
  getSeatsByShowId as getSeatsByShowIdService,
  holdSeats as holdSeatsService,
  bookSeats as bookSeatsService,
} from "../services/seatService.js";

export const getSeatsByShowId = async (req, res, next) => {
  try {
    const { showId } = req.params;

    const seats = await getSeatsByShowIdService(showId);

    res.status(200).json({
      success: true,
      seats,
    });
  } catch (error) {
    next(error);
  }
};

export const holdSeats = async (req, res, next) => {
  try {
    const { showId } = req.params;
    const { seatIds } = req.body;

    if (!Array.isArray(seatIds) || seatIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "seatIds must be a non-empty array",
      });
    }

    const result = await holdSeatsService(showId, seatIds);

    res.status(200).json({
      success: true,
      message: "Seats held successfully",
      seats: result,
    });
  } catch (error) {
    next(error);
  }
};

export const bookSeats = async (req, res, next) => {
  try {
    const { showId } = req.params;
    const { seatIds } = req.body;

    if (!Array.isArray(seatIds) || seatIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "seatIds must be a non-empty array",
      });
    }

    const result = await bookSeatsService(showId, seatIds);

    res.status(200).json({
      success: true,
      message: "Seats booked successfully",
      seats: result,
    });
  } catch (error) {
    if (
      error.message.includes("invalid") ||
      error.message.includes("no longer held") ||
      error.message.includes("expired")
    ) {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    next(error);
  }
};