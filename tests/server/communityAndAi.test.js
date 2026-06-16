const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server/index');
const User = require('../../server/models/User');

const testEmail = () => `test_comm_${Date.now()}_${Math.random().toString(36).slice(2)}@example.com`;

describe('Community, AI, and Simulator API Tests', () => {
  let userToken = '';
  let userEmail = '';
  let userId = '';

  beforeAll(async () => {
    userEmail = testEmail();
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Community Test User', email: userEmail, password: 'password123' });
    
    const cookieHeader = res.headers['set-cookie']?.[0];
    const match = cookieHeader ? cookieHeader.match(/ctc_token=([^;]+)/) : null;
    userToken = match ? match[1] : '';
    userId = res.body.user.id;

    // Complete onboarding so the user appears in stats/leaderboard
    await request(app)
      .post('/api/quiz/submit')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        transport: { mode: 'car_petrol', weeklyKm: 100 },
        diet: 'omnivore',
        energy: { source: 'mixed', monthlyKwh: 200 },
        shopping: 'average',
        flights: { shortHaul: 2, longHaul: 1 }
      });
  });

  afterAll(async () => {
    await User.deleteOne({ _id: userId });
  });

  describe('GET /api/community/stats', () => {
    it('should retrieve community average stats and the users list', async () => {
      const res = await request(app)
        .get('/api/community/stats')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('totalUsers');
      expect(res.body).toHaveProperty('communityAverage');
      expect(res.body).toHaveProperty('cityHealth');
      expect(res.body).toHaveProperty('users');
      expect(Array.isArray(res.body.users)).toBe(true);
      expect(res.body.users.length).toBeGreaterThan(0);
      expect(res.body.users[0]).toHaveProperty('name', 'Community Test User');
    });
  });

  describe('GET /api/community/leaderboard', () => {
    it('should retrieve leaderboard lists and user rank', async () => {
      const res = await request(app)
        .get('/api/community/leaderboard')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('topReducers');
      expect(res.body).toHaveProperty('topStreaks');
      expect(res.body).toHaveProperty('totalUsers');
      expect(res.body).toHaveProperty('userRank');
    });
  });

  describe('POST /api/ai/weekly-insight', () => {
    it('should retrieve weekly insight object', async () => {
      const res = await request(app)
        .post('/api/ai/weekly-insight')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('insight');
      expect(res.body).toHaveProperty('actions');
      expect(res.body).toHaveProperty('encouragement');
    });
  });

  describe('POST /api/ai/chat', () => {
    it('should reject empty chat message', async () => {
      const res = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ message: '' });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/required/i);
    });

    it('should reject excessively long message', async () => {
      const longMessage = 'a'.repeat(2001);
      const res = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ message: longMessage });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/under 2000 characters/i);
    });

    it('should respond to valid chat message', async () => {
      const res = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ message: 'How do I save carbon?' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('response');
    });
  });

  describe('POST /api/simulator/calculate', () => {
    it('should reject unauthenticated request', async () => {
      const res = await request(app)
        .post('/api/simulator/calculate')
        .send({
          currentAnswers: {
            transport: { mode: 'car_petrol', weeklyKm: 100 },
            diet: 'omnivore',
            energy: { source: 'mixed', monthlyKwh: 200 },
            shopping: 'average',
            flights: { shortHaul: 2, longHaul: 1 }
          },
          modifications: { switchToRenewable: true }
        });

      expect(res.status).toBe(401);
    });

    it('should compute simulated projections for authenticated user', async () => {
      const res = await request(app)
        .post('/api/simulator/calculate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          currentAnswers: {
            transport: { mode: 'car_petrol', weeklyKm: 100 },
            diet: 'omnivore',
            energy: { source: 'mixed', monthlyKwh: 200 },
            shopping: 'average',
            flights: { shortHaul: 2, longHaul: 1 }
          },
          modifications: { switchToRenewable: true }
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('currentScore');
      expect(res.body).toHaveProperty('simulatedScore');
      expect(res.body).toHaveProperty('savings');
      expect(res.body).toHaveProperty('equivalencies');
    });
  });
});
