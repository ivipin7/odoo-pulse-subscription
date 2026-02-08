import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { config } from "../../config.js";
import { authRepository } from "./auth.repository.js";
import { AppError } from "../../utils/AppError.js";
import { sendMail } from "../../utils/email.js";
import type { RegisterInput, LoginInput } from "./auth.schema.js";

export const authService = {
  async register(input: RegisterInput) {
    const existing = await authRepository.findByEmail(input.email);
    if (existing) {
      throw new AppError(409, "EMAIL_EXISTS", "Email already registered");
    }
    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await authRepository.create({
      email: input.email,
      passwordHash,
      first_name: input.first_name,
      last_name: input.last_name,
      phone: input.phone,
      address: input.address,
    });
    const token = generateToken(user);
    return { user: formatUser(user), token };
  },

  async login(input: LoginInput) {
    const user = await authRepository.findByEmail(input.email);
    if (!user) {
      throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password");
    }
    const valid = await bcrypt.compare(input.password, user.password_hash);
    if (!valid) {
      throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password");
    }
    if (!user.is_active) {
      throw new AppError(403, "ACCOUNT_DISABLED", "Account is disabled");
    }
    const token = generateToken(user);
    return { user: formatUser(user), token };
  },

  async getMe(userId: string) {
    const user = await authRepository.findById(userId);
    if (!user) {
      throw new AppError(404, "NOT_FOUND", "User not found");
    }
    return formatUser(user);
  },

  async forgotPassword(email: string) {
    const user = await authRepository.findByEmail(email);
    if (!user) {
      // Don't reveal whether email exists - return success anyway
      return { message: "If that email exists, a reset link has been sent." };
    }
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await authRepository.createResetToken(user.id, token, expiresAt);

    const resetUrl = `${config.frontendUrl}/reset-password?token=${token}`;

    // Send the actual email
    try {
      const result = await sendMail({
        to: email,
        subject: "Password Reset – Subscription Manager",
        text: `Hi ${user.first_name || ""},\n\nYou requested a password reset. Click the link below to set a new password:\n\n${resetUrl}\n\nThis link expires in 1 hour.\n\nIf you didn't request this, please ignore this email.\n`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
            <h2 style="color: #7c3aed;">Password Reset</h2>
            <p>Hi ${user.first_name || ""},</p>
            <p>You requested a password reset. Click the button below to set a new password:</p>
            <a href="${resetUrl}" style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0;">
              Reset Password
            </a>
            <p style="color:#666;font-size:13px;">This link expires in 1 hour. If you didn't request this, please ignore this email.</p>
          </div>
        `,
      });

      console.log(`\n🔑 Password reset email sent to ${email}`);
      if (result.previewUrl) {
        console.log(`   Preview: ${result.previewUrl}\n`);
      }
    } catch (err: any) {
      console.error(`🔑 Failed to send password reset email to ${email}:`, err.message);
    }

    // Always return the token in dev so the UI can show a direct link
    return { message: "If that email exists, a reset link has been sent.", token };
  },

  async resetPassword(token: string, newPassword: string) {
    const resetToken = await authRepository.findResetToken(token);
    if (!resetToken) {
      throw new AppError(400, "INVALID_TOKEN", "Invalid or expired reset token");
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await authRepository.updatePassword(resetToken.user_id, passwordHash);
    await authRepository.markTokenUsed(resetToken.id);
    return { message: "Password has been reset successfully" };
  },
};

function generateToken(user: { id: string; email: string; role: string }) {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn as string }
  );
}

function formatUser(user: Record<string, unknown>) {
  return {
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    phone: user.phone,
    address: user.address,
    role: user.role,
    is_active: user.is_active,
    created_at: user.created_at,
  };
}
