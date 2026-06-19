const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server/index');
const User = require('../../server/models/User');
const BlacklistedToken = require('../../server/models/BlacklistedToken');

const testEmail = () => `test_blacklist_${Date.now()}_${Math.random().toString(36).slice(2)}@example.com`;

const getCookieValue = (res, name) => {
  const cookies = res.headers['set-cookie'] || [];
  for (const cookie of cookies) {
    if (cookie.startsWith(`${name}=`)) {
      const match = cookie.match(new RegExp(`${name}=([^;]+)`));
      return match ? match[1] : null;
    }
  }
  return null;
};

describe('Token Blacklist and Revocation Integration Tests', () => {
  let userEmail = '';
  let userToken = '';
  let csrfToken = '';
  let cookies = [];

  beforeAll(async () => {
    userEmail = testEmail();
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Blacklist Test User', email: userEmail, password: 'password123' });

    csrfToken = res.body.csrfToken;
    cookies = res.headers['set-cookie'] || [];
    userToken = getCookieValue(res, 'ctc_token');
  });

  afterAll(async () => {
    await User.deleteOne({ email: userEmail });
    if (userToken) {
      await BlacklistedToken.deleteOne({ token: userToken });
    }
  });

  it('should allow accessing protected route with a valid session token', async () => {
    const res = await request(app)
      .get('/api/user/profile')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe(userEmail);
  });

  it('should add the token to the blacklist collection on logout', async () => {
    // Check initially not blacklisted
    const beforeCheck = await BlacklistedToken.findOne({ token: userToken });
    expect(beforeCheck).toBeNull();

    // Call logout route
    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${userToken}`)
      .set('Cookie', cookies)
      .set('x-ctc-request', csrfToken);

    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.message).toMatch(/logged out/i);

    // Verify token is in blacklist collection
    const afterCheck = await BlacklistedToken.findOne({ token: userToken });
    expect(afterCheck).not.toBeNull();
    expect(afterCheck.token).toBe(userToken);
  });

  it('should reject access to protected route once token is blacklisted', async () => {
    const res = await request(app)
      .get('/api/user/profile')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/session has been revoked/i);
  });

  it('should handle double logout / logging out with blacklisted token gracefully', async () => {
    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${userToken}`)
      .set('Cookie', cookies)
      .set('x-ctc-request', csrfToken);

    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.message).toMatch(/logged out/i);
  });
});
