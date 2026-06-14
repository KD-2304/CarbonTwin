const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server/index');
const User = require('../../server/models/User');
const Action = require('../../server/models/Action');

const testEmail = () => `test_val_${Date.now()}_${Math.random().toString(36).slice(2)}@example.com`;

describe('Quiz and Action Validation API Tests', () => {
  let userToken = '';
  let userEmail = '';
  let userId = '';

  beforeAll(async () => {
    userEmail = testEmail();
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Validation Test User', email: userEmail, password: 'password123' });
    
    const cookieHeader = res.headers['set-cookie']?.[0];
    const match = cookieHeader ? cookieHeader.match(/ctc_token=([^;]+)/) : null;
    userToken = match ? match[1] : '';
    userId = res.body.user.id;
  });

  afterAll(async () => {
    await Action.deleteMany({ userId });
    await User.deleteOne({ _id: userId });
  });

  describe('POST /api/quiz/submit validations', () => {
    it('should reject quiz with missing root fields', async () => {
      const res = await request(app)
        .post('/api/quiz/submit')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ diet: 'vegan' });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/required/i);
    });

    it('should reject quiz with invalid diet enum', async () => {
      const res = await request(app)
        .post('/api/quiz/submit')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          transport: { mode: 'bike', weeklyKm: 10 },
          diet: 'carnivore_extra',
          energy: { source: 'mixed', monthlyKwh: 100 },
          shopping: 'average',
          flights: { shortHaul: 0, longHaul: 0 }
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/diet/i);
    });

    it('should reject quiz with negative weeklyKm distance', async () => {
      const res = await request(app)
        .post('/api/quiz/submit')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          transport: { mode: 'car_petrol', weeklyKm: -5 },
          diet: 'omnivore',
          energy: { source: 'mixed', monthlyKwh: 100 },
          shopping: 'average',
          flights: { shortHaul: 0, longHaul: 0 }
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Weekly distance/i);
    });

    it('should reject quiz with abnormally high energy usage', async () => {
      const res = await request(app)
        .post('/api/quiz/submit')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          transport: { mode: 'car_petrol', weeklyKm: 100 },
          diet: 'omnivore',
          energy: { source: 'mixed', monthlyKwh: 999999 },
          shopping: 'average',
          flights: { shortHaul: 0, longHaul: 0 }
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Monthly energy/i);
    });

    it('should reject quiz with non-integer flights count', async () => {
      const res = await request(app)
        .post('/api/quiz/submit')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          transport: { mode: 'car_petrol', weeklyKm: 100 },
          diet: 'omnivore',
          energy: { source: 'mixed', monthlyKwh: 200 },
          shopping: 'average',
          flights: { shortHaul: 2.5, longHaul: 0 }
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Short-haul/i);
    });

    it('should submit successfully with correct values', async () => {
      const res = await request(app)
        .post('/api/quiz/submit')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          transport: { mode: 'car_petrol', weeklyKm: 100 },
          diet: 'omnivore',
          energy: { source: 'mixed', monthlyKwh: 200 },
          shopping: 'average',
          flights: { shortHaul: 2, longHaul: 1 }
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('baselineScore');
      expect(res.body).toHaveProperty('currentScore');
      expect(res.body).toHaveProperty('scoreBreakdown');
    });
  });

  describe('POST /api/actions/log validations', () => {
    it('should reject action with missing fields', async () => {
      const res = await request(app)
        .post('/api/actions/log')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ action: 'vegan_meal' });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/required/i);
    });

    it('should reject action with invalid category', async () => {
      const res = await request(app)
        .post('/api/actions/log')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ category: 'invalid_cat', action: 'vegan_meal' });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/category/i);
    });

    it('should reject action mismatched with its category', async () => {
      const res = await request(app)
        .post('/api/actions/log')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ category: 'home', action: 'vegan_meal' });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/action for category/i);
    });

    it('should reject transport action with invalid distance', async () => {
      const res = await request(app)
        .post('/api/actions/log')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ category: 'transport', action: 'took_car', km: -10 });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Distance/i);
    });

    it('should log valid action successfully', async () => {
      const res = await request(app)
        .post('/api/actions/log')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ category: 'meal', action: 'vegan_meal', notes: 'Very tasty dinner!' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('updatedScore');
      expect(res.body).toHaveProperty('streak');
      expect(res.body).toHaveProperty('weeklyScore');
      expect(res.body.action).toHaveProperty('co2Delta', -0.5);
    });
  });
});
