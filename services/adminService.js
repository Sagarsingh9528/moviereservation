import db from "../config/db.js";

export const getAllMoviesForAdmin = async () => {
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
    ORDER BY created_at DESC
  `;

  const result = await db.query(query);

  return result.rows;
};


export const createMovie = async (movieData) => {
  const {
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
  } = movieData;

  const query = `
    INSERT INTO movies (
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
    )
    VALUES (
      $1, $2, $3, $4, $5,
      $6, $7, $8, $9, $10, $11
    )
    RETURNING *;
  `;

  const values = [
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
    status || "UPCOMING",
  ];

  const result = await db.query(query, values);

  return result.rows[0];
};


export const updateMovie = async (movieId, movieData) => {
  const {
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
  } = movieData;

  const query = `
    UPDATE movies
    SET
      title = COALESCE($1, title),
      slug = COALESCE($2, slug),
      description = COALESCE($3, description),
      poster_url = COALESCE($4, poster_url),
      backdrop_url = COALESCE($5, backdrop_url),
      trailer_url = COALESCE($6, trailer_url),
      language = COALESCE($7, language),
      duration_minutes = COALESCE($8, duration_minutes),
      release_date = COALESCE($9, release_date),
      rating = COALESCE($10, rating),
      status = COALESCE($11, status),
      updated_at = NOW()
    WHERE id = $12
    RETURNING *;
  `;

  const values = [
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
    movieId,
  ];

  const result = await db.query(query, values);

  return result.rows[0];
};


export const deleteMovie = async (movieId) => {
  const query = `
    DELETE FROM movies
    WHERE id = $1
    RETURNING id, title;
  `;

  const result = await db.query(query, [movieId]);

  return result.rows[0];
};

export const updateMovieStatus = async (movieId, status) => {
  const query = `
    UPDATE movies
    SET
      status = $1,
      updated_at = NOW()
    WHERE id = $2
    RETURNING
      id,
      title,
      slug,
      status,
      updated_at;
  `;

  const result = await db.query(query, [status, movieId]);

  return result.rows[0];
};


export const createTheatre = async ({
  name,
  address,
  city,
  state,
  postalCode,
  latitude,
  longitude,
}) => {
  const query = `
    INSERT INTO theatres (
      name,
      address,
      city,
      state,
      postal_code,
      latitude,
      longitude,
      status
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIVE')
    RETURNING
      id,
      name,
      address,
      city,
      state,
      postal_code,
      latitude,
      longitude,
      status,
      created_at,
      updated_at
  `;

  const values = [
    name,
    address,
    city,
    state,
    postalCode,
    latitude ?? null,
    longitude ?? null,
  ];

  const result = await db.query(query, values);

  return result.rows[0];
};



export const getAllTheatres = async () => {
  const query = `
    SELECT
      id,
      name,
      address,
      city,
      state,
      postal_code,
      latitude,
      longitude,
      status,
      created_at,
      updated_at
    FROM theatres
    ORDER BY created_at DESC
  `;

  const result = await db.query(query);

  return result.rows;
};



export const getTheatreById = async (id) => {
  const query = `
    SELECT
      id,
      name,
      address,
      city,
      state,
      postal_code,
      latitude,
      longitude,
      status,
      created_at,
      updated_at
    FROM theatres
    WHERE id = $1
  `;

  const result = await db.query(query, [id]);

  return result.rows[0];
};



export const updateTheatre = async (
  id,
  {
    name,
    address,
    city,
    state,
    postalCode,
    latitude,
    longitude,
  }
) => {
  const query = `
    UPDATE theatres
    SET
      name = $1,
      address = $2,
      city = $3,
      state = $4,
      postal_code = $5,
      latitude = $6,
      longitude = $7,
      updated_at = NOW()
    WHERE id = $8
    RETURNING
      id,
      name,
      address,
      city,
      state,
      postal_code,
      latitude,
      longitude,
      status,
      created_at,
      updated_at
  `;

  const values = [
    name,
    address,
    city,
    state,
    postalCode,
    latitude ?? null,
    longitude ?? null,
    id,
  ];

  const result = await db.query(query, values);

  return result.rows[0];
};



export const updateTheatreStatus = async (id, status) => {
  const query = `
    UPDATE theatres
    SET
      status = $1,
      updated_at = NOW()
    WHERE id = $2
    RETURNING
      id,
      name,
      address,
      city,
      state,
      postal_code,
      latitude,
      longitude,
      status,
      created_at,
      updated_at
  `;

  const result = await db.query(query, [status, id]);

  return result.rows[0];
};