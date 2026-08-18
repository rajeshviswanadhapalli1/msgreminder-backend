const { body, query, param } = require('express-validator');

const REPEAT_VALUES = ['none', 'daily', 'weekly', 'monthly', 'yearly'];
const PRIORITY_VALUES = ['low', 'medium', 'high'];
const CATEGORY_VALUES = ['general', 'birthday', 'meeting', 'anniversary', 'other'];
const STATUS_VALUES = ['pending', 'completed'];
const VIEW_VALUES = ['upcoming', 'all', 'completed'];

const createReminderRules = [
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ max: 500 })
    .withMessage('Message must be at most 500 characters'),
  body('title').optional({ nullable: true }).trim().isLength({ max: 120 }),
  body('category').optional().isIn(CATEGORY_VALUES),
  body('scheduledAt').isISO8601().withMessage('scheduledAt must be a valid ISO-8601 datetime'),
  body('timezone').optional().isString().isLength({ max: 64 }),
  body('repeat').optional().isIn(REPEAT_VALUES),
  body('priority').optional().isIn(PRIORITY_VALUES),
];

const updateReminderRules = [
  param('id').isUUID().withMessage('Invalid reminder id'),
  body('message').optional().trim().notEmpty().isLength({ max: 500 }),
  body('title').optional({ nullable: true }).trim().isLength({ max: 120 }),
  body('category').optional().isIn(CATEGORY_VALUES),
  body('scheduledAt').optional().isISO8601(),
  body('timezone').optional().isString().isLength({ max: 64 }),
  body('repeat').optional().isIn(REPEAT_VALUES),
  body('priority').optional().isIn(PRIORITY_VALUES),
  body('status').optional().isIn(STATUS_VALUES),
];

const reminderIdRules = [param('id').isUUID().withMessage('Invalid reminder id')];

const listReminderRules = [
  query('view').optional().isIn(VIEW_VALUES),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
];

module.exports = {
  createReminderRules,
  updateReminderRules,
  reminderIdRules,
  listReminderRules,
};
