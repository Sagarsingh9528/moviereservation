import db from '../config/db.js';
import {
  getAllMoviesForAdmin,
  createMovie as createMovieService,
  updateMovie as updateMovieService,
  deleteMovie as deleteMovieService,
  updateMovieStatus as updateMovieStatusService,
  createTheatre as createTheatreService,
  getAllTheatres as getAllTheatresService,
  getTheatreById as getTheatreByIdService,
  updateTheatre as updateTheatreService,
  updateTheatreStatus as updateTheatreStatusService,
  
} from "../services/adminService.js";


export const getAllUsers = async (req, res) => {
  try {

    const result = await db.query(
      `SELECT id, username, email, role, created_at
       FROM users
       ORDER BY created_at DESC`
    );

    res.status(200).json({
      users: result.rows,
    });

  } catch (error) {

    console.error('Get Users Error:', error);

    res.status(500).json({
      message: 'Internal server error',
    });
  }
};

export const deleteUser = async (req, res) => {
  try {

    const { id } = req.params;

    await db.query(
      `DELETE FROM users
       WHERE id = $1`,
      [id]
    );

    res.status(200).json({
      message: 'User deleted successfully',
    });

  } catch (error) {

    console.error('Delete User Error:', error);

    res.status(500).json({
      message: 'Internal server error',
    });
  }
};


export const changeUserRole = async (req, res) => {
  try {

    const { id } = req.params;
    const { role } = req.body;

    if (!['customer', 'admin'].includes(role)) {
      return res.status(400).json({
        message: 'Invalid role',
      });
    }

    const result = await db.query(
      `UPDATE users
       SET role = $1
       WHERE id = $2
       RETURNING id, username, email, role`,
      [role, id]
    );

    res.status(200).json({
      message: 'User role updated successfully',
      user: result.rows[0],
    });

  } catch (error) {

    console.error('Change Role Error:', error);

    res.status(500).json({
      message: 'Internal server error',
    });
  }
};

export const getAllMovies = async (req, res, next) => {
  try {
    const movies = await getAllMoviesForAdmin();

    res.status(200).json({
      success: true,
      count: movies.length,
      movies,
    });
  } catch (error) {
    next(error);
  }
};


export const createMovie = async (req, res, next) => {
  try {
    const movie = await createMovieService(req.body);

    res.status(201).json({
      success: true,
      message: "Movie created successfully",
      movie,
    });
  } catch (error) {

     if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Movie slug already exists",
      });
    }

    next(error);
  }
};


export const updateMovie = async (req, res, next) => {
  try {
    const { movieId } = req.params;

    const movie = await updateMovieService(
      movieId,
      req.body
    );

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: "Movie not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Movie updated successfully",
      movie,
    });
  } catch (error) {
    next(error);
  }
};


export const deleteMovie = async (req, res, next) => {
  try {
    const { movieId } = req.params;

    const movie = await deleteMovieService(movieId);

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: "Movie not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Movie deleted successfully",
      movie,
    });
  } catch (error) {
    next(error);
  }
};

export const updateMovieStatus = async (req, res, next) => {
  try {
    const { movieId } = req.params;
    const { status } = req.body;

    if (!["ACTIVE", "INACTIVE"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be ACTIVE or INACTIVE",
      });
    }

    const movie = await updateMovieStatusService(
      movieId,
      status
    );

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: "Movie not found",
      });
    }

    res.status(200).json({
      success: true,
      message: `Movie ${status.toLowerCase()} successfully`,
      movie,
    });
  } catch (error) {
    next(error);
  }
};



export const createTheatre = async (req, res, next) => {
  try {
    const {
      name,
      address,
      city,
      state,
      postalCode,
      latitude,
      longitude,
    } = req.body;

    if (!name || !address || !city || !state || !postalCode) {
      return res.status(400).json({
        success: false,
        message:
          "name, address, city, state and postalCode are required",
      });
    }

    const theatre = await createTheatreService({
      name,
      address,
      city,
      state,
      postalCode,
      latitude,
      longitude,
    });

    res.status(201).json({
      success: true,
      message: "Theatre created successfully",
      theatre,
    });
  } catch (error) {
    next(error);
  }
};



export const getAllTheatres = async (req, res, next) => {
  try {
    const theatres = await getAllTheatresService();

    res.status(200).json({
      success: true,
      theatres,
    });
  } catch (error) {
    next(error);
  }
};



export const getTheatreById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const theatre = await getTheatreByIdService(id);

    if (!theatre) {
      return res.status(404).json({
        success: false,
        message: "Theatre not found",
      });
    }

    res.status(200).json({
      success: true,
      theatre,
    });
  } catch (error) {
    next(error);
  }
};



export const updateTheatre = async (req, res, next) => {
  try {
    const { id } = req.params;

    const {
      name,
      address,
      city,
      state,
      postalCode,
      latitude,
      longitude,
    } = req.body;

    if (!name || !address || !city || !state || !postalCode) {
      return res.status(400).json({
        success: false,
        message:
          "name, address, city, state and postalCode are required",
      });
    }

    const theatre = await updateTheatreService(id, {
      name,
      address,
      city,
      state,
      postalCode,
      latitude,
      longitude,
    });

    if (!theatre) {
      return res.status(404).json({
        success: false,
        message: "Theatre not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Theatre updated successfully",
      theatre,
    });
  } catch (error) {
    next(error);
  }
};



export const updateTheatreStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["ACTIVE", "INACTIVE"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be ACTIVE or INACTIVE",
      });
    }

    const theatre = await updateTheatreStatusService(id, status);

    if (!theatre) {
      return res.status(404).json({
        success: false,
        message: "Theatre not found",
      });
    }

    res.status(200).json({
      success: true,
      message: `Theatre ${status.toLowerCase()} successfully`,
      theatre,
    });
  } catch (error) {
    next(error);
  }
};