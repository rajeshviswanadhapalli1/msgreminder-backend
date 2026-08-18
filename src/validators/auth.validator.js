const { body } = require('express-validator');

const registerRules = [
  body('fullName').trim().notEmpty().withMessage('Full name is required').isLength({ max: 120 }),
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('country').trim().notEmpty().withMessage('Country is required').isLength({ max: 80 }),
  body('countryCode').trim().notEmpty().withMessage('Country code is required').isLength({ max: 8 }),
  body('mobile').trim().notEmpty().withMessage('Mobile number is required').isLength({ max: 20 }),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .isLength({ max: 128 }),
  body('timezone').optional().isString().isLength({ max: 64 }),
];

const loginRules = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const forgotPasswordRules = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
];

const resetPasswordRules = [
  body('token').trim().notEmpty().withMessage('Reset token is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .isLength({ max: 128 }),
];

module.exports = {
  registerRules,
  loginRules,
  forgotPasswordRules,
  resetPasswordRules,
};
