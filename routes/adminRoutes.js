import express from "express";

import {
  getAllUsers,
  deleteUser,
  changeUserRole,
  getAllMovies,
  createMovie,
  updateMovie,
  deleteMovie,
  updateMovieStatus,
  createTheatre,
  getAllTheatres,
  getTheatreById,
  updateTheatre,
  updateTheatreStatus,
} from "../controllers/adminController.js";
import {
  createScreenController,
  getAllScreensController,
  getScreenByIdController,
  updateScreenController,
  deleteScreenController,
  updateScreenStatusController,
} from "../controllers/adminScreenController.js";

import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";

const router = express.Router();

router.get("/users", protect, adminOnly, getAllUsers);

router.delete("/users/:id", protect, adminOnly, deleteUser);

router.put("/users/:id/role", protect, adminOnly, changeUserRole);

router.get("/movies", protect, adminOnly, getAllMovies);

router.post("/movies", protect, adminOnly, createMovie);

router.patch("/movies/:movieId", protect, adminOnly, updateMovie);

router.delete("/movies/:movieId", protect, adminOnly, deleteMovie);

router.patch("/movies/:movieId/status", protect, adminOnly, updateMovieStatus);

router.post("/theatres", protect, adminOnly, createTheatre);

router.get("/theatres", protect, adminOnly, getAllTheatres);

router.get("/theatres/:id", protect, adminOnly, getTheatreById);

router.put("/theatres/:id", protect, adminOnly, updateTheatre);

router.patch("/theatres/:id/status", protect, adminOnly, updateTheatreStatus);

router.post("/screens", protect, adminOnly, createScreenController);

router.get("/screens", protect, adminOnly, getAllScreensController);

router.get("/screens/:id", protect, adminOnly, getScreenByIdController);

router.put("/screens/:id", protect, adminOnly, updateScreenController);

router.delete("/screens/:id", protect, adminOnly, deleteScreenController);

router.patch("/screens/:id/status", protect, adminOnly, updateScreenStatusController);

export default router;
