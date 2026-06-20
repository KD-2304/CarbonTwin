const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server/index');
const User = require('../../server/models/User');

const testEmail = () => `test_user_${Date.now()}_${Math.random().toString(36).slice(2)}@example.com`;

describe('User Profile and Settings API tests', () => {
  let cookieHeader;
  let csrfToken;
  let testUser;
  const email = testEmail();
  const password = 'password123';

  beforeAll(async () => {
    // 1. Register a test user
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test User', email, password, city: 'Mumbai', country: 'India' });
    
    expect(regRes.status).toBe(201);
    
    // Extract cookies and CSRF token
    cookieHeader = regRes.headers['set-cookie'] || [];
    csrfToken = regRes.body.csrfToken;
    
    // 2. Submit onboarding quiz to mark onboarding complete
    const onboardingRes = await request(app)
      .post('/api/quiz/submit')
      .set('Cookie', cookieHeader)
      .set('X-CTC-Request', csrfToken)
      .send({
        transport: { mode: 'car_petrol', weeklyKm: 100 },
        diet: 'omnivore',
        energy: { source: 'mixed', monthlyKwh: 200 },
        shopping: 'average',
        flights: { shortHaul: 2, longHaul: 1 }
      });
      
    expect(onboardingRes.status).toBe(200);
    
    testUser = await User.findOne({ email });
  });

  afterAll(async () => {
    await User.deleteMany({ email });
  });

  describe('GET /api/user/profile', () => {
    it('should reject unauthenticated request', async () => {
      const res = await request(app).get('/api/user/profile');
      expect(res.status).toBe(401);
    });

    it('should retrieve user profile with valid authentication', async () => {
      const res = await request(app)
        .get('/api/user/profile')
        .set('Cookie', cookieHeader);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('name', 'Test User');
      expect(res.body).toHaveProperty('email', email);
      expect(res.body).toHaveProperty('city', 'Mumbai');
      expect(res.body).toHaveProperty('country', 'India');
      expect(res.body).toHaveProperty('baselineScore');
      expect(res.body).toHaveProperty('currentScore');
      expect(res.body).toHaveProperty('onboardingComplete', true);
    });
  });

  describe('PUT /api/user/profile', () => {
    it('should reject unauthenticated update', async () => {
      const res = await request(app)
        .put('/api/user/profile')
        .set('Cookie', `ctc_csrf_token=${csrfToken}`)
        .set('X-CTC-Request', csrfToken)
        .send({ name: 'New Name' });
      expect(res.status).toBe(401);
    });

    it('should reject update missing CSRF validation header', async () => {
      const res = await request(app)
        .put('/api/user/profile')
        .set('Cookie', cookieHeader)
        .send({ name: 'New Name' });
      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/CSRF/i);
    });

    it('should reject update with invalid input parameters', async () => {
      const res = await request(app)
        .put('/api/user/profile')
        .set('Cookie', cookieHeader)
        .set('X-CTC-Request', csrfToken)
        .send({ name: 'A' }); // Name must be min 2 characters

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('should update user profile successfully with valid input', async () => {
      const res = await request(app)
        .put('/api/user/profile')
        .set('Cookie', cookieHeader)
        .set('X-CTC-Request', csrfToken)
        .send({ name: 'Updated Name', city: 'Delhi', country: 'India' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('name', 'Updated Name');
      expect(res.body).toHaveProperty('city', 'Delhi');
      
      // Verify in DB
      const dbUser = await User.findById(testUser._id);
      expect(dbUser.name).toBe('Updated Name');
      expect(dbUser.city).toBe('Delhi');
    });
  });

  describe('GET /api/user/score', () => {
    it('should retrieve score parameters successfully', async () => {
      const res = await request(app)
        .get('/api/user/score')
        .set('Cookie', cookieHeader);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('baselineScore');
      expect(res.body).toHaveProperty('currentScore');
      expect(res.body).toHaveProperty('weeklyScore');
      expect(res.body).toHaveProperty('scoreBreakdown');
      expect(res.body).toHaveProperty('dailySnapshots');
    });
  });

  describe('GET /api/user/dashboard-summary', () => {
    it('should retrieve full dashboard summary including history and actions', async () => {
      const res = await request(app)
        .get('/api/user/dashboard-summary')
        .set('Cookie', cookieHeader);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('profile');
      expect(res.body.profile).toHaveProperty('name');
      expect(res.body).toHaveProperty('history');
      expect(res.body).toHaveProperty('summary');
      expect(res.body.summary).toHaveProperty('totalActions');
      expect(res.body.summary).toHaveProperty('totalDelta');
    });
  });

  describe('PUT /api/user/goal', () => {
    it('should reject invalid goal values', async () => {
      const res = await request(app)
        .put('/api/user/goal')
        .set('Cookie', cookieHeader)
        .set('X-CTC-Request', csrfToken)
        .send({ targetGoal: -100 });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/between 0 and 50,000/i);
    });

    it('should reject missing goal parameters', async () => {
      const res = await request(app)
        .put('/api/user/goal')
        .set('Cookie', cookieHeader)
        .set('X-CTC-Request', csrfToken)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/required/i);
    });

    it('should update user goal successfully with valid number', async () => {
      const res = await request(app)
        .put('/api/user/goal')
        .set('Cookie', cookieHeader)
        .set('X-CTC-Request', csrfToken)
        .send({ targetGoal: 3500 });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('targetGoal', 3500);

      // Verify in DB
      const dbUser = await User.findById(testUser._id);
      expect(dbUser.targetGoal).toBe(3500);
    });
  });
});
