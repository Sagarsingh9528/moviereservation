import db from "../config/db.js";

export const createOrder = async (userId, showId, showSeatIds) => {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    
    const showResult = await client.query(
      `
      SELECT
        id,
        price,
        status,
        show_date,
        start_time,
        end_time
      FROM shows
      WHERE id = $1
      FOR UPDATE
      `,
      [showId]
    );

    if (showResult.rows.length === 0) {
      throw new Error("Show not found");
    }

    const show = showResult.rows[0];

    if (show.status !== "SCHEDULED") {
      throw new Error("Show is not available");
    }

    
    if (!showSeatIds || showSeatIds.length === 0) {
      throw new Error("No seats selected");
    }

    const seatResult = await client.query(
      `
      SELECT
        ss.id AS show_seat_id,
        ss.show_id,
        ss.seat_id,
        ss.status,
        ss.held_until,
        s.seat_row,
        s.seat_number,
        s.seat_type
      FROM show_seats ss
      JOIN seats s
        ON s.id = ss.seat_id
      WHERE ss.show_id = $1
        AND ss.id = ANY($2::uuid[])
      FOR UPDATE
      `,
      [showId, showSeatIds]
    );

    
    if (seatResult.rows.length !== showSeatIds.length) {
      throw new Error("One or more seats are invalid for this show");
    }

   
    const now = new Date();

    const invalidSeats = seatResult.rows.filter(
      (seat) =>
        seat.status !== "HELD" ||
        !seat.held_until ||
        new Date(seat.held_until) <= now
    );

    if (invalidSeats.length > 0) {
      throw new Error(
        "One or more seats are not held or their hold has expired"
      );
    }

    
    const ticketPrice = Number(show.price);
    const seatCount = showSeatIds.length;

    const ticketAmount = ticketPrice * seatCount;

    
    const taxAmount = Number((ticketAmount * 0.18).toFixed(2));

    
    const foodAmount = 0;

    
    const totalAmount = Number(
      (ticketAmount + taxAmount + foodAmount).toFixed(2)
    );

    
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    
    const orderResult = await client.query(
      `
      INSERT INTO orders (
        user_id,
        show_id,
        ticket_amount,
        tax_amount,
        food_amount,
        total_amount,
        status,
        expires_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', $7)
      RETURNING *
      `,
      [
        userId,
        showId,
        ticketAmount,
        taxAmount,
        foodAmount,
        totalAmount,
        expiresAt,
      ]
    );

    const order = orderResult.rows[0];

    
    for (const seat of seatResult.rows) {
      await client.query(
        `
        INSERT INTO order_items (
          order_id,
          show_seat_id,
          price
        )
        VALUES ($1, $2, $3)
        `,
        [
          order.id,
          seat.show_seat_id,
          ticketPrice,
        ]
      );
    }

    await client.query("COMMIT");

    return {
      order,
      seats: seatResult.rows,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};