import nodemailer from "nodemailer";
import PDFDocument from "pdfkit";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});


export const sendResetPasswordEmail = async (email, token) => {
  const resetLink =
    `${process.env.FRONTEND_URL}/reset-password/${token}`;

  await transporter.sendMail({
    from: `"Movie Reservation" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Reset Your Password",

    html: `
      <h2>Password Reset</h2>

      <p>You requested to reset your password.</p>

      <p>Click the button below to create a new password.</p>

      <a href="${resetLink}"
        style="
          display: inline-block;
          padding: 10px 20px;
          background: #000;
          color: white;
          text-decoration: none;
          border-radius: 5px;
        ">
        Reset Password
      </a>

      <p>This link will expire in 15 minutes.</p>

      <p>If you didn't request this, ignore this email.</p>
    `,
  });
};




const generateTicketPDF = ({
  movieTitle,
  ticketNumber,
  orderId,
  seats,
  amount,
  showDate,
  startTime,
  endTime,
}) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 50,
      });

      const chunks = [];

      doc.on("data", (chunk) => {
        chunks.push(chunk);
      });

      doc.on("end", () => {
        resolve(Buffer.concat(chunks));
      });

      doc.on("error", reject);

      // PDF CONTENT

      doc
        .fontSize(24)
        .text("MOVIE TICKET", {
          align: "center",
        });

      doc.moveDown();

      doc
        .fontSize(20)
        .text("BOOKING CONFIRMED", {
          align: "center",
        });

      doc.moveDown(2);

      doc.fontSize(14);

      doc.text(`Movie: ${movieTitle}`);

      doc.moveDown();

      doc.text(`Ticket Number: ${ticketNumber}`);

      doc.text(`Booking ID: ${orderId}`);

      doc.moveDown();

      doc.text(`Seats: ${seats.join(", ")}`);

      doc.moveDown();

      doc.text(`Show Date: ${showDate}`);

      doc.text(`Start Time: ${startTime}`);

      doc.text(`End Time: ${endTime}`);

      doc.moveDown();

      doc.text(`Amount Paid: INR ${amount}`);

      doc.moveDown(2);

      doc
        .fontSize(16)
        .text("STATUS: CONFIRMED", {
          align: "center",
        });

      doc.moveDown(3);

      doc
        .fontSize(12)
        .text(
          "Please show this ticket at the cinema.",
          {
            align: "center",
          }
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};




export const sendBookingConfirmationEmail = async ({
  email,
  movieTitle,
  ticketNumber,
  orderId,
  seats,
  amount,
  showDate,
  startTime,
  endTime,
}) => {

  const pdfBuffer = await generateTicketPDF({
    movieTitle,
    ticketNumber,
    orderId,
    seats,
    amount,
    showDate,
    startTime,
    endTime,
  });

  await transporter.sendMail({
    from: `"Movie Reservation" <${process.env.EMAIL_USER}>`,

    to: email,

    subject: `Booking Confirmed - ${movieTitle}`,

    html: `
      <div style="
        font-family: Arial, sans-serif;
        max-width: 600px;
        margin: auto;
        padding: 20px;
      ">

        <h2 style="text-align: center;">
          Booking Confirmed
        </h2>

        <p>
          Your movie booking has been successfully confirmed.
        </p>

        <hr />

        <h3>${movieTitle}</h3>

        <p>
          <strong>Ticket Number:</strong>
          ${ticketNumber}
        </p>

        <p>
          <strong>Booking ID:</strong>
          ${orderId}
        </p>

        <p>
          <strong>Seats:</strong>
          ${seats.join(", ")}
        </p>

        <p>
          <strong>Show Date:</strong>
          ${showDate}
        </p>

        <p>
          <strong>Show Time:</strong>
          ${startTime} - ${endTime}
        </p>

        <p>
          <strong>Amount Paid:</strong>
          INR ${amount}
        </p>

        <p>
          <strong>Status:</strong>
          <span style="color: green;">
            CONFIRMED
          </span>
        </p>

        <hr />

        <p>
          Your movie ticket is attached to this email as a PDF.
        </p>

        <p>
          Please keep this email and ticket for your records.
        </p>

        <p>
          Thank you for booking with us!
        </p>

      </div>
    `,

    attachments: [
      {
        filename: `Movie-Ticket-${ticketNumber}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });
};