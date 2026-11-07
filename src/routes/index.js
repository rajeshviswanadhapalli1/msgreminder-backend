const express = require('express');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const reminderRoutes = require('./reminder.routes');
const accountDeletionRoutes = require('./accountDeletion.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/reminders', reminderRoutes);
router.use('/account-deletion', accountDeletionRoutes);

module.exports = router;
