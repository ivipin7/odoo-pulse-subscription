import bcrypt from 'bcrypt';
import { profileRepository } from './profile.repository';
import { UpdateProfileInput, ChangePasswordInput } from './profile.schema';

export const profileService = {
  async getProfile(userId: string) {
    const [profile, stats] = await Promise.all([
      profileRepository.findById(userId),
      profileRepository.getProfileStats(userId),
    ]);
    if (!profile) throw { status: 404, message: 'Profile not found' };
    return { ...profile, stats };
  },

  async updateProfile(userId: string, data: UpdateProfileInput) {
    return profileRepository.update(userId, data);
  },

  async changePassword(userId: string, data: ChangePasswordInput) {
    const currentHash = await profileRepository.getPasswordHash(userId);
    if (!currentHash) throw { status: 404, message: 'User not found' };

    const valid = await bcrypt.compare(data.current_password, currentHash);
    if (!valid) throw { status: 400, message: 'Current password is incorrect' };

    const newHash = await bcrypt.hash(data.new_password, 12);
    await profileRepository.updatePassword(userId, newHash);
    return { message: 'Password changed successfully' };
  },
};
