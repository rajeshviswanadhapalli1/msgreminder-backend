const express = require('express');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const reminderRoutes = require('./reminder.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/reminders', reminderRoutes);

module.exports = router;
