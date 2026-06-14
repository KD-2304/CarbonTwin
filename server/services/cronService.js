const cron = require('node-cron');
const User = require('../models/User');

console.log('⏰ Cron service initialized');

// Schedule score reset: runs every Monday at 00:00 (midnight)
// Pattern: minute hour day-of-month month day-of-week
const resetJob = cron.schedule('0 0 * * 1', async () => {
  try {
    console.log('🔄 Weekly cron job started: Resetting user weekly scores in batches...');
    
    let updatedCount = 0;
    let users;
    const batchSize = 500;
    
    do {
      users = await User.find({ weeklyScore: { $ne: 0 } }, '_id').limit(batchSize);
      
      if (users.length > 0) {
        const ids = users.map(u => u._id);
        const result = await User.updateMany(
          { _id: { $in: ids } },
          { $set: { weeklyScore: 0 } }
        );
        updatedCount += result.modifiedCount;
      }
    } while (users.length === batchSize);
    
    console.log(`✅ Weekly scores reset completed. Updated ${updatedCount} users in batches of ${batchSize}.`);
  } catch (error) {
    console.error('❌ Weekly score reset cron job failed:', error);
  }
});

module.exports = {
  resetJob
};
