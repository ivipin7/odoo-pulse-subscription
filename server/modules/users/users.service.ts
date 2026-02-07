import { UserRepository } from './users.repository';
import { UpdateUserInput } from './users.schema';
import { AppError } from '../../middleware/errorHandler';

export const UserService = {
  async getAll() {
    return UserRepository.findAll();
  },

  async getById(id: number) {
    const user = await UserRepository.findById(id);
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');
    return user;
  },

  async update(id: number, data: UpdateUserInput) {
    const existing = await UserRepository.findById(id);
    if (!existing) throw new AppError('User not found', 404, 'NOT_FOUND');
    return UserRepository.update(id, data);
  },
};
