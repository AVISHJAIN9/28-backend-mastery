/**
 * Module 04: Testcontainers - Controller
 * Database operations for real DB testing
 */

let pool;  // Database connection pool

const setPool = (dbPool) => {
  pool = dbPool;
};

// ============ USER CRUD ============

const createUser = async (name, email) => {
  const result = await pool.query(
    'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
    [name, email]
  );
  return result.rows[0];
};

const getUserById = async (id) => {
  const result = await pool.query(
    'SELECT * FROM users WHERE id = $1',
    [id]
  );
  if (result.rows.length === 0) throw new Error('User not found');
  return result.rows[0];
};

const getAllUsers = async () => {
  const result = await pool.query('SELECT * FROM users');
  return result.rows;
};

const updateUser = async (id, name, email) => {
  const result = await pool.query(
    'UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING *',
    [name, email, id]
  );
  return result.rows[0];
};

const deleteUser = async (id) => {
  await pool.query('DELETE FROM users WHERE id = $1', [id]);
  return { deleted: true };
};

// ============ TRANSACTIONS ============

const transferData = async (fromId, toId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const from = await client.query('SELECT * FROM users WHERE id = $1', [fromId]);
    const to = await client.query('SELECT * FROM users WHERE id = $1', [toId]);
    
    if (from.rows.length === 0 || to.rows.length === 0) {
      throw new Error('User not found');
    }
    
    await client.query('COMMIT');
    return { success: true };
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};

// ============ CONSTRAINTS ============

const userCount = async () => {
  const result = await pool.query('SELECT COUNT(*) FROM users');
  return parseInt(result.rows[0].count);
};

const getUserByEmail = async (email) => {
  const result = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  return result.rows[0] || null;
};

module.exports = {
  setPool,
  createUser,
  getUserById,
  getAllUsers,
  updateUser,
  deleteUser,
  transferData,
  userCount,
  getUserByEmail
};

