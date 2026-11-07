const userService = require('../services/user.service');

async function deleteByCredentials(req, res, next) {
  try {
    const result = await userService.deleteAccountByCredentials(
      req.body.email,
      req.body.password
    );
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  deleteByCredentials,
};
