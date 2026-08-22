import db from "../config/db.js";


export const createScreen = async ({
  theatre_id,
  name,
  total_seats,
  screen_type,
}) => {
  
  const theatreResult = await db.query(
    `
    SELECT id, status
    FROM theatres
    WHERE id = $1
    `,
    [theatre_id]
  );

  if (theatreResult.rows.length === 0) {
    throw new Error("Theatre not found");
  }

 
  if (theatreResult.rows[0].status !== "ACTIVE") {
    throw new Error("Cannot create screen for inactive theatre");
  }


  const existingScreen = await db.query(
    `
    SELECT id
    FROM screens
    WHERE theatre_id = $1
      AND LOWER(name) = LOWER($2)
    `,
    [theatre_id, name]
  );

  if (existingScreen.rows.length > 0) {
    throw new Error("Screen with this name already exists in this theatre");
  }

  const result = await db.query(
    `
    INSERT INTO screens (
      theatre_id,
      name,
      total_seats,
      screen_type,
      status
    )
    VALUES ($1, $2, $3, $4, 'ACTIVE')
    RETURNING *
    `,
    [theatre_id, name, total_seats, screen_type]
  );

  return result.rows[0];
};



export const getAllScreens = async () => {
  const result = await db.query(
    `
    SELECT
      s.id,
      s.theatre_id,
      t.name AS theatre_name,
      s.name,
      s.total_seats,
      s.screen_type,
      s.status,
      s.created_at,
      s.updated_at
    FROM screens s
    JOIN theatres t
      ON s.theatre_id = t.id
    ORDER BY s.created_at DESC
    `
  );

  return result.rows;
};



export const getScreenById = async (id) => {
  const result = await db.query(
    `
    SELECT
      s.id,
      s.theatre_id,
      t.name AS theatre_name,
      s.name,
      s.total_seats,
      s.screen_type,
      s.status,
      s.created_at,
      s.updated_at
    FROM screens s
    JOIN theatres t
      ON s.theatre_id = t.id
    WHERE s.id = $1
    `,
    [id]
  );

  if (result.rows.length === 0) {
    throw new Error("Screen not found");
  }

  return result.rows[0];
};




export const updateScreen = async (
  id,
  { theatre_id, name, total_seats, screen_type }
) => {
  
  const screenResult = await db.query(
    `
    SELECT id
    FROM screens
    WHERE id = $1
    `,
    [id]
  );

  if (screenResult.rows.length === 0) {
    throw new Error("Screen not found");
  }

  
  const theatreResult = await db.query(
    `
    SELECT id, status
    FROM theatres
    WHERE id = $1
    `,
    [theatre_id]
  );

  if (theatreResult.rows.length === 0) {
    throw new Error("Theatre not found");
  }

  if (theatreResult.rows[0].status !== "ACTIVE") {
    throw new Error("Cannot assign screen to inactive theatre");
  }

  
  const duplicateResult = await db.query(
    `
    SELECT id
    FROM screens
    WHERE theatre_id = $1
      AND LOWER(name) = LOWER($2)
      AND id != $3
    `,
    [theatre_id, name, id]
  );

  if (duplicateResult.rows.length > 0) {
    throw new Error("Screen with this name already exists in this theatre");
  }

  const result = await db.query(
    `
    UPDATE screens
    SET
      theatre_id = $1,
      name = $2,
      total_seats = $3,
      screen_type = $4,
      updated_at = NOW()
    WHERE id = $5
    RETURNING *
    `,
    [
      theatre_id,
      name,
      total_seats,
      screen_type,
      id,
    ]
  );

  return result.rows[0];
};




export const deleteScreen = async (id) => {
  // Check screen exists
  const screenResult = await db.query(
    `
    SELECT id
    FROM screens
    WHERE id = $1
    `,
    [id]
  );

  if (screenResult.rows.length === 0) {
    throw new Error("Screen not found");
  }

  // Delete screen
  const result = await db.query(
    `
    DELETE FROM screens
    WHERE id = $1
    RETURNING id, name
    `,
    [id]
  );

  return result.rows[0];
};




export const updateScreenStatus = async (id, status) => {
  if (!["ACTIVE", "INACTIVE"].includes(status)) {
    throw new Error("Invalid screen status");
  }

  const result = await db.query(
    `
    UPDATE screens
    SET
      status = $1,
      updated_at = NOW()
    WHERE id = $2
    RETURNING *
    `,
    [status, id]
  );

  if (result.rows.length === 0) {
    throw new Error("Screen not found");
  }

  return result.rows[0];
};

/* =========================
   CREATE SHOW
========================= */

