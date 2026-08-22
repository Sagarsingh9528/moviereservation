import {
  createTicket,
  getTicketById,
  cancelTicket,
} from "../services/ticketService.js";

export const createTicketController = async (req, res) => {
  try {
    const { orderId } = req.body;
    const userId = req.user.id;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "orderId is required",
      });
    }

    const ticket = await createTicket(orderId, userId);

    return res.status(201).json({
      success: true,
      message: "Ticket generated successfully",
      data: {
        ticket,
      },
    });

  } catch (error) {
    console.error("Create Ticket Error:", error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getTicketController = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const userId = req.user.id;

    const ticket = await getTicketById(
      ticketId,
      userId
    );

    return res.status(200).json({
      success: true,
      data: {
        ticket,
      },
    });

  } catch (error) {
    console.error("Get Ticket Error:", error);

    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

export const cancelTicketController = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const userId = req.user.id;

    const result = await cancelTicket(
      ticketId,
      userId
    );

    return res.status(200).json({
      success: true,
      message: "Ticket cancelled successfully",
      data: result,
    });

  } catch (error) {
    console.error("Cancel Ticket Error:", error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};