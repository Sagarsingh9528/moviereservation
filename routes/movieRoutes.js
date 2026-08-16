import express from 'express';
import {getMovies, getMovieById, getMovieShows } from '../controllers/movieController.js';

const Movierouter = express.Router();

Movierouter.get('/', getMovies);

Movierouter.get("/:id/shows", getMovieShows);

Movierouter.get("/:id", getMovieById);

export default Movierouter;