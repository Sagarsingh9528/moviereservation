import db from "../config/db.js";

export const getSeatsByShowId = async (showId) => {
  const query = `
    SELECT
      ss.id AS show_seat_id,
      ss.show_id,
      ss.seat_id,
      s.seat_row,
      s.seat_number,
      s.seat_type,
      ss.status,
      ss.held_until
    FROM show_seats ss

    JOIN seats s
      ON ss.seat_id = s.id

    WHERE ss.show_id = $1

    ORDER BY
      s.seat_row ASC,
      s.seat_number ASC;
  `;

  const values = [showId];

  const result = await db.query(query, values);

  return result.rows;
};

export const holdSeats = async (showId, seatIds) => {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `
      SELECT
        ss.id AS show_seat_id,
        ss.show_id,
        ss.seat_id,
        ss.status,
        ss.held_until
      FROM show_seats ss
      WHERE ss.show_id = $1
        AND ss.id = ANY($2::uuid[])
      FOR UPDATE
      `,
      [showId, seatIds],
    );

    if (result.rows.length !== seatIds.length) {
      throw new Error("One or more seats do not belong to this show");
    }

    const now = new Date();

    const unavailableSeats = result.rows.filter(
      (seat) =>
        seat.status === "BOOKED" ||
        (seat.status === "HELD" &&
          seat.held_until &&
          new Date(seat.held_until) > now),
    );

    if (unavailableSeats.length > 0) {
      throw new Error("One or more selected seats are not available");
    }

    const holdUntil = new Date(Date.now() + 10 * 60 * 1000);

    const updateResult = await client.query(
      `
      UPDATE show_seats
      SET
        status = 'HELD',
        held_until = $1
      WHERE show_id = $2
        AND id = ANY($3::uuid[])
      RETURNING
        id AS show_seat_id,
        show_id,
        seat_id,
        status,
        held_until
      `,
      [holdUntil, showId, seatIds],
    );

    await client.query("COMMIT");

    return updateResult.rows;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const bookSeats = async (showId, showSeatIds) => {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    
    const result = await client.query(
      `
      SELECT
        id AS show_seat_id,
        show_id,
        seat_id,
        status,
        held_until
      FROM show_seats
      WHERE show_id = $1
        AND id = ANY($2::uuid[])
      FOR UPDATE
      `,
      [showId, showSeatIds]
    );

    
    if (result.rows.length !== showSeatIds.length) {
      throw new Error(
        "One or more seats are invalid for this show"
      );
    }

    
    const invalidSeats = result.rows.filter(
      (seat) =>
        seat.status !== "HELD" ||
        !seat.held_until ||
        new Date(seat.held_until) <= new Date()
    );

    if (invalidSeats.length > 0) {
      throw new Error(
        "One or more seats are no longer held or the hold has expired"
      );
    }

    
    const updateResult = await client.query(
      `
      UPDATE show_seats
      SET
        status = 'BOOKED',
        held_until = NULL
      WHERE show_id = $1
        AND id = ANY($2::uuid[])
      RETURNING
        id AS show_seat_id,
        show_id,
        seat_id,
        status,
        held_until
      `,
      [showId, showSeatIds]
    );

    await client.query("COMMIT");

    return updateResult.rows;

  } catch (error) {
    await client.query("ROLLBACK");
    throw error;

  } finally {
    client.release();
  }
};