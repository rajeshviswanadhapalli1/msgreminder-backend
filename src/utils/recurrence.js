/**
 * Compute the next occurrence after completing a repeating reminder.
 */
function computeNextScheduledAt(scheduledAt, repeat) {
  const current = new Date(scheduledAt);

  switch (repeat) {
    case 'daily':
      current.setUTCDate(current.getUTCDate() + 1);
      break;
    case 'weekly':
      current.setUTCDate(current.getUTCDate() + 7);
      break;
    case 'monthly':
      current.setUTCMonth(current.getUTCMonth() + 1);
      break;
    case 'yearly':
      current.setUTCFullYear(current.getUTCFullYear() + 1);
      break;
    default:
      return null;
  }

  return current;
}

function isValidTimezone(tz) {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  computeNextScheduledAt,
  isValidTimezone,
};
