const ApiError = require('../utils/ApiError');
const { verifyToken } = require('../utils/jwt');
const { User } = require('../models');

async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Missing or invalid authorization header');
    }

    const token = header.slice(7);
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch {
      throw ApiError.unauthorized('Invalid or expired token');
    }

    const user = await User.findByPk(decoded.sub);
    if (!user) {
      throw ApiError.unauthorized('User not found');
    }

    if (decoded.tokenVersion !== user.tokenVersion) {
      throw ApiError.unauthorized('Token has been revoked');
    }

    req.user = user;
    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = authenticate;
