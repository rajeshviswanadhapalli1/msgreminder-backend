const reminderService = require('../services/reminder.service');

async function create(req, res, next) {
  try {
    const reminder = await reminderService.createReminder(req.user.id, req.body);
    res.status(201).json({ data: reminder });
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const result = await reminderService.listReminders(req.user.id, req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const reminder = await reminderService.getReminderById(req.user.id, req.params.id);
    res.json({ data: reminder });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const reminder = await reminderService.updateReminder(req.user.id, req.params.id, req.body);
    res.json({ data: reminder });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const result = await reminderService.deleteReminder(req.user.id, req.params.id);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

async function complete(req, res, next) {
  try {
    const result = await reminderService.completeReminder(req.user.id, req.params.id);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  create,
  list,
  getById,
  update,
  remove,
  complete,
};
