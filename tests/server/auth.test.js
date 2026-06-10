const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server/index');
const User = require('../../server/models/User');

// Unique email generator to avoid collisions between test runs
const testEmail = () => `test_${Date.now()}_${Math.random().toString(36).slice(2)}@example.com`;

describe('POST /api/auth/register', () => {
  it('should reject registration with missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toMatch(/required/i);
  });

  it('should reject registration with short password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test User', email: testEmail(), password: '123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/6 characters/i);
  });

  it('should register a new user and return a token', async () => {
    const email = testEmail();
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test User', email, password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toHaveProperty('email', email);
    expect(res.body.user).toHaveProperty('name', 'Test User');
    expect(res.body.user).toHaveProperty('onboardingComplete', false);

    // Clean up
    await User.deleteOne({ email });
  });

  it('should reject duplicate email registration', async () => {
    const email = testEmail();

    // First registration
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'User One', email, password: 'password123' });

    // Duplicate attempt
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'User Two', email, password: 'password456' });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already exists/i);

    // Clean up
    await User.deleteOne({ email });
  });
});

describe('POST /api/auth/login', () => {
  const loginEmail = testEmail();
  const loginPassword = 'securepassword123';

  beforeAll(async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Login Test User', email: loginEmail, password: loginPassword });
  });

  afterAll(async () => {
    await User.deleteOne({ email: loginEmail });
  });

  it('should reject login with missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: loginEmail });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/required/i);
  });

  it('should reject login with wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: loginEmail, password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid/i);
  });

  it('should reject login with non-existent email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nonexistent@example.com', password: 'password123' });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid/i);
  });

  it('should login successfully and return a token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: loginEmail, password: loginPassword });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toHaveProperty('email', loginEmail);
    expect(res.body.user).toHaveProperty('name', 'Login Test User');
    expect(typeof res.body.token).toBe('string');
    expect(res.body.token.length).toBeGreaterThan(0);
  });
});
