const { Op } = require('sequelize');
const { User } = require('../models');
const ApiError = require('../utils/ApiError');
const { normalizeMobile } = require('../utils/pagination');
const { isValidTimezone } = require('../utils/recurrence');

async function getProfile(userId) {
  const user = await User.findByPk(userId);
  if (!user) throw ApiError.notFound('User not found');
  return user.toSafeJSON();
}

async function updateProfile(userId, updates) {
  const user = await User.findByPk(userId);
  if (!user) throw ApiError.notFound('User not found');

  const allowed = {};
  if (updates.fullName !== undefined) allowed.fullName = updates.fullName.trim();
  if (updates.country !== undefined) allowed.country = updates.country.trim();
  if (updates.countryCode !== undefined) allowed.countryCode = updates.countryCode.trim();
  if (updates.mobile !== undefined) allowed.mobile = normalizeMobile(updates.mobile);
  if (updates.timezone !== undefined) {
    if (!isValidTimezone(updates.timezone)) {
      throw ApiError.badRequest('Invalid timezone');
    }
    allowed.timezone = updates.timezone;
  }

  if (allowed.countryCode && allowed.mobile) {
    const existing = await User.findOne({
      where: {
        countryCode: allowed.countryCode,
        mobile: allowed.mobile,
        id: { [Op.ne]: userId },
      },
    });
    if (existing) throw ApiError.conflict('Mobile number is already registered');
  } else if (allowed.mobile) {
    const existing = await User.findOne({
      where: {
        countryCode: user.countryCode,
        mobile: allowed.mobile,
        id: { [Op.ne]: userId },
      },
    });
    if (existing) throw ApiError.conflict('Mobile number is already registered');
  }

  await user.update(allowed);
  return user.toSafeJSON();
}

async function changePassword(userId, currentPassword, newPassword) {
  const user = await User.findByPk(userId);
  if (!user) throw ApiError.notFound('User not found');

  const valid = await user.comparePassword(currentPassword);
  if (!valid) throw ApiError.unauthorized('Current password is incorrect');

  const passwordHash = await User.hashPassword(newPassword);
  await user.update({
    passwordHash,
    tokenVersion: user.tokenVersion + 1,
  });

  return { message: 'Password updated successfully' };
}

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
};
