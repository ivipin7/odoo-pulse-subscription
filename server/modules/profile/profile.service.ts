import { ProfileRepository } from './profile.repository';
import { UpdateProfileInput, CreateAddressInput } from './profile.schema';
import { AppError } from '../../middleware/errorHandler';

export const ProfileService = {
  async getProfile(userId: number) {
    const profile = await ProfileRepository.getProfile(userId);
    if (!profile) throw new AppError('User not found', 404, 'NOT_FOUND');
    return profile;
  },

  async updateProfile(userId: number, data: UpdateProfileInput) {
    return ProfileRepository.updateProfile(userId, data);
  },

  async getAddresses(userId: number) {
    return ProfileRepository.getAddresses(userId);
  },

  async addAddress(userId: number, data: CreateAddressInput) {
    return ProfileRepository.addAddress(userId, data);
  },

  async updateAddress(id: number, userId: number, data: any) {
    const result = await ProfileRepository.updateAddress(id, userId, data);
    if (!result) throw new AppError('Address not found', 404, 'NOT_FOUND');
    return result;
  },

  async deleteAddress(id: number, userId: number) {
    await ProfileRepository.deleteAddress(id, userId);
    return { message: 'Address deleted' };
  },
};
