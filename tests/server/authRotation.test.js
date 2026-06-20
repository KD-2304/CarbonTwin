const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../server/index');
const User = require('../../server/models/User');
const RefreshToken = require('../../server/models/RefreshToken');
const { parseCookies } = require('../../server/utils/cookieHelper');

const testEmail = () => `rotation_user_${Date.now()}_${Math.random().toString(36).slice(2)}@example.com`;

describe('Auth Token Rotation and Expiry Integration Tests', () => {
  const email = testEmail();
  const password = 'password123';
  let testUser;

  beforeAll(async () => {
    // Register test user
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Rotation User', email, password, city: 'New York', country: 'USA' });
    expect(regRes.status).toBe(201);
    testUser = await User.findOne({ email });
  });

  afterAll(async () => {
    await User.deleteMany({ email });
    if (testUser) {
      await RefreshToken.deleteMany({ userId: testUser._id });
    }
  });

  const getCookieValue = (cookies, name) => {
    const parsed = parseCookies(cookies.join('; '));
    return parsed[name];
  };

  describe('Registration & Login Cookie Verification', () => {
    it('should set HttpOnly ctc_token, ctc_refresh_token, and ctc_csrf_token on login', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email, password });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body).toHaveProperty('csrfToken');

      const setCookies = loginRes.headers['set-cookie'];
      expect(setCookies).toBeDefined();

      const accessToken = getCookieValue(setCookies, 'ctc_token');
      const refreshToken = getCookieValue(setCookies, 'ctc_refresh_token');
      const csrfCookie = getCookieValue(setCookies, 'ctc_csrf_token');

      expect(accessToken).toBeDefined();
      expect(refreshToken).toBeDefined();
      expect(csrfCookie).toBeDefined();

      // Check if cookies are set with HttpOnly flag
      const isHttpOnly = (cookieName) => {
        const rawCookie = setCookies.find(c => c.startsWith(`${cookieName}=`));
        return rawCookie && rawCookie.toLowerCase().includes('httponly');
      };

      expect(isHttpOnly('ctc_token')).toBe(true);
      expect(isHttpOnly('ctc_refresh_token')).toBe(true);
      expect(isHttpOnly('ctc_csrf_token')).toBe(true);
    });
  });

  describe('POST /api/auth/refresh (Token Rotation)', () => {
    it('should rotate access and refresh tokens, updating the database record', async () => {
      // 1. Login to get initial cookies
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email, password });
      
      const initialCookies = loginRes.headers['set-cookie'];
      const initialRefresh = getCookieValue(initialCookies, 'ctc_refresh_token');

      // Ensure the initial refresh token exists in DB
      const dbInitialToken = await RefreshToken.findOne({ token: initialRefresh });
      expect(dbInitialToken).not.toBeNull();

      // 2. Perform refresh
      const refreshRes = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', initialCookies);

      expect(refreshRes.status).toBe(200);
      expect(refreshRes.body).toHaveProperty('csrfToken');

      const rotatedCookies = refreshRes.headers['set-cookie'];
      const newAccess = getCookieValue(rotatedCookies, 'ctc_token');
      const newRefresh = getCookieValue(rotatedCookies, 'ctc_refresh_token');

      expect(newAccess).toBeDefined();
      expect(newRefresh).toBeDefined();
      expect(newRefresh).not.toBe(initialRefresh);

      // Verify DB update: initial refresh token is deleted, new refresh token exists
      const dbOldTokenAfter = await RefreshToken.findOne({ token: initialRefresh });
      expect(dbOldTokenAfter).toBeNull();

      const dbNewTokenAfter = await RefreshToken.findOne({ token: newRefresh });
      expect(dbNewTokenAfter).not.toBeNull();
      expect(dbNewTokenAfter.userId.toString()).toBe(testUser._id.toString());
    });

    it('should reject refresh request with an invalid or missing refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', ['ctc_refresh_token=invalid_refresh_token_string']);

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/invalid|expired/i);
    });

    it('should reject refresh request using a previously revoked/rotated refresh token', async () => {
      // 1. Login to get a refresh token
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email, password });
      const initialCookies = loginRes.headers['set-cookie'];

      // 2. Perform refresh (which rotates and deletes the initial refresh token)
      const refreshRes1 = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', initialCookies);
      expect(refreshRes1.status).toBe(200);

      // 3. Try to use initial refresh token again
      const refreshRes2 = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', initialCookies);

      expect(refreshRes2.status).toBe(401);
      expect(refreshRes2.body.error).toMatch(/revoked/i);
    });
  });

  describe('Access Token Expiry Error Handling', () => {
    it('should return 401 with code TOKEN_EXPIRED when access token has expired', async () => {
      // Create an expired access token
      const expiredToken = jwt.sign(
        { userId: testUser._id },
        process.env.JWT_SECRET,
        { expiresIn: '0s' } // Expired immediately
      );

      const res = await request(app)
        .get('/api/user/profile')
        .set('Cookie', [`ctc_token=${expiredToken}`]);

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('code', 'TOKEN_EXPIRED');
      expect(res.body.error).toMatch(/expired/i);
    });
  });
});
