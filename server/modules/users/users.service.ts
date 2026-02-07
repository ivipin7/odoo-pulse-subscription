import { usersRepository } from './users.repository';
import { UpdateUserInput } from './users.schema';

export const usersService = {
  async getAllUsers(limit?: number, offset?: number) {
    return usersRepository.findAll(limit, offset);
  },

  async getUserById(id: string) {
    const user = await usersRepository.findById(id);
    if (!user) throw { status: 404, message: 'User not found' };
    return user;
  },

  async updateUser(id: string, data: UpdateUserInput) {
    const user = await usersRepository.findById(id);
    if (!user) throw { status: 404, message: 'User not found' };
    return usersRepository.update(id, data);
  },

  async deleteUser(id: string) {
    const user = await usersRepository.findById(id);
    if (!user) throw { status: 404, message: 'User not found' };
    return usersRepository.softDelete(id);
  },

  async getUserStats() {
    return usersRepository.getStats();
  },
};
