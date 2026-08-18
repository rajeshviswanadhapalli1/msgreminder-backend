const express = require('express');
const userController = require('../controllers/user.controller');
const authenticate = require('../middleware/auth');
const validate = require('../middleware/validate');
const { updateProfileRules, changePasswordRules } = require('../validators/user.validator');

const router = express.Router();

router.use(authenticate);

router.get('/me', userController.getMe);
router.patch('/me', updateProfileRules, validate, userController.updateMe);
router.patch('/me/password', changePasswordRules, validate, userController.changePassword);

module.exports = router;
