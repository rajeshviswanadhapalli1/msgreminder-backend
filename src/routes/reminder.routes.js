const express = require('express');
const reminderController = require('../controllers/reminder.controller');
const authenticate = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  createReminderRules,
  updateReminderRules,
  reminderIdRules,
  listReminderRules,
} = require('../validators/reminder.validator');

const router = express.Router();

router.use(authenticate);

router.get('/', listReminderRules, validate, reminderController.list);
router.post('/', createReminderRules, validate, reminderController.create);
router.get('/:id', reminderIdRules, validate, reminderController.getById);
router.patch('/:id', updateReminderRules, validate, reminderController.update);
router.delete('/:id', reminderIdRules, validate, reminderController.remove);
router.post('/:id/complete', reminderIdRules, validate, reminderController.complete);

module.exports = router;
