import { db } from "../../db/pool.js";

export const authRepository = {
  async findByEmail(email: string) {
    const result = await db.query("SELECT * FROM users WHERE email = $1", [email]);
    return result.rows[0] || null;
  },

  async create(data: {
    email: string;
    passwordHash: string;
    first_name: string;
    last_name: string;
    phone?: string;
    address?: string;
    role?: string;
  }) {
    const result = await db.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone, address, role)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, email, first_name, last_name, phone, address, role, is_active, created_at`,
      [data.email, data.passwordHash, data.first_name, data.last_name, data.phone || null, data.address || null, data.role || "PORTAL"]
    );
    return result.rows[0];
  },

  async findById(id: string) {
    const result = await db.query(
      "SELECT id, email, first_name, last_name, phone, address, role, is_active, created_at, updated_at FROM users WHERE id = $1",
      [id]
    );
    return result.rows[0] || null;
  },

  async createResetToken(userId: string, token: string, expiresAt: Date) {
    // Invalidate old tokens
    await db.query("UPDATE password_reset_tokens SET used = true WHERE user_id = $1 AND used = false", [userId]);
    const result = await db.query(
      "INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3) RETURNING *",
      [userId, token, expiresAt]
    );
    return result.rows[0];
  },

  async findResetToken(token: string) {
    const result = await db.query(
      "SELECT * FROM password_reset_tokens WHERE token = $1 AND used = false AND expires_at > NOW()",
      [token]
    );
    return result.rows[0] || null;
  },

  async markTokenUsed(tokenId: string) {
    await db.query("UPDATE password_reset_tokens SET used = true WHERE id = $1", [tokenId]);
  },

  async updatePassword(userId: string, passwordHash: string) {
    await db.query("UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2", [passwordHash, userId]);
  },
};
