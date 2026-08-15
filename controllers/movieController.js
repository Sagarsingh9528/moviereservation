import { browseMovies } from "../services/movieService.js";

export const getMovies = async (req, res) => {
  try {
    const { search } = req.query;
    // console.log("CONTROLLER SEARCH:", search);

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