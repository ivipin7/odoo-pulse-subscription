import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AuthRepository } from './auth.repository';
import { RegisterInput, LoginInput } from './auth.schema';
import { AppError } from '../../middleware/errorHandler';
import { env } from '../../config/env';

export const AuthService = {
  async register(data: RegisterInput) {
    const existing = await AuthRepository.findByEmail(data.email);
    if (existing) throw new AppError('Email already registered', 409, 'CONFLICT');

    const password_hash = await bcrypt.hash(data.password, 10);
    const user = await AuthRepository.create({
      name: data.name,
      email: data.email,
      password_hash,
      phone: data.phone,
      company: data.company,
      gst_number: data.gst_number,
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return { user, token };
  },

  async login(data: LoginInput) {
    const user = await AuthRepository.findByEmail(data.email);
    if (!user) throw new AppError('Invalid email or password', 401, 'UNAUTHORIZED');
    if (user.status === 'INACTIVE') throw new AppError('Account is deactivated', 403, 'FORBIDDEN');

    const valid = await bcrypt.compare(data.password, user.password_hash);
    if (!valid) throw new AppError('Invalid email or password', 401, 'UNAUTHORIZED');

    await AuthRepository.updateLastLogin(user.id);

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
      token,
    };
  },

  async getMe(userId: number) {
    const user = await AuthRepository.findById(userId);
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');
    return user;
  },
};
