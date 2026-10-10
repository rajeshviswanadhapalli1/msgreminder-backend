const { Op, fn, col, where: sqlWhere } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const { Reminder } = require('../models');
const { cloudinary } = require('../config/cloudinary');
const ApiError = require('../utils/ApiError');
const { parsePagination, buildMeta } = require('../utils/pagination');
const { computeNextScheduledAt, isValidTimezone } = require('../utils/recurrence');

function escapeLike(value) {
  return value.replace(/[\\%_]/g, '\\$&');
}

function buildListWhere(userId, view, title) {
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

  if (title && title.trim()) {
    const term = `%${escapeLike(title.trim().toLowerCase())}%`;
    where[Op.and] = [
      {
        [Op.or]: [
          sqlWhere(fn('LOWER', fn('COALESCE', col('title'), '')), { [Op.like]: term }),
          sqlWhere(fn('LOWER', col('message')), { [Op.like]: term }),
        ],
      },
    ];
  }

  return where;
}

async function destroyImageIfUnused(publicId) {
  if (!publicId) return;
  const stillUsed = await Reminder.count({ where: { imagePublicId: publicId } });
  if (stillUsed > 0) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error('Failed to delete reminder image from Cloudinary:', err.message);
  }
}

function imageFields(image) {
  if (!image) return { imageUrl: null, imagePublicId: null };
  return {
    imageUrl: image.imageUrl,
    imagePublicId: image.imagePublicId,
  };
}

function clampVolume(value) {
  const volume = Number(value);
  if (!Number.isFinite(volume)) return 100;
  return Math.max(0, Math.min(100, Math.round(volume)));
}

function buildListOrder() {
  return [['createdAt', 'DESC']];
}

async function createReminder(userId, data, image = null) {
  const timezone = data.timezone || 'UTC';
  if (!isValidTimezone(timezone)) {
    if (image?.imagePublicId) await destroyImageIfUnused(image.imagePublicId);
    throw ApiError.badRequest('Invalid timezone');
  }

  const scheduledAt = new Date(data.scheduledAt);
  if (Number.isNaN(scheduledAt.getTime())) {
    if (image?.imagePublicId) await destroyImageIfUnused(image.imagePublicId);
    throw ApiError.badRequest('Invalid scheduledAt');
  }

  const seriesId = data.repeat !== 'none' ? uuidv4() : null;

  try {
    const reminder = await Reminder.create({
      userId,
      title: data.title?.trim() || null,
      message: data.message.trim(),
      category: data.category || 'general',
      scheduledAt,
      timezone,
      repeat: data.repeat || 'none',
      priority: data.priority || 'medium',
      volume: clampVolume(data.volume),
      ...imageFields(image),
      status: 'pending',
      seriesId,
    });

    return reminder.toJSON();
  } catch (err) {
    if (image?.imagePublicId) await destroyImageIfUnused(image.imagePublicId);
    throw err;
  }
}

async function listReminders(userId, query) {
  const view = query.view || 'upcoming';
  if (!['upcoming', 'all', 'completed'].includes(view)) {
    throw ApiError.badRequest('view must be upcoming, all, or completed');
  }

  const { page, limit, offset } = parsePagination(query);
  const where = buildListWhere(userId, view, query.title);
  const order = buildListOrder();

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

function shouldRemoveImage(value) {
  return value === true || value === 'true' || value === '1';
}

async function updateReminder(userId, reminderId, updates, image = null) {
  const reminder = await Reminder.findOne({
    where: { id: reminderId, userId },
  });

  if (!reminder) {
    if (image?.imagePublicId) await destroyImageIfUnused(image.imagePublicId);
    throw ApiError.notFound('Reminder not found');
  }

  const allowed = {};

  if (updates.title !== undefined) allowed.title = updates.title?.trim() || null;
  if (updates.message !== undefined) allowed.message = updates.message.trim();
  if (updates.category !== undefined) allowed.category = updates.category;
  if (updates.repeat !== undefined) allowed.repeat = updates.repeat;
  if (updates.priority !== undefined) allowed.priority = updates.priority;
  if (updates.volume !== undefined) allowed.volume = clampVolume(updates.volume);
  if (updates.timezone !== undefined) {
    if (!isValidTimezone(updates.timezone)) {
      if (image?.imagePublicId) await destroyImageIfUnused(image.imagePublicId);
      throw ApiError.badRequest('Invalid timezone');
    }
    allowed.timezone = updates.timezone;
  }
  if (updates.scheduledAt !== undefined) {
    const scheduledAt = new Date(updates.scheduledAt);
    if (Number.isNaN(scheduledAt.getTime())) {
      if (image?.imagePublicId) await destroyImageIfUnused(image.imagePublicId);
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

  const previousPublicId = reminder.imagePublicId;
  if (image) {
    allowed.imageUrl = image.imageUrl;
    allowed.imagePublicId = image.imagePublicId;
  } else if (shouldRemoveImage(updates.removeImage)) {
    allowed.imageUrl = null;
    allowed.imagePublicId = null;
  }

  try {
    await reminder.update(allowed);
  } catch (err) {
    if (image?.imagePublicId) await destroyImageIfUnused(image.imagePublicId);
    throw err;
  }

  if ((image || shouldRemoveImage(updates.removeImage)) && previousPublicId && previousPublicId !== image?.imagePublicId) {
    await destroyImageIfUnused(previousPublicId);
  }

  return reminder.toJSON();
}

async function deleteReminder(userId, reminderId) {
  const reminder = await Reminder.findOne({
    where: { id: reminderId, userId },
  });

  if (!reminder) {
    throw ApiError.notFound('Reminder not found');
  }

  const publicId = reminder.imagePublicId;
  await reminder.destroy();
  await destroyImageIfUnused(publicId);
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
    volume: reminder.volume ?? 100,
    imageUrl: reminder.imageUrl,
    imagePublicId: reminder.imagePublicId,
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
