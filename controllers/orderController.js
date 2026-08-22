import { createOrder } from "../services/orderService.js";

export const createOrderController = async (req, res) => {
  try {
    const userId = req.user.id;

    const { showId, showSeatIds } = req.body;

    if (!showId || !showSeatIds?.length) {
      return res.status(400).json({
        success: false,
        message: "showId and showSeatIds are required",
      });
    }

    const result = await createOrder(
      userId,
      showId,
      showSeatIds
    );

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: result,
    });
  } catch (error) {
    console.error("Create Order Error:", error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};