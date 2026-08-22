import db from "../config/db.js";
import { createTicket } from "./ticketService.js";
import { randomUUID, createHmac } from "crypto";
import razorpay from "../config/razorpay.js";

export const createPayment = async (orderId, userId) => {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    
    const orderResult = await client.query(
      `
      SELECT *
      FROM orders
      WHERE id = $1
        AND user_id = $2
      FOR UPDATE
      `,
      [orderId, userId]
    );

    if (orderResult.rows.length === 0) {
      throw new Error("Order not found");
    }

    const order = orderResult.rows[0];

    
    if (order.status !== "PENDING") {
      throw new Error("Order is not pending");
    }

    
    if (
      order.expires_at &&
      new Date(order.expires_at) <= new Date()
    ) {
      throw new Error("Order has expired");
    }

    
    const itemsResult = await client.query(
      `
      SELECT show_seat_id
      FROM order_items
      WHERE order_id = $1
      `,
      [orderId]
    );

    if (itemsResult.rows.length === 0) {
      throw new Error("No seats found for this order");
    }

    const showSeatIds = itemsResult.rows.map(
      (item) => item.show_seat_id
    );

   
    const seatsResult = await client.query(
      `
      SELECT id, status, held_until
      FROM show_seats
      WHERE id = ANY($1::uuid[])
      FOR UPDATE
      `,
      [showSeatIds]
    );

    if (seatsResult.rows.length !== showSeatIds.length) {
      throw new Error("One or more seats are invalid");
    }

    
    const invalidSeats = seatsResult.rows.filter(
      (seat) =>
        seat.status !== "HELD" ||
        !seat.held_until ||
        new Date(seat.held_until) <= new Date()
    );

    if (invalidSeats.length > 0) {
      throw new Error(
        "One or more seats are no longer held or hold has expired"
      );
    }

    
    const paymentId = randomUUID();

    const paymentResult = await client.query(
  `
  INSERT INTO payments (
    order_id,
    amount,
    payment_method,
    transaction_id,
    status
  )
  VALUES ($1, $2, $3, $4, 'SUCCESS')
  RETURNING *
  `,
  [
    orderId,
    order.total_amount,
    "MOCK",
    paymentId,
    
  ]
);

    
    const updatedOrder = await client.query(
      `
      UPDATE orders
      SET status = 'PAID'
      WHERE id = $1
      RETURNING *
      `,
      [orderId]
    );

    
    await client.query(
      `
      UPDATE show_seats
      SET
        status = 'BOOKED',
        held_until = NULL
      WHERE id = ANY($1::uuid[])
      `,
      [showSeatIds]
    );

   await client.query("COMMIT");


const ticket = await createTicket(orderId, userId);

return {
   paymentId,
  payment: paymentResult.rows[0],
  order: updatedOrder.rows[0],
  showSeatIds,
  paymentStatus: "SUCCESS",
  ticket,
};

  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};


