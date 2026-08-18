const userService = require('../services/user.service');

async function getMe(req, res, next) {
  try {
    const profile = await userService.getProfile(req.user.id);
    res.json({ data: profile });
  } catch (err) {
    next(err);
  }
}

async function updateMe(req, res, next) {
  try {
    const profile = await userService.updateProfile(req.user.id, req.body);
    res.json({ data: profile });
  } catch (err) {
    next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    const result = await userService.changePassword(
      req.user.id,
      req.body.currentPassword,
      req.body.newPassword
    );
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMe,
  updateMe,
  changePassword,
};
