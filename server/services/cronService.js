const cron = require('node-cron');
const User = require('../models/User');

console.log('⏰ Cron service initialized');

// Schedule score reset: runs every Monday at 00:00 (midnight)
// Pattern: minute hour day-of-month month day-of-week
const resetJob = cron.schedule('0 0 * * 1', async () => {
  try {
    console.log('🔄 Weekly cron job started: Resetting user weekly scores...');
    
    const result = await User.updateMany(
      { weeklyScore: { $ne: 0 } },
      { $set: { weeklyScore: 0 } }
    );
    const updatedCount = result.modifiedCount;
    
    console.log(`✅ Weekly scores reset completed. Updated ${updatedCount} users.`);
  } catch (error) {
    console.error('❌ Weekly score reset cron job failed:', error);
  }
});

module.exports = {
  resetJob
};
