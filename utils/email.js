import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export const sendResetPasswordEmail = async (
  email,
  token
) => {

  const resetLink =
    `${process.env.FRONTEND_URL}/reset-password/${token}`;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,

    to: email,

    subject: 'Reset Your Password',

    html: `
      <h2>Password Reset</h2>

      <p>You requested to reset your password.</p>

      <p>
        Click the button below to create a new password.
      </p>

      <a href="${resetLink}"
         style="
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