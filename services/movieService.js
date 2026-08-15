import db from "../config/db.js";

export const browseMovies = async (search) => {
  let query = `
    SELECT
      id,
      title,
      slug,
      description,
      poster_url,
      backdrop_url,
      trailer_url,
      language,
      duration_minutes,
      release_date,
      rating,
      status
    FROM movies
  `;

  const values = [];

  if (search && search.trim() !== "") {
    query += `
      WHERE title ILIKE $1
    `;

    values.push(`%${search.trim()}%`);
  }

  query += `
    ORDER BY release_date DESC
  `;

//    console.log("SERVICE SEARCH:", search);
//   console.log("SQL QUERY:", query);
//   console.log("SQL VALUES:", values);

  const result = await db.query(query, values);

  return result.rows;
};