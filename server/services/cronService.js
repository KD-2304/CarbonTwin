const cron = require('node-cron');
const User = require('../models/User');
const { getStartOfWeek } = require('../utils/dateHelpers');
const logger = require('../utils/logger');

logger.info('⏰ Cron service initialized');

// Schedule score reset: runs every Monday at 00:00 (midnight)
// Pattern: minute hour day-of-month month day-of-week
const resetJob = cron.schedule('0 0 * * 1', async () => {
  try {
    logger.info('🔄 Weekly cron job started: Resetting user weekly scores...');
    
    const now = new Date();
    const startOfCurrentWeek = getStartOfWeek(now);

    const result = await User.updateMany(
      {
        $or: [
          { weeklyScore: { $ne: 0 } },
          { lastWeeklyReset: { $lt: startOfCurrentWeek } },
          { lastWeeklyReset: null }
        ]
      },
      { $set: { weeklyScore: 0, lastWeeklyReset: now } }
    );
    const updatedCount = result.modifiedCount;
    
    logger.info(`✅ Weekly scores reset completed. Updated ${updatedCount} users.`);
  } catch (error) {
    logger.error('❌ Weekly score reset cron job failed:', error);
  }
});

module.exports = {
  resetJob
};
