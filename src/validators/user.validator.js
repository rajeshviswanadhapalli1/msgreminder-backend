const { body } = require('express-validator');

const updateProfileRules = [
  body('fullName').optional().trim().notEmpty().isLength({ max: 120 }),
  body('country').optional().trim().notEmpty().isLength({ max: 80 }),
  body('countryCode').optional().trim().notEmpty().isLength({ max: 8 }),
  body('mobile').optional().trim().notEmpty().isLength({ max: 20 }),
  body('timezone').optional().isString().isLength({ max: 64 }),
];

const changePasswordRules = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters')
    .isLength({ max: 128 }),
];

module.exports = {
  updateProfileRules,
  changePasswordRules,
};
