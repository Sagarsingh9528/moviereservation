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