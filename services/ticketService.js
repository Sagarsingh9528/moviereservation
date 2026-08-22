import db from "../config/db.js";
import { sendBookingConfirmationEmail } from "../utils/email.js";

export const createTicket = async (orderId, userId) => {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    
    const orderResult = await client.query(
      `
      SELECT
        o.id,
        o.user_id,
        o.show_id,
        o.status,
        o.total_amount,

        u.email,
        u.username,

        m.title AS movie_title,

       s.show_date,
s.start_time,
s.end_time

      FROM orders o

      JOIN users u
        ON o.user_id = u.id

      JOIN shows s
        ON o.show_id = s.id

      JOIN movies m
        ON s.movie_id = m.id

      WHERE o.id = $1
        AND o.user_id = $2

      FOR UPDATE
      `,
      [orderId, userId],
    );

    if (orderResult.rows.length === 0) {
      throw new Error("Order not found");
    }

    const order = orderResult.rows[0];

    
    if (order.status !== "PAID") {
      throw new Error("Ticket can only be generated for a paid order");
    }

    
    const existingTicket = await client.query(
      `
      SELECT *
      FROM tickets
      WHERE order_id = $1
      `,
      [orderId],
    );

    if (existingTicket.rows.length > 0) {
      await client.query("COMMIT");

      return existingTicket.rows[0];
    }

    
    const seatsResult = await client.query(
      `
      SELECT
        s.seat_row,
        s.seat_number
      FROM order_items oi

      JOIN show_seats ss
        ON oi.show_seat_id = ss.id

      JOIN seats s
        ON ss.seat_id = s.id

      WHERE oi.order_id = $1

      ORDER BY s.seat_row, s.seat_number
      `,
      [orderId],
    );

    const seats = seatsResult.rows.map(
      (seat) => `${seat.seat_row}${seat.seat_number}`,
    );

    
    const ticketNumber =
      "MOV-" + Date.now() + "-" + Math.floor(1000 + Math.random() * 9000);

    
    const ticketResult = await client.query(
      `
      INSERT INTO tickets (
        order_id,
        user_id,
        show_id,
        ticket_number,
        status
      )
      VALUES ($1, $2, $3, $4, 'ACTIVE')
      RETURNING *
      `,
      [order.id, order.user_id, order.show_id, ticketNumber],
    );

    const ticket = ticketResult.rows[0];

    
    await client.query("COMMIT");

    
    await sendBookingConfirmationEmail({
      email: order.email,
      name: order.username,
      movieTitle: order.movie_title,
      ticketNumber: ticket.ticket_number,
      orderId: order.id,
      seats,
      amount: order.total_amount,
      showDate: new Date(order.start_time).toLocaleDateString("en-IN"),
      startTime: new Date(order.start_time).toLocaleTimeString("en-IN"),
      endTime: new Date(order.end_time).toLocaleTimeString("en-IN"),
    });

    return ticket;
  } catch (error) {
    await client.query("ROLLBACK");

    throw error;
  } finally {
    client.release();
  }
};

export const getTicketById = async (ticketId, userId) => {
  const query = `
    SELECT
      t.id,
      t.ticket_number,
      t.status,
      t.created_at,

      o.id AS order_id,
      o.total_amount,

      s.id AS show_id,
      s.start_time,
      s.end_time,

      m.title AS movie_title

    FROM tickets t

    JOIN orders o
      ON t.order_id = o.id

    JOIN shows s
      ON t.show_id = s.id

    JOIN movies m
      ON s.movie_id = m.id

    WHERE t.id = $1
      AND t.user_id = $2
  `;

  const result = await db.query(query, [ticketId, userId]);

  if (result.rows.length === 0) {
    throw new Error("Ticket not found");
  }

  return result.rows[0];
};

export const cancelTicket = async (ticketId, userId) => {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    
    const ticketResult = await client.query(
      `
      SELECT
        t.id,
        t.order_id,
        t.status AS ticket_status,

        o.user_id,
        o.status AS order_status,
        o.total_amount,

        s.start_time

      FROM tickets t

      JOIN orders o
        ON t.order_id = o.id

      JOIN shows s
        ON t.show_id = s.id

      WHERE t.id = $1
        AND t.user_id = $2

      FOR UPDATE
      `,
      [ticketId, userId],
    );

    if (ticketResult.rows.length === 0) {
      throw new Error("Ticket not found");
    }

    const ticket = ticketResult.rows[0];

    
    if (ticket.ticket_status === "CANCELLED") {
      throw new Error("Ticket is already cancelled");
    }

    if (ticket.ticket_status !== "ACTIVE") {
      throw new Error("Only active tickets can be cancelled");
    }

    
    const showTime = new Date(ticket.start_time);
    const currentTime = new Date();

    const minutesBeforeShow = (showTime - currentTime) / (1000 * 60);

    
    let refundPercentage = 0;

    if (minutesBeforeShow >= 120) {
      
      refundPercentage = 75;
    } else if (minutesBeforeShow >= 20) {
      
      refundPercentage = 50;
    } else {
      
      refundPercentage = 0;
    }

    
    const paymentResult = await client.query(
      `
      SELECT
        id,
        amount,
        status
      FROM payments
      WHERE order_id = $1
        AND status = 'SUCCESS'
      ORDER BY created_at DESC
      LIMIT 1
      FOR UPDATE
      `,
      [ticket.order_id],
    );

    if (paymentResult.rows.length === 0) {
      throw new Error("Successful payment not found");
    }

    const payment = paymentResult.rows[0];

    
    const refundAmount = (
      (Number(payment.amount) * refundPercentage) /
      100
    ).toFixed(2);

    
    const seatsResult = await client.query(
      `
      SELECT show_seat_id
      FROM order_items
      WHERE order_id = $1
      `,
      [ticket.order_id],
    );

    const showSeatIds = seatsResult.rows.map((item) => item.show_seat_id);

    
    await client.query(
      `
      UPDATE tickets
      SET status = 'CANCELLED'
      WHERE id = $1
      `,
      [ticketId],
    );

    
    await client.query(
      `
      UPDATE orders
      SET status = 'CANCELLED'
      WHERE id = $1
      `,
      [ticket.order_id],
    );

    
    if (showSeatIds.length > 0) {
      await client.query(
        `
        UPDATE show_seats
        SET
          status = 'AVAILABLE',
          held_until = NULL
        WHERE id = ANY($1::uuid[])
        `,
        [showSeatIds],
      );
    }

    
    let refundStatus;

    if (Number(refundAmount) > 0) {
      refundStatus = "REFUNDED";
    } else {
      refundStatus = "NO_REFUND";
    }

    await client.query(
      `
      UPDATE payments
      SET
        refund_amount = $1,
        refund_status = $2,
        refunded_at = CASE
          WHEN $1 > 0 THEN NOW()
          ELSE NULL
        END,
        updated_at = NOW()
      WHERE id = $3
      `,
      [refundAmount, refundStatus, payment.id],
    );

    
    await client.query("COMMIT");

    return {
      ticketId,
      orderId: ticket.order_id,

      showSeatIds,

      ticketStatus: "CANCELLED",
      orderStatus: "CANCELLED",

      paymentAmount: Number(payment.amount),
      refundPercentage,
      refundAmount: Number(refundAmount),
      refundStatus,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};
