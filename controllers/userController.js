import db from '../config/db.js';


export const getProfile = async (req, res) => {
  try {

    const result = await db.query(
      `SELECT id, username, email, role, created_at
       FROM users
       WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    res.status(200).json({
      user: result.rows[0],
    });

  } catch (error) {

    console.error('Get Profile Error:', error);

    res.status(500).json({
      message: 'Internal server error',
    });
  }
};


export const updateProfile = async (req, res) => {
  try {

    const { username } = req.body;

    const result = await db.query(
      `UPDATE users
       SET username = $1
       WHERE id = $2
       RETURNING id, username, email, role`,
      [username, req.user.id]
    );

    res.status(200).json({
      message: 'Profile updated successfully',
      user: result.rows[0],
    });

  } catch (error) {

    console.error('Update Profile Error:', error);

    res.status(500).json({
      message: 'Internal server error',
    });
  }
};