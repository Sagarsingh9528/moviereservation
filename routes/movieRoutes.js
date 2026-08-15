import express from 'express';
import {getMovies } from '../controllers/movieController.js';

const Movierouter = express.Router();

Movierouter.get('/', getMovies);

export default Movierouter;