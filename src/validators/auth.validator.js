const { body } = require('express-validator');

const registerRules = [
  body('fullName').trim().notEmpty().withMessage('Full name is required').isLength({ max: 120 }),
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('country').trim().notEmpty().withMessage('Country is required').isLength({ max: 80 }),
  body('countryCode').trim().notEmpty().withMessage('Country code is required').isLength({ max: 8 }),
  body('mobile').trim().notEmpty().withMessage('Mobile number is required').isLength({ max: 20 }),
  body('password')
    .isLength({ min: 4 })
    .withMessage('Password must be at least 4 characters')
    .isLength({ max: 128 }),
  body('timezone').optional().isString().isLength({ max: 64 }),
];

const loginRules = [
  body('password').notEmpty().withMessage('Password is required'),
  body('email').optional({ values: 'falsy' }).trim(),
  body('mobile').optional({ values: 'falsy' }).trim(),
  body().custom((_, { req }) => {
    const email = typeof req.body.email === 'string' ? req.body.email.trim() : '';
    const mobile = typeof req.body.mobile === 'string' ? req.body.mobile.trim() : '';
    const value = email || mobile;
    if (!value) {
      throw new Error('Email or mobile number is required');
    }
    if (value.includes('@')) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        throw new Error('Enter a valid email or mobile number');
      }
      return true;
    }
    if (value.replace(/\D/g, '').length < 6) {
      throw new Error('Enter a valid email or mobile number');
    }
    return true;
  }),
];

const forgotPasswordRules = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
];

const resetPasswordRules = [
  body('token').trim().notEmpty().withMessage('Reset token is required'),
  body('newPassword')
    .isLength({ min: 4 })
    .withMessage('Password must be at least 4 characters')
    .isLength({ max: 128 }),
];

module.exports = {
  registerRules,
  loginRules,
  forgotPasswordRules,
  resetPasswordRules,
};
