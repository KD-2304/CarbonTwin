/**
 * Date Helpers — Shared date utility functions
 * 
 * Centralizes date logic previously duplicated across routes and services.
 */

/**
 * Get the start of the ISO week (Monday 00:00:00) for a given date.
 * @param {Date} date
 * @returns {Date} Monday at midnight
 */
function getStartOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  // Get days to subtract to reach Monday (1). Sunday (0) -> subtract 6 days.
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/**
 * Check if a user's weekly score needs to be reset (new calendar week boundary crossed).
 * If so, resets weeklyScore to 0 and updates lastWeeklyReset. Saves the user document.
 * 
 * @param {Object} user - Mongoose User document
 * @returns {Promise<boolean>} true if a reset was performed
 */
async function checkAndResetWeeklyScore(user) {
  const now = new Date();
  const lastReset = user.lastWeeklyReset || user.createdAt || now;
  const startOfCurrentWeek = getStartOfWeek(now);
  const startOfLastResetWeek = getStartOfWeek(lastReset);

  if (startOfCurrentWeek.getTime() > startOfLastResetWeek.getTime()) {
    user.weeklyScore = 0;
    user.lastWeeklyReset = now;
    await user.save();
    return true;
  }
  return false;
}

module.exports = {
  getStartOfWeek,
  checkAndResetWeeklyScore
};
