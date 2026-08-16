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

  const result = await db.query(query, values);

  return result.rows;
};


export const getMovieById = async (id) => {
  const query = `
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
      status,
      created_at,
      updated_at
    FROM movies
    WHERE id = $1
  `;

  const values = [id];

  const result = await db.query(query, values);

  return result.rows[0];
};


export const getShowsByMovieId = async (movieId) => {
  const query = `
    SELECT
      s.id AS show_id,
      m.id AS movie_id,
      m.title AS movie_title,
      t.id AS theatre_id,
      t.name AS theatre_name,
      t.city,
      sc.id AS screen_id,
      sc.name AS screen_name,
      s.show_date,
      s.start_time,
      s.end_time,
      s.price,
      s.status
    FROM shows s

    JOIN movies m
      ON s.movie_id = m.id

    JOIN screens sc
      ON s.screen_id = sc.id

    JOIN theatres t
      ON sc.theatre_id = t.id

    WHERE s.movie_id = $1
      AND s.status = 'SCHEDULED'

    ORDER BY
      s.show_date ASC,
      s.start_time ASC;
  `;

  const values = [movieId];

  const result = await db.query(query, values);

  return result.rows;
};