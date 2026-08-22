import { createPayment, createRazorpayOrder, verifyRazorpayPayment, } from "../services/paymentService.js";

export const createPaymentController = async (req, res) => {
  try {
    const { orderId } = req.body;

    const userId = req.user.id;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "orderId is required",
      });
    }

    const payment = await createPayment(orderId, userId);

    return res.status(200).json({
      success: true,
      message: "Payment successful",
      data: payment,
    });

  } catch (error) {
    console.error("Create Payment Error:", error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const createRazorpayOrderController = async (req, res) => {
  try {
    const { orderId } = req.body;

    const userId = req.user.id;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "orderId is required",
      });
    }

    const result = await createRazorpayOrder(
      orderId,
      userId
    );

    return res.status(200).json({
      success: true,
      message: "Razorpay order created successfully",
      data: result,
    });

  } catch (error) {
    console.error(
      "Create Razorpay Order Error:",
      error
    );

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const verifyRazorpayPaymentController = async (req, res) => {
  try {
    const {
      orderId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = req.body;

    const userId = req.user.id;

    if (
      !orderId ||
      !razorpayOrderId ||
      !razorpayPaymentId ||
      !razorpaySignature
    ) {
      return res.status(400).json({
        success: false,
        message:
          "orderId, razorpayOrderId, razorpayPaymentId and razorpaySignature are required",
      });
    }

    const result = await verifyRazorpayPayment(
      orderId,
      userId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      data: result,
    });

  } catch (error) {
    console.error(
      "Verify Razorpay Payment Error:",
      error
    );

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};