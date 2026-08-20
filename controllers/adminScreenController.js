import {
  createScreen as createScreenService,
  getAllScreens as getAllScreensService,
  getScreenById as getScreenByIdService,
  updateScreen as updateScreenService,
  deleteScreen as deleteScreenService,
  updateScreenStatus as updateScreenStatusService,
} from "../services/adminScreenService.js";


export const createScreenController = async (req, res, next) => {
  try {
    const {
      theatre_id,
      name,
      total_seats,
      screen_type,
    } = req.body;

    if (
      !theatre_id ||
      !name ||
      !total_seats ||
      !screen_type
    ) {
      return res.status(400).json({
        success: false,
        message:
          "theatre_id, name, total_seats and screen_type are required",
      });
    }

    if (Number(total_seats) <= 0) {
      return res.status(400).json({
        success: false,
        message: "total_seats must be greater than 0",
      });
    }

    const screen = await createScreenService({
      theatre_id,
      name,
      total_seats: Number(total_seats),
      screen_type,
    });

    res.status(201).json({
      success: true,
      message: "Screen created successfully",
      screen,
    });
  } catch (error) {
    next(error);
  }
};



export const getAllScreensController = async (req, res, next) => {
  try {
    const screens = await getAllScreensService();

    res.status(200).json({
      success: true,
      screens,
    });
  } catch (error) {
    next(error);
  }
};



export const getScreenByIdController = async (req, res, next) => {
  try {
    const { id } = req.params;

    const screen = await getScreenByIdService(id);

    res.status(200).json({
      success: true,
      screen,
    });
  } catch (error) {
    next(error);
  }
};


export const updateScreenController = async (req, res, next) => {
  try {
    const { id } = req.params;

    const {
      theatre_id,
      name,
      total_seats,
      screen_type,
    } = req.body;

    if (
      !theatre_id ||
      !name ||
      !total_seats ||
      !screen_type
    ) {
      return res.status(400).json({
        success: false,
        message:
          "theatre_id, name, total_seats and screen_type are required",
      });
    }

    if (Number(total_seats) <= 0) {
      return res.status(400).json({
        success: false,
        message: "total_seats must be greater than 0",
      });
    }

    const screen = await updateScreenService(id, {
      theatre_id,
      name,
      total_seats: Number(total_seats),
      screen_type,
    });

    res.status(200).json({
      success: true,
      message: "Screen updated successfully",
      screen,
    });
  } catch (error) {
    next(error);
  }
};




export const deleteScreenController = async (req, res, next) => {
  try {
    const { id } = req.params;

    const screen = await deleteScreenService(id);

    res.status(200).json({
      success: true,
      message: "Screen deleted successfully",
      screen,
    });
  } catch (error) {
    next(error);
  }
};



export const updateScreenStatusController = async (
  req,
  res,
  next
) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["ACTIVE", "INACTIVE"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be ACTIVE or INACTIVE",
      });
    }

    const screen = await updateScreenStatusService(id, status);

    res.status(200).json({
      success: true,
      message: `Screen ${status.toLowerCase()} successfully`,
      screen,
    });
  } catch (error) {
    next(error);
  }
};