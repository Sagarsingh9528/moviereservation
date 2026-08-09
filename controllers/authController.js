import db from '../config/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sendResetPasswordEmail } from '../utils/email.js';


export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        message: 'Username, email and password are required',
      });
    }

    
    const existingUser = await db.query(
      `SELECT id FROM users
       WHERE email = $1 OR username = $2`,
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        message: 'Username or email already exists',
      });
    }

    
    const passwordHash = await bcrypt.hash(password, 10);

    
    const result = await db.query(
      `INSERT INTO users
       (username, email, password_hash, role)
       VALUES ($1, $2, $3, 'customer')
       RETURNING id, username, email, role, created_at`,
      [username, email, passwordHash]
    );

    res.status(201).json({
      message: 'Registration successful',
      user: result.rows[0],
    });

  } catch (error) {
    console.error('Register Error:', error);

    res.status(500).json({
      message: 'Internal server error',
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required',
      });
    }

    
    const result = await db.query(
      `SELECT * FROM users WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: 'Invalid email or password',
      });
    }

    const user = result.rows[0];

    
    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: 'Invalid email or password',
      });
    }

    
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '1d',
      }
    );

    res.status(200).json({
      message: 'Login successful',

      token,

      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
    console.error('Login Error:', error);

    res.status(500).json({
      message: 'Internal server error',
    });
  }
};


export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: 'Email is required',
      });
    }

    const result = await db.query(
      `SELECT id, email FROM users WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(200).json({
        message:
          'If an account exists with this email, a reset link has been sent.',
      });
    }

    const user = result.rows[0];

    const resetToken = crypto.randomBytes(32).toString('hex');

    // Token expires in 15 minutes
    const resetTokenExpires = new Date(
      Date.now() + 15 * 60 * 1000
    );

    await db.query(
      `UPDATE users
       SET reset_password_token = $1,
           reset_password_expires = $2
       WHERE id = $3`,
      [
        resetToken,
        resetTokenExpires,
        user.id,
      ]
    );

    await sendResetPasswordEmail(
      user.email,
      resetToken
    );

    res.status(200).json({
      message:
        'If an account exists with this email, a reset link has been sent.',
    });

  } catch (error) {
    console.error('Forgot Password Error:', error);

    res.status(500).json({
      message: 'Internal server error',
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        message: 'New password is required',
      });
    }

    const result = await db.query(
      `SELECT id
       FROM users
       WHERE reset_password_token = $1
       AND reset_password_expires > NOW()`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        message: 'Invalid or expired reset token',
      });
    }

    const userId = result.rows[0].id;

    const passwordHash = await bcrypt.hash(password, 10);

    await db.query(
      `UPDATE users
       SET password_hash = $1,
           reset_password_token = NULL,
           reset_password_expires = NULL
       WHERE id = $2`,
      [passwordHash, userId]
    );

    res.status(200).json({
      message: 'Password reset successfully',
    });

  } catch (error) {
    console.error('Reset Password Error:', error);

    res.status(500).json({
      message: 'Internal server error',
    });
  }
};