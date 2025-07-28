import request from 'supertest';
import app from '../src/app';

describe('Simple Idea Test', () => {
  let accessToken: string;

  beforeAll(async () => {
    // Register a user
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'ideauser',
        email: 'idea@example.com',
        password: 'TestPassword123'
      });

    if (registerResponse.status === 201) {
      accessToken = registerResponse.body.data.tokens.accessToken;
    } else {
      // Try to login if user already exists
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          emailOrUsername: 'idea@example.com',
          password: 'TestPassword123'
        });
      
      accessToken = loginResponse.body.data.tokens.accessToken;
    }
  });

  it('should create a simple idea', async () => {
    const testIdea = {
      title: 'Simple Test Idea',
      description: 'This is a simple test idea.',
      tags: ['technology']
    };

    const response = await request(app)
      .post('/api/ideas')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(testIdea)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.idea.title).toBe(testIdea.title);
    expect(response.body.data.idea.voteCount).toBe(0);
  });
});