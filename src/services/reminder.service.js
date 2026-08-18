const { v4: uuidv4 } = require('uuid');
const { Reminder } = require('../models');
const ApiError = require('../utils/ApiError');
const { parsePagination, buildMeta } = require('../utils/pagination');
const { computeNextScheduledAt, isValidTimezone } = require('../utils/recurrence');

function buildListWhere(userId, view) {
  const where = { userId };

  switch (view) {
    case 'upcoming':
      where.status = 'pending';
      break;
    case 'completed':
      where.status = 'completed';
      break;
    case 'all':
    default:
      break;
  }

  return where;
}

function buildListOrder(view) {
  if (view === 'completed') {
    return [['completedAt', 'DESC'], ['scheduledAt', 'DESC']];
  }
  return [['scheduledAt', 'ASC']];
}

async function createReminder(userId, data) {
  const timezone = data.timezone || 'UTC';
  if (!isValidTimezone(timezone)) {
    throw ApiError.badRequest('Invalid timezone');
  }

  const scheduledAt = new Date(data.scheduledAt);
  if (Number.isNaN(scheduledAt.getTime())) {
    throw ApiError.badRequest('Invalid scheduledAt');
  }

  const seriesId = data.repeat !== 'none' ? uuidv4() : null;

  const reminder = await Reminder.create({
    userId,
    title: data.title?.trim() || null,
    message: data.message.trim(),
    category: data.category || 'general',
    scheduledAt,
    timezone,
    repeat: data.repeat || 'none',
    priority: data.priority || 'medium',
    status: 'pending',
    seriesId,
  });

  return reminder.toJSON();
}

async function listReminders(userId, query) {
  const view = query.view || 'upcoming';
  if (!['upcoming', 'all', 'completed'].includes(view)) {
    throw ApiError.badRequest('view must be upcoming, all, or completed');
  }

  const { page, limit, offset } = parsePagination(query);
  const where = buildListWhere(userId, view);
  const order = buildListOrder(view);

  const { rows, count } = await Reminder.findAndCountAll({
    where,
    order,
    limit,
    offset,
  });

  return {
    data: rows.map((r) => r.toJSON()),
    meta: buildMeta(count, page, limit),
  };
}

async function getReminderById(userId, reminderId) {
  const reminder = await Reminder.findOne({
    where: { id: reminderId, userId },
  });

  if (!reminder) {
    throw ApiError.notFound('Reminder not found');
  }

  return reminder.toJSON();
}

async function updateReminder(userId, reminderId, updates) {
  const reminder = await Reminder.findOne({
    where: { id: reminderId, userId },
  });

  if (!reminder) {
    throw ApiError.notFound('Reminder not found');
  }

  const allowed = {};

  if (updates.title !== undefined) allowed.title = updates.title?.trim() || null;
  if (updates.message !== undefined) allowed.message = updates.message.trim();
  if (updates.category !== undefined) allowed.category = updates.category;
  if (updates.repeat !== undefined) allowed.repeat = updates.repeat;
  if (updates.priority !== undefined) allowed.priority = updates.priority;
  if (updates.timezone !== undefined) {
    if (!isValidTimezone(updates.timezone)) {
      throw ApiError.badRequest('Invalid timezone');
    }
    allowed.timezone = updates.timezone;
  }
  if (updates.scheduledAt !== undefined) {
    const scheduledAt = new Date(updates.scheduledAt);
    if (Number.isNaN(scheduledAt.getTime())) {
      throw ApiError.badRequest('Invalid scheduledAt');
    }
    allowed.scheduledAt = scheduledAt;
  }

  if (updates.status !== undefined) {
    allowed.status = updates.status;
    if (updates.status === 'completed') {
      allowed.completedAt = new Date();
    } else if (updates.status === 'pending') {
      allowed.completedAt = null;
    }
  }

  if (updates.repeat !== undefined && updates.repeat !== 'none' && !reminder.seriesId) {
    allowed.seriesId = uuidv4();
  }

  await reminder.update(allowed);
  return reminder.toJSON();
}

async function deleteReminder(userId, reminderId) {
  const reminder = await Reminder.findOne({
    where: { id: reminderId, userId },
  });

  if (!reminder) {
    throw ApiError.notFound('Reminder not found');
  }

  await reminder.destroy();
  return { message: 'Reminder deleted successfully' };
}

async function completeReminder(userId, reminderId) {
  const reminder = await Reminder.findOne({
    where: { id: reminderId, userId },
  });

  if (!reminder) {
    throw ApiError.notFound('Reminder not found');
  }

  if (reminder.status === 'completed') {
    throw ApiError.badRequest('Reminder is already completed');
  }

  const now = new Date();

  if (reminder.repeat === 'none') {
    await reminder.update({
      status: 'completed',
      completedAt: now,
    });

    return {
      completed: reminder.toJSON(),
      next: null,
    };
  }

  const completedData = {
    status: 'completed',
    completedAt: now,
  };

  await reminder.update(completedData);

  const nextScheduledAt = computeNextScheduledAt(reminder.scheduledAt, reminder.repeat);
  const nextReminder = await Reminder.create({
    userId,
    title: reminder.title,
    message: reminder.message,
    category: reminder.category,
    scheduledAt: nextScheduledAt,
    timezone: reminder.timezone,
    repeat: reminder.repeat,
    priority: reminder.priority,
    status: 'pending',
    seriesId: reminder.seriesId || reminder.id,
  });

  return {
    completed: reminder.toJSON(),
    next: nextReminder.toJSON(),
  };
}

module.exports = {
  createReminder,
  listReminders,
  getReminderById,
  updateReminder,
  deleteReminder,
  completeReminder,
};
