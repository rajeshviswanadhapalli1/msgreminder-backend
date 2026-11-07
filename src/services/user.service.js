const { Op } = require('sequelize');
const { User, Reminder, PasswordResetToken, sequelize } = require('../models');
const { cloudinary } = require('../config/cloudinary');
const ApiError = require('../utils/ApiError');
const { normalizeEmail, normalizeMobile } = require('../utils/pagination');
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
  if (updates.email !== undefined) allowed.email = normalizeEmail(updates.email);
  if (updates.country !== undefined) allowed.country = updates.country.trim();
  if (updates.countryCode !== undefined) allowed.countryCode = updates.countryCode.trim();
  if (updates.mobile !== undefined) allowed.mobile = normalizeMobile(updates.mobile);
  if (updates.timezone !== undefined) {
    if (!isValidTimezone(updates.timezone)) {
      throw ApiError.badRequest('Invalid timezone');
    }
    allowed.timezone = updates.timezone;
  }

  if (allowed.email) {
    const existingEmail = await User.findOne({
      where: {
        email: allowed.email,
        id: { [Op.ne]: userId },
      },
    });
    if (existingEmail) throw ApiError.conflict('Email is already registered');
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

async function deleteCloudinaryImages(publicIds) {
  const unique = [...new Set(publicIds.filter(Boolean))];
  await Promise.all(
    unique.map(async (publicId) => {
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (err) {
        console.error('Failed to delete reminder image from Cloudinary:', err.message);
      }
    })
  );
}

async function deleteAccountByUser(user) {
  const reminders = await Reminder.findAll({
    where: { userId: user.id },
    attributes: ['imagePublicId'],
  });
  const publicIds = reminders.map((item) => item.imagePublicId);

  await sequelize.transaction(async (transaction) => {
    await Reminder.destroy({ where: { userId: user.id }, transaction });
    await PasswordResetToken.destroy({ where: { userId: user.id }, transaction });
    await user.destroy({ transaction });
  });

  await deleteCloudinaryImages(publicIds);
  return { message: 'Account deleted successfully' };
}

/** Authenticated in-app deletion. Requires the current password. */
async function deleteAccount(userId, password) {
  const user = await User.findByPk(userId);
  if (!user) throw ApiError.notFound('User not found');

  const valid = await user.comparePassword(password);
  if (!valid) throw ApiError.unauthorized('Password is incorrect');

  return deleteAccountByUser(user);
}

/**
 * Public web-form deletion for Google Play Data safety.
 * Accepts email + password so users can delete without the app.
 */
async function deleteAccountByCredentials(email, password) {
  const normalizedEmail = normalizeEmail(email);
  const user = await User.findOne({ where: { email: normalizedEmail } });
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const valid = await user.comparePassword(password);
  if (!valid) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  return deleteAccountByUser(user);
}

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
  deleteAccountByCredentials,
};
