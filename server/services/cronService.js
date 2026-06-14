const cron = require('node-cron');
const User = require('../models/User');

console.log('⏰ Cron service initialized');

// Schedule score reset: runs every Monday at 00:00 (midnight)
// Pattern: minute hour day-of-month month day-of-week
const resetJob = cron.schedule('0 0 * * 1', async () => {
  try {
    console.log('🔄 Weekly cron job started: Resetting user weekly scores...');
    
    // Set weeklyScore to 0 for all users
    const result = await User.updateMany({}, { $set: { weeklyScore: 0 } });
    
    console.log(`✅ Weekly scores reset completed. Updated ${result.modifiedCount} users.`);
  } catch (error) {
    console.error('❌ Weekly score reset cron job failed:', error);
  }
});

module.exports = {
  resetJob
};
