import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../../config/env';
import { AuthRepository } from './auth.repository';
import { RegisterInput, LoginInput } from './auth.schema';

const jwtOptions: SignOptions = { expiresIn: env.JWT_EXPIRES_IN as any };

export const AuthService = {
  async register(data: RegisterInput) {
    // Check if email already exists
    const existing = await AuthRepository.findByEmail(data.email);
    if (existing) {
      throw { status: 409, code: 'CONFLICT', message: 'Email already registered' };
    }

    // Hash password
    const password_hash = await bcrypt.hash(data.password, 12);

    // Create user
    const user = await AuthRepository.create({
      name: data.name,
      email: data.email,
      password_hash,
      phone: data.phone,
      company: data.company,
    });

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      env.JWT_SECRET,
      jwtOptions
    );

    return { user, token };
  },

  async login(data: LoginInput) {
    // Find user
    const user = await AuthRepository.findByEmail(data.email);
    if (!user) {
      throw { status: 401, code: 'UNAUTHORIZED', message: 'Invalid email or password' };
    }

    // Verify password
    const valid = await bcrypt.compare(data.password, user.password_hash);
    if (!valid) {
      throw { status: 401, code: 'UNAUTHORIZED', message: 'Invalid email or password' };
    }

    // Check active status
    if (user.status !== 'ACTIVE') {
      throw { status: 403, code: 'FORBIDDEN', message: 'Account is deactivated' };
    }

    // Update last login
    await AuthRepository.updateLastLogin(user.id);

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      env.JWT_SECRET,
      jwtOptions
    );

    // Don't return password_hash
    const { password_hash: _, ...safeUser } = user;
    return { user: safeUser, token };
  },

  async getMe(userId: string) {
    const user = await AuthRepository.findById(userId);
    if (!user) {
      throw { status: 404, code: 'NOT_FOUND', message: 'User not found' };
    }
    return user;
  },
};
