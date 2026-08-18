const { User, PasswordResetToken } = require('../models');
const ApiError = require('../utils/ApiError');
const { signToken } = require('../utils/jwt');
const {
  normalizeEmail,
  normalizeMobile,
  generateSecureToken,
  hashToken,
} = require('../utils/pagination');
const { isValidTimezone } = require('../utils/recurrence');
const { sendPasswordResetEmail } = require('./email.service');

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

function buildAuthResponse(user) {
  const token = signToken({
    sub: user.id,
    email: user.email,
    tokenVersion: user.tokenVersion,
  });

  return {
    token,
    user: user.toSafeJSON(),
  };
}

async function register(data) {
  const email = normalizeEmail(data.email);
  const mobile = normalizeMobile(data.mobile);
  const timezone = data.timezone || 'UTC';

  if (!isValidTimezone(timezone)) {
    throw ApiError.badRequest('Invalid timezone');
  }

  const existingEmail = await User.findOne({ where: { email } });
  if (existingEmail) {
    throw ApiError.conflict('Email is already registered');
  }

  const existingMobile = await User.findOne({
    where: { countryCode: data.countryCode, mobile },
  });
  if (existingMobile) {
    throw ApiError.conflict('Mobile number is already registered');
  }

  const passwordHash = await User.hashPassword(data.password);

  const user = await User.create({
    fullName: data.fullName.trim(),
    email,
    country: data.country.trim(),
    countryCode: data.countryCode.trim(),
    mobile,
    passwordHash,
    timezone,
  });

  return buildAuthResponse(user);
}

async function login(email, password) {
  const normalizedEmail = normalizeEmail(email);
  const user = await User.findOne({ where: { email: normalizedEmail } });

  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const valid = await user.comparePassword(password);
  if (!valid) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  return buildAuthResponse(user);
}

async function forgotPassword(email) {
  const normalizedEmail = normalizeEmail(email);
  const user = await User.findOne({ where: { email: normalizedEmail } });

  if (user) {
    const rawToken = generateSecureToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

    await PasswordResetToken.update(
      { usedAt: new Date() },
      { where: { userId: user.id, usedAt: null } }
    );

    await PasswordResetToken.create({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    await sendPasswordResetEmail(user.email, rawToken);
  }

  return {
    message: 'If an account exists for that email, a reset link has been sent.',
  };
}

async function resetPassword(token, newPassword) {
  const tokenHash = hashToken(token);
  const resetRecord = await PasswordResetToken.findOne({
    where: { tokenHash },
    include: [{ model: User, as: 'user' }],
  });

  if (!resetRecord || resetRecord.isUsed() || resetRecord.isExpired()) {
    throw ApiError.badRequest('Invalid or expired reset token');
  }

  const user = resetRecord.user;
  const passwordHash = await User.hashPassword(newPassword);

  await user.update({
    passwordHash,
    tokenVersion: user.tokenVersion + 1,
  });

  await resetRecord.update({ usedAt: new Date() });

  return buildAuthResponse(user);
}

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
};