export const createRazorpayOrder = async (orderId, userId) => {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    
    const orderResult = await client.query(
      `
      SELECT
        id,
        user_id,
        total_amount,
        status,
        expires_at
      FROM orders
      WHERE id = $1
        AND user_id = $2
      FOR UPDATE
      `,
      [orderId, userId]
    );

    if (orderResult.rows.length === 0) {
      throw new Error("Order not found");
    }

    const order = orderResult.rows[0];

    
    if (order.status !== "PENDING") {
      throw new Error("Order is not pending");
    }

    
    if (
      order.expires_at &&
      new Date(order.expires_at) <= new Date()
    ) {
      throw new Error("Order has expired");
    }

    
    const amountInPaise = Math.round(
      Number(order.total_amount) * 100
    );

    
    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: order.id,
    });

   
    const paymentResult = await client.query(
      `
      INSERT INTO payments (
        order_id,
        amount,
        payment_method,
        transaction_id,
        status,
        razorpay_order_id
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
      [
        order.id,
        order.total_amount,
        "RAZORPAY",
        razorpayOrder.id,
        "PENDING",  
        razorpayOrder.id,
      ]
    );

    await client.query("COMMIT");

    return {
      orderId: order.id,
      amount: order.total_amount,
      currency: "INR",

      razorpayOrderId: razorpayOrder.id,

      razorpayKeyId: process.env.RAZORPAY_KEY_ID,

      payment: paymentResult.rows[0],
    };

  } catch (error) {
    await client.query("ROLLBACK");
    throw error;

  } finally {
    client.release();
  }
};

export const verifyRazorpayPayment = async (
  orderId,
  userId,
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature
) => {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    
    const orderResult = await client.query(
      `
      SELECT
        id,
        user_id,
        status,
        total_amount,
        expires_at
      FROM orders
      WHERE id = $1
        AND user_id = $2
      FOR UPDATE
      `,
      [orderId, userId]
    );

    if (orderResult.rows.length === 0) {
      throw new Error("Order not found");
    }

    const order = orderResult.rows[0];

    
    if (order.status !== "PENDING") {
      throw new Error("Order is not pending");
    }

    
    if (
      order.expires_at &&
      new Date(order.expires_at) <= new Date()
    ) {
      throw new Error("Order has expired");
    }

    
    const paymentResult = await client.query(
      `
      SELECT *
      FROM payments
      WHERE order_id = $1
        AND razorpay_order_id = $2
      ORDER BY created_at DESC
      LIMIT 1
      FOR UPDATE
      `,
      [orderId, razorpayOrderId]
    );

    if (paymentResult.rows.length === 0) {
      throw new Error("Razorpay payment order not found");
    }

    const payment = paymentResult.rows[0];

    
    const generatedSignature = 
      createHmac(
        "sha256",
        process.env.RAZORPAY_KEY_SECRET
      )
      .update(
        `${razorpayOrderId}|${razorpayPaymentId}`
      )
      .digest("hex");

    if (generatedSignature !== razorpaySignature) {
      throw new Error("Invalid Razorpay signature");
    }

    
    const itemsResult = await client.query(
      `
      SELECT show_seat_id
      FROM order_items
      WHERE order_id = $1
      `,
      [orderId]
    );

    if (itemsResult.rows.length === 0) {
      throw new Error("No seats found for this order");
    }

    const showSeatIds = itemsResult.rows.map(
      (item) => item.show_seat_id
    );

    
    const seatsResult = await client.query(
      `
      SELECT id, status, held_until
      FROM show_seats
      WHERE id = ANY($1::uuid[])
      FOR UPDATE
      `,
      [showSeatIds]
    );

    if (seatsResult.rows.length !== showSeatIds.length) {
      throw new Error("One or more seats are invalid");
    }

   
    const invalidSeats = seatsResult.rows.filter(
      (seat) =>
        seat.status !== "HELD" ||
        !seat.held_until ||
        new Date(seat.held_until) <= new Date()
    );

    if (invalidSeats.length > 0) {
      throw new Error(
        "One or more seats are no longer held or hold has expired"
      );
    }

     
    const updatedPayment = await client.query(
      `
      UPDATE payments
      SET
        status = 'SUCCESS',
        transaction_id = $1,
        updated_at = NOW()
      WHERE id = $2
      RETURNING *
      `,
      [
        razorpayPaymentId,
        payment.id,
      ]
    );

    
    const updatedOrder = await client.query(
      `
      UPDATE orders
      SET status = 'PAID'
      WHERE id = $1
      RETURNING *
      `,
      [orderId]
    );

    
    await client.query(
      `
      UPDATE show_seats
      SET
        status = 'BOOKED',
        held_until = NULL
      WHERE id = ANY($1::uuid[])
      `,
      [showSeatIds]
    );

    await client.query("COMMIT");

    
    const ticket = await createTicket(
      orderId,
      userId
    );

    return {
      paymentStatus: "SUCCESS",
      payment: updatedPayment.rows[0],
      order: updatedOrder.rows[0],
      showSeatIds,
      ticket,
    };

  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};