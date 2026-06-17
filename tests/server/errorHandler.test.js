const request = require('supertest');
const app = require('../../server/index');

describe('Centralized Error Handler', () => {
  it('should return 404 for unknown routes', async () => {
    const res = await request(app).get('/api/nonexistent-route');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Route not found');
  });

  it('should return 400 for invalid JSON body', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{ invalid json }');

    // Express JSON parse errors should be caught
    expect(res.status).toBe(400);
  });

  it('should return 401 for missing auth token on protected routes', async () => {
    const res = await request(app).get('/api/user/profile');
    expect(res.status).toBe(401);
  });

  it('should return 401 for invalid auth token', async () => {
    const res = await request(app)
      .get('/api/user/profile')
      .set('Authorization', 'Bearer invalid_token_here');

    expect(res.status).toBe(401);
  });

  it('should handle Zod validation errors through action routes', async () => {
    // First register a user to get a valid token
    const email = `test_err_${Date.now()}_${Math.random().toString(36).slice(2)}@example.com`;
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Error Test User', email, password: 'password1234' });

    const cookieHeader = registerRes.headers['set-cookie']?.[0];
    const match = cookieHeader ? cookieHeader.match(/ctc_token=([^;]+)/) : null;
    const token = match ? match[1] : '';

    // Send an invalid action log — should be caught by Zod validation
    const res = await request(app)
      .post('/api/actions/log')
      .set('Authorization', `Bearer ${token}`)
      .send({ category: 'INVALID_CATEGORY', action: 'nothing' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();

    // Clean up
    const User = require('../../server/models/User');
    await User.deleteOne({ email });
  });
});
