import {
  browseMovies,
  getMovieById as getMovieByIdService,
  getShowsByMovieId,
} from "../services/movieService.js";

export const getMovies = async (req, res) => {
  try {
    const { search } = req.query;

    const movies = await browseMovies(search);

    return res.status(200).json({
      success: true,
      count: movies.length,
      data: movies,
    });
  } catch (error) {
    console.error("Get movies error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch movies",
    });
  }
};

export const getMovieById = async (req, res) => {
  try {
    const { id } = req.params;

    const movie = await getMovieByIdService(id);

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: "Movie not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: movie,
    });
  } catch (error) {
    console.error("Get movie details error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch movie details",
    });
  }
};

export const getMovieShows = async (req, res) => {
  try {
    const { id } = req.params;

    const shows = await getShowsByMovieId(id);

    return res.status(200).json({
      success: true,
      count: shows.length,
      data: shows,
    });

  } catch (error) {
    console.error("Get movie shows error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch movie shows",
    });
  }
};