export const createShow = async (data) => {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const {
      movie_id,
      screen_id,
      show_date,
      start_time,
      end_time,
      price,
    } = data;

    // 1. Check movie
    const movieResult = await client.query(
      `
      SELECT id
      FROM movies
      WHERE id = $1
        AND status = 'ACTIVE'
      `,
      [movie_id]
    );

    if (movieResult.rows.length === 0) {
      throw new Error("Movie not found or inactive");
    }

    // 2. Check screen
    const screenResult = await client.query(
      `
      SELECT id, theatre_id
      FROM screens
      WHERE id = $1
        AND status = 'ACTIVE'
      `,
      [screen_id]
    );

    if (screenResult.rows.length === 0) {
      throw new Error("Screen not found or inactive");
    }

    // 3. Check duplicate / overlapping show
    const existingShow = await client.query(
      `
      SELECT id
      FROM shows
      WHERE screen_id = $1
        AND show_date = $2
        AND start_time < $4
        AND end_time > $3
      `,
      [
        screen_id,
        show_date,
        start_time,
        end_time,
      ]
    );

    if (existingShow.rows.length > 0) {
      throw new Error(
        "Another show is already scheduled on this screen at this time"
      );
    }

    // 4. Create show
    const showResult = await client.query(
      `
      INSERT INTO shows
      (
        movie_id,
        screen_id,
        show_date,
        start_time,
        end_time,
        price,
        status
      )
      VALUES
      ($1, $2, $3, $4, $5, $6, 'SCHEDULED')
      RETURNING *
      `,
      [
        movie_id,
        screen_id,
        show_date,
        start_time,
        end_time,
        price,
      ]
    );

    const show = showResult.rows[0];

    // 5. Get all seats of selected screen
    const seatsResult = await client.query(
      `
      SELECT id
      FROM seats
      WHERE screen_id = $1
      `,
      [screen_id]
    );

    if (seatsResult.rows.length === 0) {
      throw new Error("No seats found for this screen");
    }

    // 6. Create show_seats
    for (const seat of seatsResult.rows) {
      await client.query(
        `
        INSERT INTO show_seats
        (
          show_id,
          seat_id,
          status
        )
        VALUES
        ($1, $2, 'AVAILABLE')
        `,
        [show.id, seat.id]
      );
    }

    await client.query("COMMIT");

    return show;

  } catch (error) {
    await client.query("ROLLBACK");
    throw error;

  } finally {
    client.release();
  }
};


/* =========================
   GET ALL SHOWS
========================= */

export const getAllShows = async () => {
  const result = await db.query(
    `
    SELECT
      sh.id,
      sh.movie_id,
      m.title AS movie_title,

      sh.screen_id,
      s.name AS screen_name,

      t.id AS theatre_id,
      t.name AS theatre_name,

      sh.show_date,
      sh.start_time,
      sh.end_time,
      sh.price,
      sh.status,
      sh.created_at,
      sh.updated_at

    FROM shows sh

    JOIN movies m
      ON sh.movie_id = m.id

    JOIN screens s
      ON sh.screen_id = s.id

    JOIN theatres t
      ON s.theatre_id = t.id

    ORDER BY
      sh.show_date DESC,
      sh.start_time ASC
    `
  );

  return result.rows;
};


/* =========================
   GET SHOW BY ID
========================= */

export const getShowById = async (id) => {
  const result = await db.query(
    `
    SELECT
      sh.id,
      sh.movie_id,
      m.title AS movie_title,

      sh.screen_id,
      s.name AS screen_name,

      t.id AS theatre_id,
      t.name AS theatre_name,

      sh.show_date,
      sh.start_time,
      sh.end_time,
      sh.price,
      sh.status,
      sh.created_at,
      sh.updated_at

    FROM shows sh

    JOIN movies m
      ON sh.movie_id = m.id

    JOIN screens s
      ON sh.screen_id = s.id

    JOIN theatres t
      ON s.theatre_id = t.id

    WHERE sh.id = $1
    `,
    [id]
  );

  if (result.rows.length === 0) {
    throw new Error("Show not found");
  }

  return result.rows[0];
};


/* =========================
   UPDATE SHOW
========================= */

export const updateShow = async (id, data) => {
  const {
    show_date,
    start_time,
    end_time,
    price,
  } = data;

  const result = await db.query(
    `
    UPDATE shows
    SET
      show_date = COALESCE($1, show_date),
      start_time = COALESCE($2, start_time),
      end_time = COALESCE($3, end_time),
      price = COALESCE($4, price),
      updated_at = NOW()

    WHERE id = $5

    RETURNING *
    `,
    [
      show_date,
      start_time,
      end_time,
      price,
      id,
    ]
  );

  if (result.rows.length === 0) {
    throw new Error("Show not found");
  }

  return result.rows[0];
};


/* =========================
   UPDATE SHOW STATUS
========================= */

export const updateShowStatus = async (id, status) => {
  const allowedStatuses = [
    "SCHEDULED",
    "CANCELLED",
    "COMPLETED",
  ];

  if (!allowedStatuses.includes(status)) {
    throw new Error("Invalid show status");
  }

  const result = await db.query(
    `
    UPDATE shows
    SET
      status = $1,
      updated_at = NOW()

    WHERE id = $2

    RETURNING *
    `,
    [status, id]
  );

  if (result.rows.length === 0) {
    throw new Error("Show not found");
  }

  return result.rows[0];
};


/* =========================
   DELETE SHOW
========================= */

export const deleteShow = async (id) => {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    // Delete show seats first
    await client.query(
      `
      DELETE FROM show_seats
      WHERE show_id = $1
      `,
      [id]
    );

    // Delete show
    const result = await client.query(
      `
      DELETE FROM shows
      WHERE id = $1
      RETURNING id
      `,
      [id]
    );

    if (result.rows.length === 0) {
      throw new Error("Show not found");
    }

    await client.query("COMMIT");

    return result.rows[0];

  } catch (error) {
    await client.query("ROLLBACK");
    throw error;

  } finally {
    client.release();
  }
};