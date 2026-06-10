/**
 * Seed Script — Populates MongoDB with demo data for Carbon Twin City
 * Run: node seed.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/carbon-twin-city';

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Get models
    const User = require('./models/User');
    const Action = require('./models/Action');
    const WeeklyReport = require('./models/WeeklyReport');

    // Clear existing data
    await User.deleteMany({});
    await Action.deleteMany({});
    await WeeklyReport.deleteMany({});
    console.log('Cleared existing data');

    const passwordHash = await bcrypt.genSalt(12).then(salt => bcrypt.hash('password123', salt));

    // ─── SEED USERS ─────────────────────────────────────────
    const seedUsers = [
      {
        name: 'Maya Green',
        email: 'maya@example.com',
        password: passwordHash,
        city: 'Portland',
        country: 'US',
        onboardingComplete: true,
        quizAnswers: {
          transport: { mode: 'bike', weeklyKm: 40 },
          diet: 'vegan',
          energy: { source: 'renewable', monthlyKwh: 200 },
          shopping: 'minimal',
          flights: { shortHaul: 1, longHaul: 0 }
        },
        baselineScore: 1875,
        currentScore: 1650,
        weeklyScore: -8.4,
        streak: 12,
        lastLogDate: new Date(),
        scoreBreakdown: { transport: 0, diet: 1500, energy: 120, shopping: 500, flights: 255 },
        dailySnapshots: generateSnapshots(1875, 1650, 30)
      },
      {
        name: 'Alex Chen',
        email: 'alex@example.com',
        password: passwordHash,
        city: 'San Francisco',
        country: 'US',
        onboardingComplete: true,
        quizAnswers: {
          transport: { mode: 'car_petrol', weeklyKm: 100 },
          diet: 'omnivore',
          energy: { source: 'mixed', monthlyKwh: 350 },
          shopping: 'average',
          flights: { shortHaul: 2, longHaul: 1 }
        },
        baselineScore: 5896,
        currentScore: 5200,
        weeklyScore: -5.2,
        streak: 7,
        lastLogDate: new Date(),
        scoreBreakdown: { transport: 1092, diet: 2500, energy: 966, shopping: 1200, flights: 2130 },
        dailySnapshots: generateSnapshots(5896, 5200, 30)
      },
      {
        name: 'Priya Sharma',
        email: 'priya@example.com',
        password: passwordHash,
        city: 'Mumbai',
        country: 'India',
        onboardingComplete: true,
        quizAnswers: {
          transport: { mode: 'public_transit', weeklyKm: 60 },
          diet: 'vegetarian',
          energy: { source: 'coal', monthlyKwh: 150 },
          shopping: 'minimal',
          flights: { shortHaul: 1, longHaul: 0 }
        },
        baselineScore: 3732,
        currentScore: 3400,
        weeklyScore: -3.8,
        streak: 21,
        lastLogDate: new Date(),
        scoreBreakdown: { transport: 278, diet: 1700, energy: 1476, shopping: 500, flights: 255 },
        dailySnapshots: generateSnapshots(3732, 3400, 30)
      },
      {
        name: 'Lars Johansson',
        email: 'lars@example.com',
        password: passwordHash,
        city: 'Stockholm',
        country: 'Sweden',
        onboardingComplete: true,
        quizAnswers: {
          transport: { mode: 'car_electric', weeklyKm: 80 },
          diet: 'pescatarian',
          energy: { source: 'renewable', monthlyKwh: 250 },
          shopping: 'average',
          flights: { shortHaul: 3, longHaul: 2 }
        },
        baselineScore: 5205,
        currentScore: 4600,
        weeklyScore: -6.1,
        streak: 4,
        lastLogDate: new Date(Date.now() - 86400000),
        scoreBreakdown: { transport: 208, diet: 1900, energy: 150, shopping: 1200, flights: 4005 },
        dailySnapshots: generateSnapshots(5205, 4600, 30)
      },
      {
        name: 'Emma Wilson',
        email: 'emma@example.com',
        password: passwordHash,
        city: 'London',
        country: 'UK',
        onboardingComplete: true,
        quizAnswers: {
          transport: { mode: 'public_transit', weeklyKm: 50 },
          diet: 'vegetarian',
          energy: { source: 'mixed', monthlyKwh: 200 },
          shopping: 'minimal',
          flights: { shortHaul: 2, longHaul: 0 }
        },
        baselineScore: 3462,
        currentScore: 2900,
        weeklyScore: -9.2,
        streak: 30,
        lastLogDate: new Date(),
        scoreBreakdown: { transport: 231, diet: 1700, energy: 552, shopping: 500, flights: 510 },
        dailySnapshots: generateSnapshots(3462, 2900, 30)
      },
      {
        name: 'Demo User',
        email: 'demo@carbontwin.city',
        password: passwordHash,
        city: 'New York',
        country: 'US',
        onboardingComplete: true,
        quizAnswers: {
          transport: { mode: 'car_petrol', weeklyKm: 80 },
          diet: 'omnivore',
          energy: { source: 'mixed', monthlyKwh: 300 },
          shopping: 'average',
          flights: { shortHaul: 2, longHaul: 1 }
        },
        baselineScore: 5448,
        currentScore: 4800,
        weeklyScore: -4.5,
        streak: 5,
        lastLogDate: new Date(),
        scoreBreakdown: { transport: 874, diet: 2500, energy: 828, shopping: 1200, flights: 2130 },
        dailySnapshots: generateSnapshots(5448, 4800, 30)
      }
    ];

    const users = await User.insertMany(seedUsers);
    console.log(`Created ${users.length} users`);

    // ─── SEED ACTIONS ───────────────────────────────────────
    const actionTemplates = [
      { category: 'transport', action: 'public_transit', co2Delta: -0.3 },
      { category: 'transport', action: 'cycled_walked', co2Delta: -1.2 },
      { category: 'transport', action: 'work_from_home', co2Delta: -1.2 },
      { category: 'meal', action: 'vegan_meal', co2Delta: -0.5 },
      { category: 'meal', action: 'vegetarian_meal', co2Delta: -0.3 },
      { category: 'meal', action: 'local_produce', co2Delta: -0.2 },
      { category: 'meal', action: 'meat_meal', co2Delta: 0.8 },
      { category: 'home', action: 'ac_off_4hrs', co2Delta: -0.4 },
      { category: 'home', action: 'air_dry_laundry', co2Delta: -0.7 },
      { category: 'home', action: 'reduced_heating', co2Delta: -0.5 },
      { category: 'shopping', action: 'secondhand_item', co2Delta: -1.2 },
      { category: 'shopping', action: 'avoid_plastic', co2Delta: -0.1 },
    ];

    const allActions = [];
    for (const user of users) {
      // Generate 3-5 actions per day for last 14 days
      for (let day = 0; day < 14; day++) {
        const numActions = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < numActions; i++) {
          const template = actionTemplates[Math.floor(Math.random() * actionTemplates.length)];
          const timestamp = new Date();
          timestamp.setDate(timestamp.getDate() - day);
          timestamp.setHours(8 + Math.floor(Math.random() * 12));

          allActions.push({
            userId: user._id,
            category: template.category,
            action: template.action,
            co2Delta: template.co2Delta,
            notes: '',
            timestamp
          });
        }
      }
    }

    await Action.insertMany(allActions);
    console.log(`Created ${allActions.length} action logs`);

    // ─── SEED WEEKLY REPORTS ────────────────────────────────
    const reports = [];
    for (const user of users.slice(0, 3)) {
      for (let week = 0; week < 4; week++) {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - (week * 7) - weekStart.getDay() + 1);
        weekStart.setHours(0, 0, 0, 0);

        reports.push({
          userId: user._id,
          weekStart,
          summary: `Week ${4 - week}: You logged multiple green actions and reduced your footprint by ${(2 + Math.random() * 5).toFixed(1)} kg CO₂.`,
          insight: `Your ${['transport', 'diet', 'energy', 'shopping'][week % 4]} category showed the most improvement this week.`,
          goal: `Try to ${['take public transit twice', 'have 4 meatless days', 'air-dry laundry 3 times', 'buy only secondhand items'][week % 4]} next week.`,
          totalDelta: -(2 + Math.random() * 8),
          actionsCount: 15 + Math.floor(Math.random() * 10),
          categoryBreakdown: {
            transport: -(0.5 + Math.random() * 2),
            meal: -(0.3 + Math.random() * 3),
            home: -(0.2 + Math.random() * 1.5),
            shopping: -(0.1 + Math.random() * 1)
          }
        });
      }
    }

    await WeeklyReport.insertMany(reports);
    console.log(`Created ${reports.length} weekly reports`);

    console.log('\n✅ Seed data complete!');
    console.log('\n📋 Demo accounts (all password: password123):');
    seedUsers.forEach(u => console.log(`   ${u.email} — ${u.name} (${u.currentScore} kg CO₂/yr)`));
    console.log(`\n   🌟 Best account to demo: demo@carbontwin.city`);

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

function generateSnapshots(startScore, endScore, days) {
  const snapshots = [];
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    const progress = (days - i) / days;
    const score = Math.round(startScore - (startScore - endScore) * progress + (Math.random() - 0.5) * 100);
    snapshots.push({ date, score });
  }
  return snapshots;
}

seed();
