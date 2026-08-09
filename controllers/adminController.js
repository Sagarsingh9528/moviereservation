import db from '../config/db.js';


export const getAllUsers = async (req, res) => {
  try {

    const result = await db.query(
      `SELECT id, username, email, role, created_at
       FROM users
       ORDER BY created_at DESC`
    );

    res.status(200).json({
      users: result.rows,
    });

  } catch (error) {

    console.error('Get Users Error:', error);

    res.status(500).json({
      message: 'Internal server error',
    });
  }
};

export const deleteUser = async (req, res) => {
  try {

    const { id } = req.params;

    await db.query(
      `DELETE FROM users
       WHERE id = $1`,
      [id]
    );

    res.status(200).json({
      message: 'User deleted successfully',
    });

  } catch (error) {

    console.error('Delete User Error:', error);

    res.status(500).json({
      message: 'Internal server error',
    });
  }
};


export const changeUserRole = async (req, res) => {
  try {

    const { id } = req.params;
    const { role } = req.body;

    if (!['customer', 'admin'].includes(role)) {
      return res.status(400).json({
        message: 'Invalid role',
      });
    }

    const result = await db.query(
      `UPDATE users
       SET role = $1
       WHERE id = $2
       RETURNING id, username, email, role`,
      [role, id]
    );

    res.status(200).json({
      message: 'User role updated successfully',
      user: result.rows[0],
    });

  } catch (error) {

    console.error('Change Role Error:', error);

    res.status(500).json({
      message: 'Internal server error',
    });
  }
};