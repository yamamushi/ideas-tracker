import request from 'supertest';
import app from '../src/app';
import { UserModel } from '../src/models/User';

describe('Authentication', () => {
  const testUser = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'TestPassword123'
  };

  // Store user ID for login tests
  let createdUserId: number;

  // Clean database before starting auth tests
  beforeAll(async () => {
    const { db } = await import('../src/utils/databaseAdapter');
    await db.query('DELETE FROM votes');
    await db.query('DELETE FROM comments'); 
    await db.query('DELETE FROM ideas');
    await db.query('DELETE FROM users');
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user with valid data', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.username).toBe(testUser.username);
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.tokens.accessToken).toBeDefined();
      expect(response.body.data.tokens.refreshToken).toBeDefined();
    });

    it('should reject registration with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...testUser,
          email: 'invalid-email'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject registration with weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...testUser,
          password: 'weak'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject registration with short username', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...testUser,
          username: 'ab'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeAll(async () => {
      // Create a user for login tests
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(testUser);
      
      if (registerResponse.status === 201) {
        createdUserId = registerResponse.body.data.user.id;
      }
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          emailOrUsername: testUser.email,
          password: testUser.password
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.username).toBe(testUser.username);
      expect(response.body.data.tokens.accessToken).toBeDefined();
      expect(response.body.data.tokens.refreshToken).toBeDefined();
    });

    it('should login with username instead of email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          emailOrUsername: testUser.username,
          password: testUser.password
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.username).toBe(testUser.username);
    });

    it('should reject login with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          emailOrUsername: testUser.email,
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should reject login with non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          emailOrUsername: 'nonexistent@example.com',
          password: testUser.password
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('GET /api/auth/me', () => {
    let accessToken: string;

    beforeAll(async () => {
      // Add delay before /me tests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Create a user for /me tests
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'meuser',
          email: 'me@example.com',
          password: 'TestPassword123'
        });

      // If registration failed due to existing user or rate limiting, that's ok
      if (registerResponse.status !== 201 && registerResponse.status !== 400 && registerResponse.status !== 429) {
        throw new Error(`Registration failed: ${registerResponse.status} ${registerResponse.text}`);
      }

      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          emailOrUsername: 'me@example.com',
          password: 'TestPassword123'
        });
      
      if (loginResponse.status !== 200) {
        throw new Error(`Login failed: ${loginResponse.status} ${loginResponse.text}`);
      }
      
      accessToken = loginResponse.body.data.tokens.accessToken;
    });

    it('should return user info with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.username).toBe('meuser');
      expect(response.body.data.user.email).toBe('me@example.com');
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });
  });
});