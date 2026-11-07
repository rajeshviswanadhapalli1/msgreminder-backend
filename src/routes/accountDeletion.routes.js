const express = require('express');
const accountDeletionController = require('../controllers/accountDeletion.controller');
const validate = require('../middleware/validate');
const { publicDeleteAccountRules } = require('../validators/user.validator');

const router = express.Router();

router.post(
  '/',
  publicDeleteAccountRules,
  validate,
  accountDeletionController.deleteByCredentials
);

module.exports = router;
