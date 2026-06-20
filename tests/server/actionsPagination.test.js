const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server/index');
const User = require('../../server/models/User');
const Action = require('../../server/models/Action');

const testEmail = () => `paginate_user_${Date.now()}_${Math.random().toString(36).slice(2)}@example.com`;

describe('Actions History Cursor-Based Pagination', () => {
  let cookieHeader;
  let csrfToken;
  let testUser;
  const email = testEmail();
  const password = 'password123';

  beforeAll(async () => {
    // 1. Register test user
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Paginate User', email, password, city: 'London', country: 'UK' });
    expect(regRes.status).toBe(201);
    cookieHeader = regRes.headers['set-cookie'] || [];
    csrfToken = regRes.body.csrfToken;

    // 2. Submit quiz onboarding
    const onboardingRes = await request(app)
      .post('/api/quiz/submit')
      .set('Cookie', cookieHeader)
      .set('X-CTC-Request', csrfToken)
      .send({
        transport: { mode: 'bike', weeklyKm: 0 },
        diet: 'vegan',
        energy: { source: 'renewable', monthlyKwh: 50 },
        shopping: 'minimal',
        flights: { shortHaul: 0, longHaul: 0 }
      });
    expect(onboardingRes.status).toBe(200);

    testUser = await User.findOne({ email });

    // 3. Clear existing actions for this user just in case
    await Action.deleteMany({ userId: testUser._id });

    // 4. Seed 5 actions with controlled timestamps (e.g. 10m, 20m, 30m, 40m, 50m ago)
    const baseTime = Date.now();
    const seededActions = [];
    for (let i = 1; i <= 5; i++) {
      seededActions.push({
        userId: testUser._id,
        category: 'meal',
        action: 'vegan_meal',
        co2Delta: -1.5,
        notes: `Action #${i}`,
        timestamp: new Date(baseTime - i * 10 * 60 * 1000) // i = 1 (10m ago), i = 5 (50m ago)
      });
    }
    await Action.insertMany(seededActions);
  });

  afterAll(async () => {
    await User.deleteMany({ email });
    if (testUser) {
      await Action.deleteMany({ userId: testUser._id });
    }
  });

  it('should retrieve the first page with limit=2 (sorted descending by timestamp)', async () => {
    const res = await request(app)
      .get('/api/actions/history?limit=2')
      .set('Cookie', cookieHeader);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('actions');
    expect(res.body).toHaveProperty('nextCursor');
    expect(res.body).toHaveProperty('hasNextPage', true);
    expect(res.body.actions).toHaveLength(2);

    // Verify ordering: newest action first (Action #1: 10m ago, Action #2: 20m ago)
    expect(res.body.actions[0].notes).toBe('Action #1');
    expect(res.body.actions[1].notes).toBe('Action #2');

    // nextCursor should be equal to the timestamp of the last returned action (Action #2)
    const action2Time = new Date(res.body.actions[1].timestamp).toISOString();
    expect(res.body.nextCursor).toBe(action2Time);
  });

  it('should retrieve the second page using nextCursor as cursor', async () => {
    // 1. Get first page to retrieve cursor
    const firstPageRes = await request(app)
      .get('/api/actions/history?limit=2')
      .set('Cookie', cookieHeader);
    const cursor = firstPageRes.body.nextCursor;

    // 2. Fetch second page
    const res = await request(app)
      .get(`/api/actions/history?limit=2&cursor=${cursor}`)
      .set('Cookie', cookieHeader);

    expect(res.status).toBe(200);
    expect(res.body.actions).toHaveLength(2);
    expect(res.body.actions[0].notes).toBe('Action #3');
    expect(res.body.actions[1].notes).toBe('Action #4');
    expect(res.body.hasNextPage).toBe(true);

    const action4Time = new Date(res.body.actions[1].timestamp).toISOString();
    expect(res.body.nextCursor).toBe(action4Time);
  });

  it('should retrieve the third page and correctly signal hasNextPage as false', async () => {
    // 1. Fetch second page to get its cursor
    const page1Res = await request(app)
      .get('/api/actions/history?limit=2')
      .set('Cookie', cookieHeader);
    const page2Res = await request(app)
      .get(`/api/actions/history?limit=2&cursor=${page1Res.body.nextCursor}`)
      .set('Cookie', cookieHeader);
    const cursor = page2Res.body.nextCursor;

    // 2. Fetch third page
    const res = await request(app)
      .get(`/api/actions/history?limit=2&cursor=${cursor}`)
      .set('Cookie', cookieHeader);

    expect(res.status).toBe(200);
    expect(res.body.actions).toHaveLength(1);
    expect(res.body.actions[0].notes).toBe('Action #5');
    expect(res.body.hasNextPage).toBe(false);
    expect(res.body.nextCursor).toBeNull();
  });

  it('should support backward compatibility filter by days', async () => {
    const res = await request(app)
      .get('/api/actions/history?days=1')
      .set('Cookie', cookieHeader);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('actions');
    // All 5 actions seeded were within the last hour, so they should be returned
    expect(res.body.actions.length).toBeGreaterThanOrEqual(5);
  });
});
